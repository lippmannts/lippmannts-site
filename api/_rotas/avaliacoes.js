/* =====================================================================
   /api/site?modulo=avaliacoes  (o endereço antigo /api/avaliacoes também funciona)
   Avaliações reais do Google da "Lippmann Treinamentos & Soluções" · Places API (New) v1

   - Chamado pelo roteador api/site.js: exporta UMA função (req, res).
     Fica em api/_rotas/, então NÃO conta como função da Vercel (api/ segue com 7).
   - Sucesso: cópia guardada por 24 h na tabela "config" (chave "google_avaliacoes_cache").
   - Erro do Google: a resposta traz o motivo real em "erro_google" (status HTTP, mensagem e dica)
     e NADA é gravado no cache, então dá para testar de novo na hora. Respostas de erro não ficam na CDN.
   - Se já existir uma cópia boa, ela continua sendo exibida mesmo com o Google falhando (com o erro junto).
   - Forçar nova consulta ao Google (ignora o cache de 24 h):
       /api/site?modulo=avaliacoes&atualizar=SEU_CRON_SECRET
   - Ver o que está guardado e a última falha (sem chamar o Google):
       /api/site?modulo=avaliacoes&diagnostico=SEU_CRON_SECRET

   Variáveis da Vercel:
     GOOGLE_PLACES_API_KEY  (obrigatória · Places API (New) ativada no projeto da chave)
     GOOGLE_PLACE_ID        (opcional · padrão: ChIJD_H4-aMgJ1wR2Z25wRuFG8I)
   Comentários: a cópia só é gravada (e só é usada) se tiver pelo menos 1 avaliação.
   ===================================================================== */
const PLACE_ID_PADRAO = "ChIJD_H4-aMgJ1wR2Z25wRuFG8I";
const FICHA = "CdmducEbhRvCEAE";
const NOME = "Lippmann Treinamentos & Soluções";
const AVALIAR = "https://g.page/r/" + FICHA + "/review";
const PERFIL = "https://g.page/r/" + FICHA;
const CHAVE_CACHE = "google_avaliacoes_cache";
const VALIDADE = 24 * 60 * 60 * 1000;
const API = "https://places.googleapis.com/v1/places/";
const CAMPOS = "rating,userRatingCount,reviews.name,reviews.rating,reviews.text,reviews.originalText,reviews.authorAttribution,reviews.relativePublishTimeDescription,reviews.publishTime";

/* limpa variáveis coladas com espaços, quebras de linha ou aspas */
const limparEnv = (v) => String(v || "").replace(/[\s"'`]/g, "");

/* ---------- banco (tabela config) · nunca lança erro ---------- */
function banco() { try { return require("../_lib/supabase"); } catch (e) { console.error("avaliacoes: supabase:", e.message); return null; } }
async function lerCache() {
  try {
    const S = banco(); if (!S || !S.configGet) return null;
    const v = await S.configGet(CHAVE_CACHE, "");
    if (!v) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch (e) { console.error("avaliacoes: leitura do cache:", e.message || e); return null; }
}
async function gravarCache(valor) {
  try { const S = banco(); if (S && S.configSet) { await S.configSet(CHAVE_CACHE, JSON.stringify(valor)); return true; } }
  catch (e) { console.error("avaliacoes: gravação do cache:", e.message || e); }
  return false;
}

/* ---------- dicas para os erros mais comuns da Places API (New) ---------- */
function dica(status, msg, motivo) {
  const m = String(msg || "") + " " + String(motivo || "");
  if (/referer|referrer/i.test(m)) return "A chave está restrita a 'Sites (referenciadores HTTP)'. Chamadas do servidor não têm referenciador: em Google Cloud › Credenciais › sua chave › Restrições do aplicativo, escolha 'Nenhuma' (mantenha a restrição de API: Places API (New)).";
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(m)) return "A Places API (New) não está ativada no projeto desta chave. Google Cloud › APIs e serviços › Biblioteca › 'Places API (New)' › Ativar. Aguarde 5 minutos.";
  if (/API_KEY_SERVICE_BLOCKED|blocked/i.test(m)) return "A chave tem restrição de API que não inclui a Places API (New). Em Credenciais › sua chave › Restrições de API, marque 'Places API (New)'.";
  if (/API key not valid|API_KEY_INVALID/i.test(m)) return "A chave é inválida. Copie de novo em Google Cloud › Credenciais e cole na Vercel sem espaços; depois faça Redeploy.";
  if (/billing|BILLING/i.test(m)) return "O projeto do Google Cloud precisa de uma conta de faturamento vinculada (o uso fica no crédito gratuito).";
  if (status === 404 || /NOT_FOUND|not found/i.test(m)) return "Place ID não encontrado. Confira GOOGLE_PLACE_ID (padrão ChIJD_H4-aMgJ1wR2Z25wRuFG8I).";
  if (status === 400 && /field ?mask/i.test(m)) return "Problema no X-Goog-FieldMask enviado.";
  if (status === 429) return "Limite de chamadas atingido. Aguarde alguns minutos.";
  if (status === 0) return "O servidor não conseguiu falar com places.googleapis.com (rede ou tempo esgotado).";
  return "";
}

/* ---------- Place Details (New) ---------- */
async function consultarGoogle(chave, placeId, idioma) {
  const url = API + encodeURIComponent(placeId) + (idioma ? "?languageCode=" + idioma : "");
  let r, texto;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    r = await fetch(url, { method: "GET", headers: { "X-Goog-Api-Key": chave, "X-Goog-FieldMask": CAMPOS, "Accept": "application/json" }, signal: ctl.signal });
    clearTimeout(t);
    texto = await r.text();
  } catch (e) {
    return { ok: false, erro: { status: 0, mensagem: String((e && e.message) || e), dica: dica(0) } };
  }
  let j = {}; try { j = texto ? JSON.parse(texto) : {}; } catch (e) { j = { bruto: String(texto).slice(0, 300) }; }
  if (!r.ok) {
    const er = j.error || {};
    const motivo = (er.details || []).map((d) => d.reason || (d.metadata && d.metadata.service) || "").filter(Boolean).join(", ");
    return { ok: false, erro: { status: r.status, codigo: er.status || "", mensagem: er.message || j.bruto || r.statusText, motivo, detalhes: er.details || null, dica: dica(r.status, er.message, motivo + " " + (er.status || "")) } };
  }
  const brutos = Array.isArray(j.reviews) ? j.reviews : [];
  const reviews = brutos.map((r) => {
    const a = r.authorAttribution || {};
    return {
      nome: a.displayName || "Cliente Google",
      foto: a.photoUri || "",
      perfil: a.uri || "",
      nota: Number(r.rating) || 5,
      relativo: r.relativePublishTimeDescription || "",
      data: r.publishTime || null,
      texto: (r.text && r.text.text) || (r.originalText && r.originalText.text) || "",
      id: r.name || "",
    };
  });   // avaliações só com estrelas (sem texto) também entram
  return { ok: true, brutos: brutos.length, dados: { nome: NOME, nota: typeof j.rating === "number" ? j.rating : null, total: Number(j.userRatingCount) || 0, reviews, url: PERFIL, avaliar: AVALIAR } };
}

/* ---------- resposta ---------- */
function responder(res, corpo, cache) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cache || "no-store");
  res.end(JSON.stringify(Object.assign({ avaliar: AVALIAR, url: PERFIL }, corpo)));
}
const CDN_OK = "public, s-maxage=3600, stale-while-revalidate=86400";

module.exports = async function avaliacoes(req, res) {
  try {
    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405; res.setHeader("Allow", "GET");
      return res.end(JSON.stringify({ ok: false, mensagem: "Método não permitido." }));
    }
    const q = new URL(req.url || "/", "http://x").searchParams;
    const segredo = limparEnv(process.env.CRON_SECRET);
    const autorizado = (v) => !!segredo && v === segredo;
    const chave = limparEnv(process.env.GOOGLE_PLACES_API_KEY);
    const placeId = limparEnv(process.env.GOOGLE_PLACE_ID) || PLACE_ID_PADRAO;

    if (!chave) return responder(res, { ok: false, configurado: false, erro_google: { status: 0, mensagem: "Variável GOOGLE_PLACES_API_KEY vazia ou ausente nesta implantação.", dica: "Vercel › Settings › Environment Variables › marque Production › Redeploy." } });

    const lido = await lerCache();
    const cache = lido && lido.dados && Array.isArray(lido.dados.reviews) && lido.dados.reviews.length && (!lido.place_id || lido.place_id === placeId) ? lido : null;   // cópia sem comentários é ignorada
    const agora = Date.now();

    if (autorizado(q.get("diagnostico"))) {
      return responder(res, { ok: true, diagnostico: { place_id: placeId, chave: chave.slice(0, 6) + "…" + chave.slice(-4) + " (" + chave.length + " caracteres)", cache_em: cache ? new Date(cache.em).toISOString() : null, avaliacoes_no_cache: cache ? (cache.dados.reviews || []).length : 0, ultima_falha: lido && lido.ultima_falha || null } });
    }

    const forcar = autorizado(q.get("atualizar"));
    if (cache && !forcar && agora - (cache.em || 0) < VALIDADE) {
      return responder(res, Object.assign({ ok: true, cache: true, atualizado: new Date(cache.em).toISOString() }, cache.dados), CDN_OK);
    }

    let r = await consultarGoogle(chave, placeId, "pt-BR");
    if (r.ok && !r.dados.reviews.length) {   // sem comentários em pt-BR: tenta sem idioma (o Google devolve no idioma original)
      const r2 = await consultarGoogle(chave, placeId, "");
      if (r2.ok && r2.dados.reviews.length) r = r2;
    }
    if (r.ok && r.dados.reviews.length) {
      const gravou = await gravarCache({ em: agora, place_id: placeId, dados: r.dados });
      return responder(res, Object.assign({ ok: true, cache: false, cache_gravado: gravou, atualizado: new Date(agora).toISOString() }, r.dados), CDN_OK);
    }
    if (r.ok) {   // nota e total vieram, mas nenhum comentário: NÃO grava cache (tenta de novo na próxima visita)
      console.warn("avaliacoes: Google respondeu sem comentários (reviews brutos: " + r.brutos + ")");
      if (cache) return responder(res, Object.assign({ ok: true, cache: true, atualizado: new Date(cache.em).toISOString() }, cache.dados));
      return responder(res, Object.assign({ ok: true, cache: false, cache_gravado: false, aviso: "O Google devolveu a nota e o total, mas nenhum comentário. Nada foi gravado no cache.", reviews_brutos: r.brutos }, r.dados));
    }

    console.error("avaliacoes: Google " + r.erro.status + " " + r.erro.codigo + ": " + r.erro.mensagem);
    if (lido) await gravarCache(Object.assign({}, lido, { ultima_falha: { em: new Date(agora).toISOString(), status: r.erro.status, mensagem: String(r.erro.mensagem).slice(0, 300) } }));   // só registra; não bloqueia novos testes
    if (cache) return responder(res, Object.assign({ ok: true, cache: true, atualizado: new Date(cache.em).toISOString(), erro_google: r.erro }, cache.dados));
    return responder(res, { ok: false, configurado: true, place_id: placeId, erro_google: r.erro });
  } catch (e) {
    console.error("avaliacoes: falha geral:", e && (e.stack || e.message || e));
    try { return responder(res, { ok: false, erro_google: { status: 0, mensagem: "Falha interna: " + String((e && e.message) || e) } }); } catch (x) { /* resposta já enviada */ }
  }
};
module.exports.PLACE_ID_PADRAO = PLACE_ID_PADRAO;
