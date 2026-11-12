/* UniLTS · instruções de cancelamento formal (proteção contra solicitações indevidas)
   O cancelamento não é feito por botão: o titular envia o pedido formal por e-mail e WhatsApp. */
(function () {
  const C = window.LTS_CONFIG || {}, ct = C.contato || {};
  const EMAIL = "atendimento@lippmannts.com", WA = ct.whatsapp || "5511940138792", WA_EXIB = ct.whatsappExibicao || "(11) 94013-8792";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dataBR = d => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  function texto(p) {
    return `Solicito o cancelamento da compra na UniLTS (direito de arrependimento).\n\nCódigo da compra: ${p.codigo || ""}\nNome completo: ${p.nome || ""}\nCPF: \nE-mail: ${p.email || ""}\nForma de pagamento: ${p.metodo === "cartao" ? "Cartão de crédito" : p.metodo === "pix" ? "PIX" : ""}`;
  }
  function html(p, op = {}) {
    const t = texto(p), dentro = p.reembolsavel !== false;
    return `<div class="cancel-box${op.compacto ? " compacto" : ""}">
      <h3>${dentro ? `Cancelamento e reembolso${p.reembolso_ate ? ` (até ${dataBR(p.reembolso_ate)})` : ""}` : "Prazo de arrependimento encerrado"}</h3>
      ${dentro ? `<p>Pelo direito de arrependimento (7 dias), o reembolso é integral. Para a sua segurança, o cancelamento é feito <b>somente por pedido formal do titular</b>, enviado para <b>${EMAIL}</b> e pelo WhatsApp comercial <b>${WA_EXIB}</b>, com:</p>
      <ul class="cancel-lista"><li>Código da compra${p.codigo ? `: <b translate="no">${esc(p.codigo)}</b>` : ""}</li><li>Nome completo</li><li>CPF</li><li>E-mail usado na compra</li><li>Forma de pagamento (PIX ou cartão)</li></ul>
      <div class="cancel-acoes"><a class="btn btn-primario" href="mailto:${EMAIL}?subject=${encodeURIComponent("Cancelamento da compra " + (p.codigo || ""))}&body=${encodeURIComponent(t)}">Enviar e-mail</a><a class="btn btn-whats" href="https://wa.me/${WA}?text=${encodeURIComponent(t)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a></div>
      <p class="cancel-mini">Ao processar o estorno, o acesso às aulas e apostilas é bloqueado na hora e o certificado, se emitido, é revogado. <a href="/a-lippmann.html#politicas">Política de Reembolso e Cancelamento</a>.</p>`
      : `<p>O prazo de 7 dias para o direito de arrependimento terminou. Em caso de falha na prestação do serviço, fale com a LIPPMANN: ${EMAIL} · WhatsApp ${WA_EXIB}.</p>`}
    </div>`;
  }
  window.LTS_CANCELAMENTO = { html, texto };
})();
