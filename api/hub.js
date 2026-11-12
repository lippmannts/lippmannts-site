/* GET /api/hub            · lista de publicações (artigos e notícias) publicadas
   GET /api/hub?slug=xxx   · uma publicação completa */
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  try {
    const q = new URL(req.url, "http://x").searchParams;
    const slug = U.limpar((req.query && req.query.slug) || q.get("slug"), 100);
    if (slug) {
      const { data, error } = await db().from("conteudos_hub").select("slug, tipo, titulo, resumo, corpo_html, capa, youtube, tags, autor, publicado_em").eq("slug", slug).eq("publicado", true).maybeSingle();
      if (error) throw error;
      if (!data) return U.erro(res, "Publicação não encontrada.", 404);
      return cache(res, { ok: true, item: data });
    }
    const { data, error } = await db().from("conteudos_hub").select("slug, tipo, titulo, resumo, capa, youtube, tags, autor, publicado_em").eq("publicado", true).order("publicado_em", { ascending: false }).limit(200);
    if (error) throw error;
    return cache(res, { ok: true, itens: data || [] });
  } catch (e) {
    console.error("hub:", e);
    return U.erro(res, "Publicações indisponíveis no momento.", 500);
  }
};
function cache(res, dados) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  res.end(JSON.stringify(dados));
}
