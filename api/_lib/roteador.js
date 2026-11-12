/* Roteador por módulo · permite várias APIs numa só função da Vercel (limite de 12 funções do plano Hobby).
   O módulo vem de ?modulo=... ou, nos endereços antigos redirecionados pelo vercel.json (/api/catalogo...), do próprio caminho. */
module.exports = function roteador(mapa, padrao) {
  return async (req, res) => {
    const url = new URL(req.url || "/", "http://x");
    const doCaminho = url.pathname.replace(/\/+$/, "").split("/").pop();
    const m = String((req.query && req.query.modulo) || url.searchParams.get("modulo") || (mapa[doCaminho] ? doCaminho : "") || padrao || "").toLowerCase();
    const carregar = mapa[m];
    if (!carregar) { res.statusCode = 404; res.setHeader("Content-Type", "application/json; charset=utf-8"); return res.end(JSON.stringify({ ok: false, mensagem: "Módulo desconhecido." })); }
    return carregar()(req, res);
  };
};
