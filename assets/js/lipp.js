/* =====================================================================
   LIPP · widget do assistente virtual (chat flutuante acima do botão do WhatsApp)
   - Conversa com /api/lipp (IA Claude + base de conhecimento do site)
   - Agenda reuniões de 30 min pelo Google Meet (seg a sex, 9h às 17h)
   - Captura leads com consentimento (LGPD)
   No modo demonstração, responde pela base de conhecimento local (lipp-motor.js)
   e guarda as conversas neste navegador (aba "LIPP" do L³ INTEGRA de demonstração).
   ===================================================================== */
(function () {
  "use strict";
  if (window.__LIPP) return; window.__LIPP = true;
  const C = window.LTS_CONFIG || { api: { base: "/api/" } };
  const DEMO = !!(C.api && C.api.modoDemonstracao);
  const API = (C.api && C.api.base) || "/api/";
  const M = () => window.LIPP_MOTOR;
  const RAIZ = (document.currentScript && document.currentScript.src || "").replace(/\bassets\/js\/lipp\.js.*$/, "");
  const AVATAR = RAIZ + "assets/img/marca/lipp-avatar.webp";
  const WA = "https://wa.me/5511940138792?text=" + encodeURIComponent("Olá! Vim pelo assistente LIPP do site e gostaria de falar com um consultor.");
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const idioma = () => (window.LTS_I18N && window.LTS_I18N.idioma) || document.documentElement.lang || "pt-BR";
  const T = (s) => (window.LTS_I18N && window.LTS_I18N.t ? window.LTS_I18N.t(s) || s : s);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));

  /* ---------- estado da conversa (sobrevive à troca de página na mesma aba) ---------- */
  let estado; try { estado = JSON.parse(ss.get("lipp_estado") || "null"); } catch (e) { estado = null; }
  if (!estado) estado = { conversa: null, msgs: [], aberto: false, necessidade: "" };
  const salvar = () => ss.set("lipp_estado", JSON.stringify({ ...estado, msgs: estado.msgs.slice(-40) }));

  /* ---------- modo demonstração: base local + registro neste navegador ---------- */
  const demo = {
    ler() { try { return JSON.parse(ls.get("l3_demo_lipp") || "{}") || {}; } catch (e) { return {}; } },
    gravar(d) { ls.set("l3_demo_lipp", JSON.stringify(d)); },
    kb: null,
    async base() {
      if (this.kb) return this.kb;
      const carregar = (src) => new Promise((ok) => { const s = document.createElement("script"); s.src = RAIZ + src; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
      if (!window.LTS_TREINAMENTOS) await carregar("data/treinamentos.js");
      if (!window.LTS_SOLUCOES) await carregar("data/solucoes.js");
      let cursos = [];
      try { cursos = window.UNI_DEMO ? window.UNI_DEMO.cursosDemo() : JSON.parse(ls.get("l3_demo_uni_v4") || "{}").cursos || []; } catch (e) {}
      if (!cursos.length) cursos = [{ id: "nr35-ead", titulo: "NR 35 · Trabalho em Altura (EaD)", nr: "NR 35", carga_horaria: 8, preco: 189.9, venda_online: true, ativo: true }];
      this.kb = M().montarBase({ treinamentos: window.LTS_TREINAMENTOS || [], solucoes: window.LTS_SOLUCOES || [], cursos });
      return this.kb;
    },
    conversa() {
      const d = this.ler(); d.conversas = d.conversas || [];
      let c = d.conversas.find((x) => x.id === estado.conversa);
      if (!c) { c = { id: estado.conversa || uid(), criado: new Date().toISOString(), atualizado: new Date().toISOString(), pagina: location.pathname.split("/").pop() || "index.html", idioma: idioma(), temas: [], mensagens: 0, modo: "base", status: "aberta", lead: false, agendou: false, msgs: [] }; d.conversas.unshift(c); }
      return { d, c };
    },
    async mensagem(texto) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      const kb = await this.base(); const r = M().responder(texto, kb);
      const { d, c } = this.conversa();
      c.msgs.push({ papel: "usuario", texto, criado: new Date().toISOString() }, { papel: "lipp", texto: r.texto, modo: "base", criado: new Date().toISOString() });
      c.mensagens = c.msgs.length; c.temas = [...new Set([...(c.temas || []), ...M().temas(texto)])]; c.atualizado = new Date().toISOString();
      this.gravar(d);
      return { ok: true, conversa: c.id, resposta: r.texto, acao: r.acao || null, sugestoes: r.sugestoes || null, modo: "base" };
    },
    horarios() { const d = this.ler(); return { ok: true, fonte: "janela", google: false, horarios: M().horariosComerciais((d.agendamentos || []).filter((a) => a.status !== "cancelado"), { dias: 10, max: 60 }) }; },
    async enviar(acao, b) {
      await new Promise((r) => setTimeout(r, 600));
      const { d, c } = this.conversa();
      Object.assign(c, { lead: true, status: acao === "agendar" ? "agendada" : (c.status === "agendada" ? "agendada" : "lead"), lead_nome: b.nome, lead_email: b.email, lead_telefone: b.telefone, lead_empresa: b.empresa, lead_cargo: b.cargo, necessidade: b.necessidade, atualizado: new Date().toISOString() });
      if (acao === "lead") { this.gravar(d); return { ok: true, mensagem: "Pronto! Um consultor vai entrar em contato em até 1 dia útil." }; }
      const ini = new Date(b.inicio), fim = new Date(ini.getTime() + 1800000);
      const quando = ini.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
      d.agendamentos = d.agendamentos || [];
      d.agendamentos.unshift({ id: Date.now(), conversa_id: c.id, nome: b.nome, email: b.email, telefone: b.telefone, empresa: b.empresa, necessidade: b.necessidade, inicio: ini.toISOString(), fim: fim.toISOString(), status: "solicitado", meet_url: null, criado: new Date().toISOString() });
      c.agendou = true; this.gravar(d);
      return { ok: true, status: "solicitado", quando, mensagem: `Pedido de reunião registrado para ${quando}. Um consultor confirma e envia o link do Google Meet para ${b.email}. (Demonstração: no site oficial o convite do Google Meet sai automaticamente.)` };
    },
  };

  async function chamar(acao, corpo) {
    if (DEMO) {
      if (acao === "mensagem") return demo.mensagem(corpo.texto);
      if (acao === "horarios") return demo.horarios();
      return demo.enviar(acao, corpo);
    }
    const op = acao === "horarios" ? { method: "GET" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...corpo, conversa: estado.conversa, pagina: location.pathname.split("/").pop() || "index.html", idioma: idioma() }) };
    try {
      const r = await fetch(API + "lipp?acao=" + acao, { ...op, credentials: "same-origin" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) return { ok: false, mensagem: j.mensagem || "Não consegui responder agora. Fale com a equipe pelo WhatsApp (11) 94013-8792." };
      return j;
    } catch (e) { return { ok: false, mensagem: "Sem conexão no momento. Fale com a equipe pelo WhatsApp (11) 94013-8792." }; }
  }

  /* ---------- formatação das mensagens ---------- */
  function formatar(t) {
    let h = esc(t);
    h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    h = h.replace(/(https?:\/\/[^\s<)]+)|\b((?:www\.)?lippmannts\.com(?:\/[^\s<),]*)?)/g, (m, u, s) => {
      const href = u || "https://" + s.replace(/^www\./, "");
      const local = /lippmannts\.com\/?/.test(href) ? href.replace(/^https?:\/\/(www\.)?lippmannts\.com\/?/, RAIZ || "/") : href;
      return `<a href="${local}" ${/^https?:/.test(local) && !/lippmannts\.com/.test(local) ? 'target="_blank" rel="noopener"' : ""}>${m}</a>`;
    });
    h = h.replace(/(^|\n)[•\-] /g, "$1<span class=\"lipp-li\">•</span> ");
    return h.replace(/\n/g, "<br>");
  }

  /* ---------- montagem do widget ---------- */
  const raiz = document.createElement("div");
  raiz.className = "lipp"; raiz.id = "lipp";
  raiz.innerHTML = `
    <button class="lipp-float" type="button" aria-haspopup="dialog" aria-controls="lipp-painel" aria-expanded="false" data-track="lipp:abrir">
      <span class="lipp-rotulo">Pergunte ao LIPP</span>
      <span class="lipp-bolha"><img src="${AVATAR}" alt="" width="56" height="56"><span class="lipp-on" aria-hidden="true"></span></span>
      <span class="sr-only">Abrir o assistente virtual LIPP</span>
    </button>
    <section class="lipp-painel" id="lipp-painel" role="dialog" aria-modal="false" aria-labelledby="lipp-chat-titulo" hidden>
      <header class="lipp-topo">
        <img src="${AVATAR}" alt="" width="42" height="42">
        <div><b id="lipp-chat-titulo">LIPP</b><small><span class="lipp-on-txt"></span>Assistente virtual · LIPPMANN</small></div>
        <a class="lipp-wa" href="${WA}" target="_blank" rel="noopener" title="Falar no WhatsApp" aria-label="Falar no WhatsApp" data-track="whatsapp:lipp"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg></a>
        <button class="lipp-fechar" type="button" aria-label="Fechar o assistente">×</button>
      </header>
      <div class="lipp-msgs" role="log" aria-live="polite"></div>
      <div class="lipp-sug"></div>
      <form class="lipp-entrada" autocomplete="off">
        <label class="sr-only" for="lipp-texto">Sua mensagem</label>
        <textarea id="lipp-texto" rows="1" maxlength="1000" placeholder="Escreva sua dúvida…"></textarea>
        <button type="submit" aria-label="Enviar"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z"/></svg></button>
      </form>
      <p class="lipp-aviso">Assistente virtual com inteligência artificial. Não informe dados sensíveis. <a href="${RAIZ || "/"}politica-de-privacidade.html">Privacidade</a></p>
    </section>`;
  document.body.appendChild(raiz);
  document.body.classList.add("com-lipp");
  const $ = (s) => raiz.querySelector(s);
  const botao = $(".lipp-float"), painel = $(".lipp-painel"), lista = $(".lipp-msgs"), sug = $(".lipp-sug"), form = $(".lipp-entrada"), campo = $("#lipp-texto");

  const SAUDACAO = "Olá! Eu sou o LIPP, assistente virtual da LIPPMANN. Posso ajudar a escolher o treinamento ou a solução de SSMA ideal para a sua empresa e agendar uma reunião pelo Google Meet com um consultor. Como posso ajudar?";
  const SUG_INICIAIS = ["Preciso de treinamento de NR 35", "Quanto custa um treinamento in company?", "Ver cursos on-line (UniLTS)", "Agendar reunião com um consultor"];

  function bolha(m) {
    const el = document.createElement("div");
    el.className = "lipp-msg " + (m.papel === "usuario" ? "eu" : "ele");
    if (!m.saudacao) el.setAttribute("translate", "no"); // respostas: a IA já responde no idioma do visitante
    el.innerHTML = m.papel === "usuario" ? esc(m.texto).replace(/\n/g, "<br>") : formatar(m.texto);
    lista.appendChild(el);
    return el;
  }
  function rolar() { requestAnimationFrame(() => { lista.scrollTop = lista.scrollHeight; }); }
  function sugestoes(arr) {
    sug.innerHTML = (arr || []).map((s) => `<button type="button">${esc(s)}</button>`).join("");
  }
  function renderizar() {
    lista.innerHTML = "";
    bolha({ papel: "lipp", texto: SAUDACAO, saudacao: true });
    estado.msgs.forEach(bolha);
    if (!estado.msgs.length) sugestoes(SUG_INICIAIS);
    rolar();
  }

  function abrir() {
    painel.hidden = false; raiz.classList.add("aberto"); document.body.classList.add("lipp-aberto"); botao.setAttribute("aria-expanded", "true");
    estado.aberto = true; salvar();
    if (!lista.childElementCount) renderizar();
    setTimeout(() => campo.focus({ preventScroll: true }), 50);
    if (window.LTS_API && window.LTS_API.evento) window.LTS_API.evento("lipp", "abrir");
  }
  function fechar() { painel.hidden = true; raiz.classList.remove("aberto"); document.body.classList.remove("lipp-aberto"); botao.setAttribute("aria-expanded", "false"); estado.aberto = false; salvar(); botao.focus({ preventScroll: true }); }
  botao.addEventListener("click", () => (painel.hidden ? abrir() : fechar()));
  $(".lipp-fechar").addEventListener("click", fechar);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !painel.hidden) fechar(); });

  let ocupado = false;
  async function enviar(texto) {
    texto = String(texto || "").trim(); if (!texto || ocupado) return;
    ocupado = true; sugestoes([]);
    const m = { papel: "usuario", texto }; estado.msgs.push(m); bolha(m);
    const dig = document.createElement("div"); dig.className = "lipp-msg ele lipp-digitando"; dig.innerHTML = "<i></i><i></i><i></i>"; dig.setAttribute("aria-label", "LIPP está digitando"); lista.appendChild(dig); rolar();
    const r = await chamar("mensagem", { texto, historico: estado.msgs.slice(-10) });
    dig.remove(); ocupado = false;
    if (!r.ok) { bolha({ papel: "lipp", texto: r.mensagem }); sugestoes(["Falar no WhatsApp"]); rolar(); return; }
    if (r.conversa) estado.conversa = r.conversa;
    if (r.necessidade) estado.necessidade = r.necessidade;
    else if (!estado.necessidade || r.acao) estado.necessidade = estado.msgs.filter((x) => x.papel === "usuario").map((x) => x.texto).slice(-3).join(" · ").slice(0, 400);
    const resp = { papel: "lipp", texto: r.resposta, modo: r.modo }; estado.msgs.push(resp); bolha(resp); salvar();
    if (r.acao === "agendar") cartaoAgenda();
    sugestoes(r.sugestoes && r.sugestoes.length ? r.sugestoes : r.acao === "agendar" ? [] : ["Agendar reunião com um consultor", "Quero receber uma proposta"]);
    rolar();
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); const t = campo.value; campo.value = ""; campo.style.height = ""; enviar(t); });
  campo.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); } });
  campo.addEventListener("input", () => { campo.style.height = ""; campo.style.height = Math.min(110, campo.scrollHeight) + "px"; });
  sug.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const t = b.textContent.trim();
    if (/agendar reuni|schedule a meeting|agendar una reuni|book a meeting|arrange a meeting/i.test(t)) { sugestoes([]); cartaoAgenda(); return; }
    if (/whatsapp/i.test(t)) { window.open(WA, "_blank", "noopener"); return; }
    if (/proposta|proposal|propuesta/i.test(t)) { sugestoes([]); cartaoLead(); return; }
    enviar(t);
  });

  /* ---------- cartões de agendamento e de proposta ---------- */
  const fmtDia = (d) => new Date(d).toLocaleDateString(idioma(), { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit" });
  const fmtHora = (d) => new Date(d).toLocaleTimeString(idioma(), { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  const diaChave = (d) => new Date(new Date(d).getTime() - 3 * 3600000).toISOString().slice(0, 10);
  function camposContato() {
    return `
      <label>Nome completo<input name="nome" required maxlength="120" autocomplete="name"></label>
      <label>E-mail corporativo<input name="email" type="email" required maxlength="160" autocomplete="email"></label>
      <div class="lipp-2"><label>Telefone / WhatsApp<input name="telefone" maxlength="40" autocomplete="tel" inputmode="tel"></label>
      <label>Empresa<input name="empresa" maxlength="160" autocomplete="organization"></label></div>
      <label>Do que você precisa?<textarea name="necessidade" rows="2" maxlength="1000">${esc(estado.necessidade || "")}</textarea></label>
      <label class="lipp-ck"><input type="checkbox" name="consentimento" required> <span>Autorizo a LIPPMANN a usar estes dados para entrar em contato sobre a minha solicitação, conforme a <a href="${RAIZ || "/"}politica-de-privacidade.html" target="_blank">Política de Privacidade</a>.</span></label>
      <input name="_honey" tabindex="-1" autocomplete="off" class="lipp-mel" aria-hidden="true">
      <p class="lipp-erro" role="alert" hidden></p>`;
  }
  function lerForm(f) { const o = {}; new FormData(f).forEach((v, k) => { o[k] = typeof v === "string" ? v.trim() : v; }); o.consentimento = !!f.consentimento.checked; return o; }
  function validar(f, o) {
    const err = f.querySelector(".lipp-erro"); err.hidden = true;
    const msg = o.nome.split(/\s+/).length < 2 ? "Informe o seu nome completo." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(o.email) ? "Informe um e-mail válido." : !o.consentimento ? "Marque a autorização para que possamos entrar em contato." : "";
    if (msg) { err.textContent = msg; err.hidden = false; }
    return !msg;
  }

  async function cartaoAgenda() {
    const el = document.createElement("div"); el.className = "lipp-cartao";
    el.innerHTML = `<b class="lipp-c-tit">Agendar reunião pelo Google Meet</b><small>30 minutos com um consultor licenciado · segunda a sexta, 9h às 17h (horário de Brasília)</small><div class="lipp-carregando">Consultando a agenda…</div>`;
    lista.appendChild(el); rolar();
    const h = await chamar("horarios");
    if (!h.ok || !(h.horarios || []).length) { el.querySelector(".lipp-carregando").textContent = h.mensagem || "Não há horários livres nos próximos dias. Fale com a equipe pelo WhatsApp (11) 94013-8792."; return; }
    const dias = {}; h.horarios.forEach((x) => { (dias[diaChave(x.inicio)] = dias[diaChave(x.inicio)] || []).push(x); });
    const chaves = Object.keys(dias).slice(0, 8);
    el.querySelector(".lipp-carregando").outerHTML = `
      <form class="lipp-form" novalidate>
        <div class="lipp-dias" role="radiogroup" aria-label="Dia">${chaves.map((k, i) => `<button type="button" data-dia="${k}" class="${i ? "" : "on"}" translate="no">${esc(fmtDia(dias[k][0].inicio))}</button>`).join("")}</div>
        <div class="lipp-horas" role="radiogroup" aria-label="Horário"></div>
        ${camposContato()}
        <button class="btn btn-primario lipp-confirmar" type="submit">Confirmar reunião</button>
      </form>`;
    const f = el.querySelector("form"); let escolhido = null;
    const horas = (k) => { f.querySelector(".lipp-horas").innerHTML = dias[k].map((x) => `<button type="button" data-ini="${x.inicio}" translate="no">${fmtHora(x.inicio)}</button>`).join(""); escolhido = null; };
    horas(chaves[0]);
    f.addEventListener("click", (e) => {
      const d = e.target.closest("[data-dia]"); if (d) { f.querySelectorAll("[data-dia]").forEach((b) => b.classList.toggle("on", b === d)); horas(d.dataset.dia); }
      const hr = e.target.closest("[data-ini]"); if (hr) { f.querySelectorAll("[data-ini]").forEach((b) => b.classList.toggle("on", b === hr)); escolhido = hr.dataset.ini; }
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const o = lerForm(f);
      if (o._honey) return;
      if (!escolhido) { const err = f.querySelector(".lipp-erro"); err.textContent = "Escolha um dia e um horário."; err.hidden = false; return; }
      if (!validar(f, o)) return;
      const bt = f.querySelector(".lipp-confirmar"); bt.disabled = true; bt.textContent = "Agendando…";
      const r = await chamar("agendar", { ...o, inicio: escolhido });
      if (!r.ok) { bt.disabled = false; bt.textContent = "Confirmar reunião"; const err = f.querySelector(".lipp-erro"); err.textContent = r.mensagem; err.hidden = false; return; }
      el.innerHTML = `<b class="lipp-c-tit">✔ ${r.status === "agendado" ? "Reunião confirmada" : "Pedido de reunião registrado"}</b><p>${esc(r.mensagem)}</p>${r.meet ? `<a class="btn btn-primario" href="${esc(r.meet)}" target="_blank" rel="noopener">Abrir o Google Meet</a>` : ""}`;
      el.classList.add("ok");
      estado.msgs.push({ papel: "lipp", texto: r.mensagem }); salvar();
      sugestoes(["Ver cursos on-line (UniLTS)", "Falar no WhatsApp"]); rolar();
      if (window.LTS_API && window.LTS_API.evento) window.LTS_API.evento("lipp", "agendou");
    });
    rolar();
  }
  function cartaoLead() {
    const el = document.createElement("div"); el.className = "lipp-cartao";
    el.innerHTML = `<b class="lipp-c-tit">Receber uma proposta</b><small>Um consultor responde em até 1 dia útil.</small><form class="lipp-form" novalidate>${camposContato()}<button class="btn btn-primario lipp-confirmar" type="submit">Enviar</button></form>`;
    lista.appendChild(el); rolar();
    const f = el.querySelector("form");
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const o = lerForm(f); if (o._honey) return; if (!validar(f, o)) return;
      const bt = f.querySelector(".lipp-confirmar"); bt.disabled = true;
      const r = await chamar("lead", o);
      if (!r.ok) { bt.disabled = false; const err = f.querySelector(".lipp-erro"); err.textContent = r.mensagem; err.hidden = false; return; }
      el.innerHTML = `<b class="lipp-c-tit">✔ Solicitação enviada</b><p>${esc(r.mensagem)}</p>`; el.classList.add("ok");
      estado.msgs.push({ papel: "lipp", texto: r.mensagem }); salvar();
      sugestoes(["Agendar reunião com um consultor", "Falar no WhatsApp"]); rolar();
    });
  }

  window.LIPP = { abrir, fechar, enviar, agendar: () => { abrir(); cartaoAgenda(); } };
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-lipp]"); if (a) { e.preventDefault(); a.dataset.lipp === "agendar" ? window.LIPP.agendar() : abrir(); } });
  if (estado.aberto) abrir();
})();
