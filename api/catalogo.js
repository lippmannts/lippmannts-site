/* GET /api/catalogo · treinamentos ativos (editados no L³ INTEGRA › Treinamentos)
   GET /api/catalogo?tipo=solucoes · soluções ativas e grupos (L³ INTEGRA › Soluções) */
const { db, configGet } = require("./_lib/supabase");
const U = require("./_lib/util");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  try {
    if ((req.query || {}).tipo === "solucoes") {
      const { data, error } = await db().from("catalogo_solucoes").select("id, grupo, titulo, texto, ordem").eq("ativo", true).order("ordem").order("titulo");
      if (error) throw error;
      let grupos = null; try { grupos = JSON.parse(await configGet("solucoes_grupos", "null")); } catch (e) {}
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
      return res.end(JSON.stringify({ ok: true, solucoes: data || [], grupos }));
    }
    const { data, error } = await db().from("catalogo_treinamentos").select("*").eq("ativo", true).order("ordem").order("titulo");
    if (error) throw error;
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    res.end(JSON.stringify({ ok: true, treinamentos: (data || []).map(publico) }));
  } catch (e) {
    console.error("catalogo:", e);
    return U.erro(res, "Catálogo indisponível no momento.", 500);
  }
};
function publico(t) {
  return { id: t.id, nr: t.nr, norma: t.norma, titulo: t.titulo, categoria: t.categoria, resumo: t.resumo, carga_horaria: t.carga_horaria, modalidade: t.modalidade, tags: t.tags || [], imagem: t.imagem, youtube: t.youtube, aprender: t.aprender || [], publico: t.publico || [], prerequisito: t.prerequisito, beneficios: t.beneficios || [], porque: t.porque, atestado: t.atestado, extra: t.extra, ficha_pdf: t.ficha_pdf };
}
