/* =====================================================================
   /api/site?modulo=avaliacoes · avaliações reais do perfil oficial no Google
   "Lippmann Treinamentos & Soluções" (Places API · New), com cache de 24 horas no banco.

   - Identificador oficial da ficha: CdmducEbhRvCEAE (o mesmo do link g.page/r/CdmducEbhRvCEAE/review).
     Dele sai o CID do perfil; o Place ID é descoberto uma única vez (Text Search) e guardado no banco.
   - O Google é consultado NO MÁXIMO 1 vez a cada 24 horas (cerca de 30 consultas por mês).
     Todas as visitas leem a cópia guardada na tabela config, e a CDN da Vercel ainda guarda a resposta por 1 hora.
   - Se o Google falhar, continua exibindo a última cópia boa e só tenta de novo depois de 1 hora.
   Variáveis da Vercel: GOOGLE_PLACES_API_KEY (obrigatória) · GOOGLE_PLACE_ID (opcional, pula a descoberta).
   Sem a chave, responde { ok:false } e a página usa os depoimentos de reserva.
   ===================================================================== */
const U = require("../_lib/util");
const { configGet, configSet } = require("../_lib/supabase");

const FICHA = "CdmducEbhRvCEAE";
const NOME = "Lippmann Treinamentos & Soluções";
const AVALIAR = `https://g.page/r/${FICHA}/review`;
const PERFIL = `https://g.page/r/${FICHA}`;
const CHAVE_CACHE = "google_avaliacoes_cache";
const VALIDADE = 24 * 3600 * 1000, ESPERA_ERRO = 3600 * 1000;

/* CID do perfil a partir do identificador da ficha (base64url de um protobuf: 0x09 + 8 bytes little-endian) */
function cidDaFicha(f) {
  try {
    const b = Buffer.from(f.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((f.length + 3) % 4), "base64");
    if (b[0] !== 0x09 || b.length < 9) return null;
    return b.readBigUInt64LE(1).toString();
  } catch (e) { return null; }
}
const CID = cidDaFicha(FICHA);

const ler = async () => { try { return JSON.parse((await configGet(CHAVE_CACHE, "")) || "null"); } catch (e) { return null; } };
const gravar = (v) => configSet(CHAVE_CACHE, JSON.stringify(v)).catch((e) => console.error("avaliacoes cache:", e.message || e));

async function descobrirPlaceId(chave) {
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": chave, "X-Goog-FieldMask": "places.id,places.googleMapsUri,places.displayName" },
    body: JSON.stringify({ textQuery: NOME, languageCode: "pt-BR", regionCode: "BR" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Text Search " + r.status + ": " + JSON.stringify(j).slice(0, 200));
  const lista = j.places || [];
  const certo = lista.find((p) => CID && String(p.googleMapsUri || "").includes("cid=" + CID))
    || lista.find((p) => /lippmann/i.test(((p.displayName || {}).text) || ""));
  if (!certo) throw new Error("Perfil não encontrado no Google Places.");
  return certo.id;
}

async function buscarGoogle(chave, placeId) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`, {
    headers: { "X-Goog-Api-Key": chave, "X-Goog-FieldMask": "displayName,rating,userRatingCount,googleMapsUri,reviews" },
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Place Details " + r.status + ": " + JSON.stringify(j).slice(0, 200));
  const reviews = (j.reviews || []).filter((x) => x.text && x.text.text).map((x) => ({
    nome: (x.authorAttribution || {}).displayName || "Cliente Google",
    perfil: (x.authorAttribution || {}).uri || "",
    foto: (x.authorAttribution || {}).photoUri || "",
    nota: x.rating || 5,
    texto: (x.originalText && x.originalText.text) || x.text.text,
    data: x.publishTime || null,
    relativo: x.relativePublishTimeDescription || "",
    link: x.googleMapsUri || "",
  }));
  return { nome: (j.displayName || {}).text || NOME, nota: j.rating || null, total: j.userRatingCount || 0, reviews, url: j.googleMapsUri || PERFIL };
}

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  const sair = (dados, cache) => { res.statusCode = 200; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", cache || "public, s-maxage=300"); res.end(JSON.stringify({ avaliar: AVALIAR, ...dados })); };
  const chave = process.env.GOOGLE_PLACES_API_KEY;
  if (!chave) return sair({ ok: false, configurado: false });

  const cache = await ler();
  const agora = Date.now();
  const fresco = cache && cache.dados && agora - (cache.em || 0) < VALIDADE;
  const esperando = cache && cache.erro_em && agora - cache.erro_em < ESPERA_ERRO;
  if (fresco || (cache && cache.dados && esperando)) return sair({ ok: true, ...cache.dados, atualizado: new Date(cache.em).toISOString() }, "public, s-maxage=3600, stale-while-revalidate=86400");
  if (esperando) return sair({ ok: false, configurado: true });

  try {
    const placeId = process.env.GOOGLE_PLACE_ID || (cache && cache.place_id) || await descobrirPlaceId(chave);
    const dados = await buscarGoogle(chave, placeId);
    await gravar({ em: agora, place_id: placeId, dados });
    return sair({ ok: true, ...dados, atualizado: new Date(agora).toISOString() }, "public, s-maxage=3600, stale-while-revalidate=86400");
  } catch (e) {
    console.error("avaliacoes:", e.message || e);
    await gravar({ ...(cache || {}), erro_em: agora, erro: String(e.message || e).slice(0, 300) });
    if (cache && cache.dados) return sair({ ok: true, ...cache.dados, atualizado: new Date(cache.em).toISOString() }, "public, s-maxage=600");
    return sair({ ok: false, configurado: true });
  }
};
module.exports.cidDaFicha = cidDaFicha;
