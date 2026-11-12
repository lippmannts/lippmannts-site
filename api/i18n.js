/* GET /api/i18n?l=en-US · traduções editadas no L³ INTEGRA (Site e conteúdo › Traduções).
   O navegador aplica estas edições por cima dos dicionários de /data/i18n/. */
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");
const IDIOMAS = ["pt-PT", "en-US", "en-GB", "es-ES"];

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  const q = new URL(req.url, "http://x").searchParams;
  const l = String((req.query && req.query.l) || q.get("l") || "");
  if (!IDIOMAS.includes(l)) return U.erro(res, "Idioma inválido.", 400);
  try {
    const textos = {};
    for (let de = 0; ; de += 1000) {   // paginação do Supabase (1.000 linhas por vez)
      const { data, error } = await db().from("i18n_textos").select("pt, traducao").eq("idioma", l).range(de, de + 999);
      if (error) throw error;
      (data || []).forEach((x) => { textos[x.pt] = x.traducao; });
      if (!data || data.length < 1000) break;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    res.end(JSON.stringify({ ok: true, idioma: l, textos }));
  } catch (e) {
    console.error("i18n:", e);
    res.statusCode = 200;   // sem edições: o site segue só com os dicionários
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, idioma: l, textos: {} }));
  }
};
module.exports.IDIOMAS = IDIOMAS;
