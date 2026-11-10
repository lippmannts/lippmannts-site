/* POST /api/evento · estatísticas de navegação (só com consentimento do visitante) */
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");

const TIPOS = ["pageview", "tempo", "clique", "download", "arquivo", "ficha", "material", "video", "solucao", "whatsapp-proposta"];

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "POST")) return;
  try {
    let lote = await U.corpo(req);
    if (!Array.isArray(lote)) lote = lote && lote.tipo ? [lote] : [];
    const disp = U.dispositivo(req);
    if (disp === "robo" || !lote.length) return U.ok(res);
    if (!(await U.limite(req, "evento", 120, 600))) return U.ok(res);
    const g = U.geo(req);
    const linhas = lote.slice(0, 50).filter((e) => e && TIPOS.includes(e.tipo)).map((e) => ({
      tipo: e.tipo, alvo: U.limpar(e.alvo, 160), pagina: U.limpar(e.pagina, 80),
      visitante: U.limpar(e.visitante, 60), sessao: U.limpar(e.sessao, 60), ref: U.limpar(e.ref, 120),
      segundos: e.segundos !== undefined ? Math.max(0, Math.min(7200, parseInt(e.segundos, 10) || 0)) : null,
      dispositivo: disp, geo_cidade: g.cidade, geo_uf: g.uf, geo_pais: g.pais,
    })).filter((l) => l.tipo !== "tempo" || l.segundos);
    if (linhas.length) { const { error } = await db().from("eventos").insert(linhas); if (error) throw error; }
    return U.ok(res);
  } catch (e) {
    console.error("evento:", e);
    return U.ok(res); // estatística nunca deve atrapalhar o visitante
  }
};
