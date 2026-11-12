/* UniLTS · consulta pública da compra (código de rastreio + e-mail) e orientação de cancelamento */
(function () {
  const C = window.LTS_CONFIG, DEMO = C.api && C.api.modoDemonstracao;
  const $ = id => document.getElementById(id), out = $("pd-resultado"), aviso = $("pd-aviso");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const d = x => x ? new Date(x).toLocaleDateString("pt-BR") : "—";
  const brl = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const SIT = { aprovado: ["Pagamento aprovado · acesso liberado", "ok"], pendente: ["Aguardando pagamento", "and"], recusado: ["Pagamento recusado", "erro"], expirado: ["PIX expirado", "erro"], estornado: ["Compra cancelada pelo usuário · reembolsada", "erro"], cancelado: ["Compra cancelada", "erro"] };
  async function consultar(codigo, email) {
    if (DEMO && window.UNI_DEMO) return window.UNI_DEMO.pagamento("consultar", { corpo: { codigo, email } });
    try { const r = await fetch(C.api.base + "pagamento?acao=consultar", { method: "POST", headers: { "Content-Type": "application/json", "X-UniLTS": "1" }, body: JSON.stringify({ codigo, email }) }); return await r.json(); }
    catch (e) { return { ok: false, mensagem: "Não foi possível consultar agora. Tente novamente." }; }
  }
  $("pd-form").addEventListener("submit", async e => {
    e.preventDefault(); aviso.hidden = true;
    const codigo = $("pd-codigo").value.trim().toUpperCase(), email = $("pd-email").value.trim();
    if (!/^PED-/.test(codigo) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return window.LTS_AVISO(aviso, "falha", "Informe o código da compra (PED-…) e o e-mail usado na compra.");
    out.innerHTML = `<p class="vazio">Consultando…</p>`;
    const r = await consultar(codigo, email);
    if (!r.ok) { out.innerHTML = ""; return window.LTS_AVISO(aviso, "falha", esc(r.mensagem)); }
    const p = r.pedido, [rot, cls] = SIT[p.status] || [p.status, ""];
    out.innerHTML = `<div class="val-card val-${cls === "ok" ? "ok" : cls === "erro" ? "erro" : "alerta"}"><div class="val-selo">${(window.LTS_ICON || {}).escudo || ""}</div><div style="min-width:0">
      <h2>${rot}</h2><p class="val-cod" translate="no">${esc(p.codigo)}</p>
      <table class="tabela-info"><tbody>
        <tr><th scope="row">Curso</th><td>${esc(p.curso)}</td></tr>
        <tr><th scope="row">Titular</th><td>${esc(p.nome)}${p.cpf ? ` · CPF ${esc(p.cpf)}` : ""}</td></tr>
        <tr><th scope="row">Valor</th><td>${brl(p.valor)} · ${p.metodo === "pix" ? "PIX" : `Cartão de crédito${p.cartao_final ? " final " + esc(p.cartao_final) : ""}`}</td></tr>
        <tr><th scope="row">Pedido em</th><td>${d(p.criado)}</td></tr>
        ${p.pago_em ? `<tr><th scope="row">Pagamento aprovado em</th><td>${d(p.pago_em)}</td></tr>` : ""}
        ${p.estornado_em ? `<tr><th scope="row">Cancelada em</th><td>${d(p.estornado_em)} · acesso bloqueado e certificado revogado</td></tr>` : ""}
      </tbody></table></div></div>
      ${p.status === "aprovado" && window.LTS_CANCELAMENTO ? window.LTS_CANCELAMENTO.html(p) : ""}`;
    try { history.replaceState(null, "", "?c=" + encodeURIComponent(codigo)); } catch (x) {}
  });
  const q = new URLSearchParams(location.search).get("c"); if (q) $("pd-codigo").value = q.toUpperCase();
})();
