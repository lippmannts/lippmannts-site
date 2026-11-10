/* GET /api/materiais · lista pública dos materiais da Biblioteca Técnica (aba Conteúdo)
   Os PDFs ficam no bucket público "materiais" do Supabase Storage. */
const { db, BUCKET_MATERIAIS } = require("./_lib/supabase");
const U = require("./_lib/util");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  try {
    const { data, error } = await db().from("materiais").select("id, titulo, area, tipo, tema, resumo, arquivo, youtube, paginas").eq("ativo", true).order("ordem").order("criado");
    if (error) throw error;
    const lista = (data || []).map((m) => ({
      ...m,
      arquivo: m.arquivo ? (/^https?:\/\//.test(m.arquivo) || m.arquivo.startsWith("materiais/") ? m.arquivo : db().storage.from(BUCKET_MATERIAIS).getPublicUrl(m.arquivo).data.publicUrl) : "",
    }));
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.end(JSON.stringify({ ok: true, materiais: lista }));
  } catch (e) {
    console.error("materiais:", e);
    return U.erro(res, "Materiais indisponíveis no momento.", 500);
  }
};
