/* =====================================================================
   /api/site?modulo=avaliacoes  (endereço antigo /api/avaliacoes também funciona)
   Avaliações reais do Google da "Lippmann Treinamentos & Soluções" · Places API (New) v1

   - Chamado pelo roteador api/site.js: este arquivo exporta UMA função (req, res).
     Fica em api/_rotas/, então NÃO conta como função da Vercel (a pasta api/ segue com 7).
   - Cache de 24 horas na tabela "config" do Supabase (chave "google_avaliacoes_cache"):
     o Google é consultado no máximo 1 vez por dia; as visitas leem a cópia do banco.
   - Se o Google falhar, devolve a última cópia boa e só tenta de novo depois de 1 hora.
   - Nunca derruba a função: qualquer erro vira { ok:false } e a página mostra os depoimentos de reserva.

   Variáveis da Vercel:
     GOOGLE_PLACES_API_KEY  (obrigatória · Places API (New) ativada no Google Cloud)
     GOOGLE_PLACE_ID        (opcional · padrão: ChIJD_H4-aMgJ1wR2Z25wRuFG8I, o Place ID oficial da LIPPMANN)
   ===================================================================== */
const PLACE_ID_PADRAO = "ChIJD_H4-aMgJ1wR2Z25wRuFG8I";             // Place ID oficial da LIPPMANN no Google
const FICHA = "CdmducEbhRvCEAE";                                   // ficha oficial (g.page/r/CdmducEbhRvCEAE)
const NOME = "Lippmann Treinamentos & Soluções";
const AVALIAR = "https://g.page/r/" + FICHA + "/review";            // link oficial de avaliação
const PERFIL = "https://g.page/r/" + FICHA;
const CHAVE_CACHE = "google_avaliacoes_cache";
const VALIDADE = 24 * 60 * 60 * 1000;                               // 24 horas
const ESPERA_ERRO = 60 * 60 * 1000;                                 // 1 hora após uma falha
const API = "https://places.googleapis.com/v1";

/* ---------- banco (tabela config) · nunca lança erro ---------- */
function banco() {
  try { return require("../_lib/supabase"); } catch (e) { console.error("avaliacoes: supabase indisponível:", e.message); return null; }
}
async function lerCache() {
  try {
    const S = banco(); if (!S || !S.configGet) return null;
    const v = await S.configGet(CHAVE_CACHE, "");
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { console.error("avaliacoes: leitura do cache:", e.message || e); return null; }
}
async function gravarCache(valor) {
  try { const S = banco(); if (S && S.configSet) await S.configSet(CHAVE_CACHE, JSON.stringify(valor)); }
  catch (e) { console.error("avaliacoes: gravação do cache:", e.message || e); }
}

/* ---------- Places API (New) ---------- */
async function googleJson(url, opcoes) {
  const r = await fetch(url, opcoes);
  const texto = await r.text();
  let j = {}; try { j = texto ? JSON.parse(texto) : {}; } catch (e) { j = { bruto: texto.slice(0, 200) }; }
  if (!r.ok) throw new Error("Google " + r.status + ": " + ((j.error && j.error.message) || j.bruto || "erro"));
  return j;
}

/* Place Details (New): nota, total e avaliações */
async function buscarAvaliacoes(chave, placeId) {
  const j = await googleJson(API + "/places/" + encodeURIComponent(placeId) + "?languageCode=pt-BR", {
    method: "GET",
    headers: { "X-Goog-Api-Key": chave, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
  });
  const reviews = (j.reviews || [])
    .map((x) => {
      const autor = x.authorAttribution || {};
      const texto = (x.text && x.text.text) || (x.originalText && x.originalText.text) || "";
      return {
        nome: autor.displayName || "Cliente Google",
        foto: autor.photoUri || "",
        perfil: autor.uri || "",
        nota: Number(x.rating) || 5,
        relativo: x.relativePublishTimeDescription || "",
        data: x.publishTime || null,
        texto: texto,
        link: x.googleMapsUri || "",
      };
    })
    .filter((x) => x.texto);
  return {
    nome: NOME,
    nota: typeof j.rating === "number" ? j.rating : null,
    total: Number(j.userRatingCount) || 0,
    reviews: reviews,
    url: PERFIL,
    avaliar: AVALIAR,
  };
}

/* ---------- resposta ---------- */
function responder(res, corpo, cacheCdn) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheCdn || "public, s-maxage=300");
  res.end(JSON.stringify(Object.assign({ avaliar: AVALIAR, url: PERFIL }, corpo)));
}
const CDN_LONGO = "public, s-maxage=3600, stale-while-revalidate=86400";

module.exports = async function avaliacoes(req, res) {
  try {
    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405; res.setHeader("Allow", "GET");
      return res.end(JSON.stringify({ ok: false, mensagem: "Método não permitido." }));
    }
    const chave = process.env.GOOGLE_PLACES_API_KEY;
    if (!chave) return responder(res, { ok: false, configurado: false });

    const placeId = (process.env.GOOGLE_PLACE_ID || "").trim() || PLACE_ID_PADRAO;
    const lido = await lerCache();
    const cache = lido && (!lido.place_id || lido.place_id === placeId) ? lido : null;   // trocou o Place ID? ignora a cópia antiga
    const agora = Date.now();
    const temDados = !!(cache && cache.dados);
    const fresco = temDados && agora - (cache.em || 0) < VALIDADE;
    const emEspera = !!(cache && cache.erro_em && agora - cache.erro_em < ESPERA_ERRO);

    // 1) cópia do banco ainda válida (ou Google em espera após falha): não consulta o Google
    if (fresco || (temDados && emEspera)) {
      return responder(res, Object.assign({ ok: true, cache: true, atualizado: new Date(cache.em).toISOString() }, cache.dados), CDN_LONGO);
    }
    if (emEspera) return responder(res, { ok: false, configurado: true });

    // 2) cache vencido: consulta o Google (no máximo 1 vez a cada 24 h)
    try {
      const dados = await buscarAvaliacoes(chave, placeId);
      await gravarCache({ em: agora, place_id: placeId, dados: dados });
      return responder(res, Object.assign({ ok: true, cache: false, atualizado: new Date(agora).toISOString() }, dados), CDN_LONGO);
    } catch (e) {
      console.error("avaliacoes: Google:", e.message || e);
      await gravarCache(Object.assign({}, cache || {}, { erro_em: agora, erro: String(e.message || e).slice(0, 300) }));
      if (temDados) return responder(res, Object.assign({ ok: true, cache: true, atualizado: new Date(cache.em).toISOString() }, cache.dados), "public, s-maxage=600");
      return responder(res, { ok: false, configurado: true });
    }
  } catch (e) {
    console.error("avaliacoes: falha geral:", e && (e.stack || e.message || e));
    try { return responder(res, { ok: false }); } catch (x) { /* resposta já enviada */ }
  }
};
module.exports.PLACE_ID_PADRAO = PLACE_ID_PADRAO;
