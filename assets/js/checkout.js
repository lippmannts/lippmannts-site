/* =====================================================================
   UniLTS · Checkout pessoa física (Mercado Pago)
   PIX dinâmico (QR Code + copia e cola, confirmação automática) e cartão de crédito
   (Card Payment Brick do Mercado Pago: os dados do cartão nunca passam pelo nosso servidor).
   Sem credenciais, ou no modo demonstração, funciona em simulação, sem cobrança.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG, I = window.LTS_ICON || {}, DEMO = !!(C.api && C.api.modoDemonstracao);
  const app = document.getElementById("ck-app");
  const qs = new URLSearchParams(location.search);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataBR = d => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  const soDig = v => String(v || "").replace(/\D/g, "");
  const cpfValido = cpf => { const c = soDig(cpf); if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false; const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +c[9] && dv(10) === +c[10]; };
  let ck = { curso: null, ambiente: "simulacao", public_key: "", metodo: "pix", pedido: null, chave: "", timer: null };

  async function api(acao, { corpo, query = {} } = {}) {
    if (DEMO) return window.UNI_DEMO.pagamento(acao, { corpo, query });
    const opt = { headers: { Accept: "application/json" } };
    if (corpo) { opt.method = "POST"; opt.headers["Content-Type"] = "application/json"; opt.headers["X-UniLTS"] = "1"; opt.body = JSON.stringify(corpo); }
    try { const r = await fetch(`${C.api.base}pagamento?${new URLSearchParams({ acao, ...query })}`, opt); return await r.json(); }
    catch (e) { return { ok: false, mensagem: "Sem conexão com o servidor. Verifique a internet." }; }
  }
  const aviso = (id, tipo, t) => { const el = document.getElementById(id); if (el) { el.hidden = !t; el.className = "ck-aviso " + tipo; el.textContent = t || ""; } };
  const guardar = () => { try { localStorage.setItem("uni_ultimo_pedido", JSON.stringify({ codigo: ck.pedido.codigo, chave: ck.chave })); } catch (e) {} };

  async function iniciar() {
    const pedido = qs.get("pedido"), chave = qs.get("k");
    if (pedido && chave) { ck.chave = chave; const r = await api("status", { query: { codigo: pedido, chave } }); if (r.ok) { ck.pedido = r.pedido; return telaPedido(); } }
    const r = await api("curso", { query: { id: qs.get("curso") || "" } });
    if (!r.ok) { app.innerHTML = `<div class="ck-cartao"><h2>Curso indisponível</h2><p>${esc(r.mensagem || "Este curso não está à venda no momento.")}</p><p><a class="btn btn-primario" href="/unilts.html">Ver cursos da UniLTS</a></p></div>`; return; }
    Object.assign(ck, { curso: r.curso, ambiente: r.ambiente, public_key: r.public_key, garantia: r.garantia_dias || 7 });
    telaCompra();
  }
  function resumo() {
    const c = ck.curso;
    return `<aside class="ck-resumo">
      ${c.imagem ? `<img src="${esc(c.imagem)}" alt="" width="96" height="96">` : ""}
      <p class="ck-eyebrow">${esc(c.nr || "Curso EaD")} · EaD</p><h2>${esc(c.titulo)}</h2>
      <ul class="ck-itens"><li>${I.relogio || ""} ${String(c.carga_horaria).replace(".", ",")} horas de conteúdo</li><li>${I.lock || ""} Acesso imediato após a aprovação</li><li>${I.escudo || ""} Certificado com QR Code (NR 01)</li><li>${I.check || "✓"} ${ck.garantia || 7} dias de garantia: reembolso integral</li></ul>
      <div class="ck-total"><span>Total</span><b>${brl(c.preco)}</b></div>
      <p class="ck-mini">Cartão em até 12x (juros conforme o Mercado Pago). Prazo de 30 dias corridos para concluir o curso após a matrícula.</p>
      ${ck.ambiente !== "producao" ? `<p class="ck-teste">${ck.ambiente === "sandbox" ? "Ambiente de teste do Mercado Pago (sandbox): nenhum valor real é cobrado." : "Modo de simulação: nenhum valor é cobrado."}</p>` : ""}
    </aside>`;
  }
  function telaCompra() {
    app.innerHTML = `<div class="ck-grid">${resumo()}
      <form class="ck-cartao" id="ck-form" novalidate>
        <h2>1. Seus dados</h2>
        <div class="ck-campos">
          <label class="full">Nome completo (como sairá no certificado)<input id="ck-nome" autocomplete="name" required></label>
          <label>CPF<input id="ck-cpf" inputmode="numeric" placeholder="000.000.000-00" required></label>
          <label>Celular / WhatsApp<input id="ck-tel" inputmode="tel" autocomplete="tel"></label>
          <label class="full">E-mail (será o seu login na Área do Aluno)<input id="ck-email" type="email" autocomplete="email" required></label>
        </div>
        <h2>2. Forma de pagamento</h2>
        <div class="ck-metodos" role="radiogroup" aria-label="Forma de pagamento">
          <label><input type="radio" name="ck-met" value="pix" checked><span><b>PIX</b><small>Aprovação em segundos</small></span></label>
          <label><input type="radio" name="ck-met" value="cartao"><span><b>Cartão de crédito</b><small>Em até 12x</small></span></label>
        </div>
        <div id="ck-cartao-area" hidden></div>
        <label class="ck-aceite"><input type="checkbox" id="ck-aceite"> <span>Li e aceito as condições: acesso individual e intransferível, 30 dias corridos para concluir o curso, certificado após aprovação na avaliação e reembolso integral em até ${ck.garantia || 7} dias mediante pedido formal (após o estorno, o acesso é bloqueado e o certificado é revogado), conforme a <a href="/a-lippmann.html#politicas" target="_blank" rel="noopener">Política de Reembolso e Cancelamento</a>. Dados tratados conforme a <a href="/politica-de-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label>
        <p class="ck-aviso" id="ck-msg" hidden></p>
        <button class="btn btn-primario ck-pagar" type="submit" id="ck-pagar">Gerar PIX de ${brl(ck.curso.preco)}</button>
        <p class="ck-mini ck-seguro">${I.lock || ""} Pagamento processado pelo Mercado Pago. A LIPPMANN não armazena dados de cartão.</p>
      </form></div>`;
    const cpf = document.getElementById("ck-cpf");
    cpf.oninput = () => { const d = soDig(cpf.value).slice(0, 11); cpf.value = d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); };
    document.querySelectorAll('[name="ck-met"]').forEach(r => r.onchange = () => trocarMetodo(r.value));
    document.getElementById("ck-form").onsubmit = e => { e.preventDefault(); if (ck.metodo === "pix") pagar(); else if (!ck.brick) pagar(); };
  }
  function dados() {
    ck.nome = document.getElementById("ck-nome").value.trim();
    const d = { nome: ck.nome, cpf: document.getElementById("ck-cpf").value, telefone: document.getElementById("ck-tel").value, email: document.getElementById("ck-email").value.trim(), aceite: document.getElementById("ck-aceite").checked };
    if (d.nome.split(/\s+/).length < 2) return aviso("ck-msg", "erro", "Informe o nome completo (é o nome que sai no certificado)."), null;
    if (!cpfValido(d.cpf)) return aviso("ck-msg", "erro", "CPF inválido."), null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return aviso("ck-msg", "erro", "E-mail inválido."), null;
    if (!d.aceite) return aviso("ck-msg", "erro", "Para continuar, aceite as condições de compra."), null;
    aviso("ck-msg", "", ""); return d;
  }
  async function trocarMetodo(m) {
    ck.metodo = m;
    const area = document.getElementById("ck-cartao-area"), bt = document.getElementById("ck-pagar");
    area.hidden = m !== "cartao"; bt.hidden = false; bt.textContent = m === "pix" ? `Gerar PIX de ${brl(ck.curso.preco)}` : `Pagar ${brl(ck.curso.preco)} com cartão`;
    if (m !== "cartao" || area.dataset.pronto) return;
    area.dataset.pronto = 1;
    if (ck.ambiente !== "simulacao" && ck.public_key && !DEMO) return montarBrick(area, bt);
    // simulação: formulário próprio (cartões de teste do Mercado Pago)
    area.innerHTML = `<div class="ck-campos ck-cartao-sim">
      <label class="full">Número do cartão<input id="cs-num" inputmode="numeric" autocomplete="cc-number" placeholder="5031 4332 1540 6351"></label>
      <label class="full">Nome impresso no cartão<input id="cs-tit" autocomplete="cc-name" placeholder="APRO"></label>
      <label>Validade<input id="cs-val" placeholder="11/30" autocomplete="cc-exp"></label><label>CVV<input id="cs-cvv" inputmode="numeric" placeholder="123" autocomplete="cc-csc"></label>
      <label class="full">Parcelas<select id="cs-parc">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x de ${brl(ck.curso.preco / (i + 1))}${i ? "" : " (à vista)"}</option>`).join("")}</select></label>
    </div><p class="ck-teste">Simulação: titular <b>APRO</b> aprova; <b>OTHE</b> recusa (mesma regra dos cartões de teste do Mercado Pago).</p>`;
    const num = document.getElementById("cs-num"); num.oninput = () => { num.value = soDig(num.value).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "); };
  }
  function carregarSdk() { return window.MercadoPago ? Promise.resolve() : new Promise((ok, erro) => { const s = document.createElement("script"); s.src = "https://sdk.mercadopago.com/js/v2"; s.onload = ok; s.onerror = () => erro(new Error("Não foi possível carregar o Mercado Pago.")); document.head.appendChild(s); }); }
  async function montarBrick(area, bt) {
    area.innerHTML = `<div id="ck-brick"><p class="vazio">Carregando formulário seguro do Mercado Pago…</p></div>`;
    bt.hidden = true;
    try {
      await carregarSdk();
      const mp = new window.MercadoPago(ck.public_key, { locale: "pt-BR" });
      document.getElementById("ck-brick").innerHTML = "";
      ck.brick = await mp.bricks().create("cardPayment", "ck-brick", {
        initialization: { amount: Number(ck.curso.preco) },
        customization: { paymentMethods: { maxInstallments: 12 }, visual: { style: { theme: "default", customVariables: { baseColor: "#0A3490" } } } },
        callbacks: {
          onReady: () => {}, onError: e => aviso("ck-msg", "erro", "Erro no formulário do cartão. Recarregue a página."),
          onSubmit: async (fd) => { const d = dados(); if (!d) throw new Error("dados"); await pagar({ token: fd.token, payment_method_id: fd.payment_method_id, issuer_id: fd.issuer_id, installments: fd.installments }); }
        }
      });
    } catch (e) { area.innerHTML = `<p class="ck-aviso erro">${esc(e.message)} Use o PIX ou tente mais tarde.</p>`; bt.hidden = false; }
  }
  async function pagar(cartaoBrick) {
    const d = dados(); if (!d) return;
    const bt = document.getElementById("ck-pagar"); bt.disabled = true; const txt = bt.textContent; bt.textContent = "Processando…";
    let cartao = cartaoBrick;
    if (ck.metodo === "cartao" && !cartao) {
      const num = soDig(document.getElementById("cs-num").value), tit = document.getElementById("cs-tit").value.trim();
      if (num.length < 13 || !tit || !/^\d{2}\/\d{2}$/.test(document.getElementById("cs-val").value.trim()) || soDig(document.getElementById("cs-cvv").value).length < 3) { bt.disabled = false; bt.textContent = txt; return aviso("ck-msg", "erro", "Preencha os dados do cartão."); }
      cartao = { numero: num, titular: tit, installments: +document.getElementById("cs-parc").value };
    }
    const r = await api("criar", { corpo: { curso_id: ck.curso.id, ...d, metodo: ck.metodo, cartao } });
    bt.disabled = false; bt.textContent = txt;
    if (!r.ok) return aviso("ck-msg", "erro", r.mensagem);
    ck.pedido = r.pedido; ck.chave = r.chave; guardar();
    try { history.replaceState(null, "", `?pedido=${encodeURIComponent(r.pedido.codigo)}&k=${r.chave}`); } catch (e) {}
    telaPedido();
  }
  function qrHtml(texto) {
    if (ck.pedido.pix_qr_base64) return `<img src="data:image/png;base64,${ck.pedido.pix_qr_base64}" alt="QR Code PIX" width="240" height="240">`;
    if (!window.qrcode) return "";
    const q = window.qrcode(0, "M"); q.addData(texto); q.make(); return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }
  function telaPedido() {
    clearInterval(ck.timer);
    const p = ck.pedido;
    if (p.status === "pendente" && p.metodo === "pix") {
      app.innerHTML = `<div class="ck-cartao ck-pix">
        <p class="ck-eyebrow">Pedido ${esc(p.codigo)}</p><h2>Pague ${brl(p.valor)} com PIX</h2>
        <div class="ck-pix-grid"><div class="ck-qr" role="img" aria-label="QR Code do PIX">${qrHtml(p.pix_copia_cola)}</div>
          <div><ol class="ck-passos"><li>Abra o app do seu banco e escolha <b>PIX › Pagar com QR Code</b> ou <b>PIX copia e cola</b>.</li><li>Confira o valor e o recebedor (Mercado Pago · LIPPMANN).</li><li>Confirme o pagamento. Esta tela atualiza sozinha.</li></ol>
          <label class="ck-copia">PIX copia e cola<span><input id="ck-cc" readonly value="${esc(p.pix_copia_cola || "")}"><button class="btn btn-contorno" type="button" id="ck-copiar">Copiar</button></span></label>
          <p class="ck-mini" id="ck-expira"></p></div></div>
        <p class="ck-espera"><span class="ck-pulso"></span> Aguardando a confirmação do pagamento…</p>
        ${DEMO || ck.ambiente === "simulacao" || p.ambiente === "simulacao" ? `<div class="ck-teste">${DEMO ? `Demonstração: <button class="btn btn-primario" type="button" id="ck-sim">Simular pagamento aprovado</button>` : "Modo de simulação: o pagamento é aprovado pela LIPPMANN em L³ INTEGRA › Financeiro e BI › Pedidos."}</div>` : ""}
      </div>`;
      document.getElementById("ck-copiar").onclick = async () => { try { await navigator.clipboard.writeText(p.pix_copia_cola); document.getElementById("ck-copiar").textContent = "Copiado!"; } catch (e) { document.getElementById("ck-cc").select(); } };
      const sim = document.getElementById("ck-sim"); if (sim) sim.onclick = async () => { await window.UNI_DEMO.simularPix(p.codigo); verificar(); };
      const exp = () => { const s = Math.max(0, Math.floor((new Date(p.pix_expira) - Date.now()) / 1000)); const el = document.getElementById("ck-expira"); if (el) el.textContent = p.pix_expira ? (s ? `O código expira em ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}.` : "Código expirado.") : ""; };
      exp(); let n = 0;
      ck.timer = setInterval(() => { exp(); if (++n % 5 === 0) verificar(); }, 1000);
      return;
    }
    const OK = p.status === "aprovado";
    const titulo = { aprovado: "Pagamento aprovado!", recusado: "Pagamento recusado", estornado: "Pedido reembolsado", expirado: "PIX expirado", cancelado: "Pedido cancelado", pendente: "Pagamento em análise" }[p.status] || "Pedido";
    app.innerHTML = `<div class="ck-cartao ck-final ${OK ? "ok" : p.status === "pendente" ? "" : "erro"}">
      <div class="ck-selo">${OK ? (I.check || "✓") : p.status === "pendente" ? (I.relogio || "…") : "!"}</div>
      <p class="ck-eyebrow">Pedido ${esc(p.codigo)}</p><h2>${titulo}</h2>
      ${OK ? `<p>Enviamos para <b>${esc(p.email)}</b> o acesso à Área do Aluno, com uma senha provisória (troca obrigatória no primeiro acesso). Confira também a caixa de spam.</p>${DEMO && /^Demonstração/.test(p.mp_detalhe || "") ? `<p class="ck-teste">${esc(p.mp_detalhe)}</p>` : ""}
        <div class="ck-acoes"><a class="btn btn-primario" href="/unilts/index.html">Acessar a Área do Aluno</a><a class="btn btn-contorno" href="/unilts.html">Voltar à UniLTS</a></div>
        <p class="ck-mini">Valor: ${brl(p.valor)} · ${p.metodo === "pix" ? "PIX" : `cartão${p.cartao_final ? " final " + esc(p.cartao_final) : ""}${p.parcelas > 1 ? " em " + p.parcelas + "x" : ""}`} · aprovado em ${dataBR(p.pago_em)}.</p>
        <p class="ck-rastreio">Código de rastreio da compra: <b translate="no">${esc(p.codigo)}</b> · <a href="/pedido.html?c=${encodeURIComponent(p.codigo)}">Consultar compra</a></p>
        ${p.reembolsavel && window.LTS_CANCELAMENTO ? `<details class="ck-reemb"><summary>Desistiu? Reembolso integral até ${dataBR(p.reembolso_ate)}</summary>${window.LTS_CANCELAMENTO.html({ ...p, nome: ck.nome || "" }, { compacto: true })}</details>` : ""}`
      : p.status === "recusado" ? `<p>O pagamento não foi aprovado${p.mp_detalhe ? ` (${esc(p.mp_detalhe)})` : ""}. Nenhum valor foi cobrado. Tente outro cartão ou pague com PIX.</p><div class="ck-acoes"><a class="btn btn-primario" href="?curso=${esc(qs.get("curso") || "")}" id="ck-novo">Tentar novamente</a></div>`
      : p.status === "estornado" ? `<p>Compra cancelada pelo usuário: o reembolso de ${brl(p.valor)} foi processado em ${dataBR(p.estornado_em)}. O acesso às aulas e apostilas foi bloqueado e o certificado, se emitido, foi revogado.</p>`
      : p.status === "pendente" ? `<p>O Mercado Pago está analisando o pagamento. Você recebe a confirmação por e-mail e esta página atualiza sozinha.</p>`
      : `<p>Gere um novo pedido para continuar.</p><div class="ck-acoes"><a class="btn btn-primario" href="/unilts.html">Ver cursos</a></div>`}
      <p class="ck-mini">Dúvidas: WhatsApp (11) 94013-8792 · atendimento@lippmannts.com</p></div>`;
    const novo = document.getElementById("ck-novo"); if (novo) novo.onclick = e => { e.preventDefault(); location.href = `${location.pathname}?curso=${encodeURIComponent(ck.curso ? ck.curso.id : "")}`; };
    if (p.status === "pendente") ck.timer = setInterval(verificar, 5000);
  }
  async function verificar() {
    const r = await api("status", { query: { codigo: ck.pedido.codigo, chave: ck.chave } });
    if (r.ok && (r.pedido.status !== ck.pedido.status || r.pedido.status !== "pendente")) { ck.pedido = r.pedido; telaPedido(); }
  }
  iniciar();
})();
