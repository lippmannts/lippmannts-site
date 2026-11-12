/* GET /api/politicas · políticas corporativas e Termo de Compromisso Social (aba A LIPPMANN) */
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  try {
    const { data, error } = await db().from("politicas_documentos").select("id, codigo, revisao, titulo, resumo, arquivo, capa, protegido, corpo_html, paginas").eq("ativo", true).order("ordem");
    if (error) throw error;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    res.end(JSON.stringify({ ok: true, politicas: (data || []).map((p) => ({ ...p, corpo: p.protegido ? p.corpo_html : undefined, corpo_html: undefined })) }));
  } catch (e) {
    console.error("politicas:", e);
    return U.erro(res, "Políticas indisponíveis no momento.", 500);
  }
};
