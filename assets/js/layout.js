/* =====================================================================
   LIPPMANN · LAYOUT COMUM (cabeçalho, rodapé, WhatsApp, formulários)
   O menu e o rodapé são montados aqui para TODAS as páginas.
   Para mudar um item do menu, edite a lista MENU abaixo.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;

  /* Ao trocar de página, sempre começar do topo (exceto links com #âncora) */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) window.scrollTo(0, 0);

  const MENU = [
    { id: "a-lippmann",   rotulo: "A LIPPMANN",   href: "a-lippmann.html" },
    { id: "treinamentos", rotulo: "Treinamentos", href: "treinamentos.html" },
    { id: "solucoes",     rotulo: "Soluções",     href: "solucoes.html" },
    { id: "conteudo",     rotulo: "Conteúdo",     href: "conteudo.html" },
    { id: "hub",          rotulo: "HUB",          href: "hub.html" },
    { id: "unilts",       rotulo: '<span class="nav-uni">Uni<b>LTS</b></span>', href: "unilts.html" },
    { id: "fale-conosco", rotulo: "Fale Conosco", href: "fale-conosco.html" }
  ];

  /* ---------- Ícones (SVG em linha) ---------- */
  const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01Zm-7.01 15.24h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>`,
    instagram: s('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.83v1.54h.06c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.13V21h-4v-5.02c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65V21h-4V9.75Z"/></svg>`,
    mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    arrow: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    search: s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    lock: s('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    cap: s('<path d="M2 9l10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
    gear: s('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/>'),
    book: s('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    chat: s('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
    download: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
    file: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6"/>'),
    play: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 14.5v-9l7 4.5-7 4.5Z"/></svg>`,
    mini: s('<rect x="3" y="4" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor"/>'),
    expand: s('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    shrink: s('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    upload: s('<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>'),
    eye: s('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    relogio: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    compartilhar: s('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
    building: s('<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4"/>'),
    user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
    check: s('<path d="m5 12 5 5 9-10"/>'),
    escudo: s('<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"/>')
  };
  window.LTS_ICON = ICON;

  const wa = (msg) => `https://wa.me/${C.contato.whatsappNumero}?text=${encodeURIComponent(msg || C.contato.whatsappMensagem)}`;
  window.LTS_WA = wa;

  /* ---------- Cabeçalho ---------- */
  const atual = document.body.dataset.page || "";
  const header = document.getElementById("site-header");
  if (header) {
    header.outerHTML = `
    <div class="utilbar">
      <div class="wrap">
        <div class="util-contatos">
          <a href="${wa()}" target="_blank" rel="noopener" data-track="whatsapp">${ICON.whatsapp}<span>${C.contato.whatsappExibicao}</span></a>
          <a class="util-email" href="mailto:${C.contato.emailComercial}" data-track="email">${ICON.mail}<span>${C.contato.emailComercial}</span></a>
        </div>
        <span class="manifesto">${C.empresa.manifesto}</span>
        <div class="util-redes">
          <a href="${C.redes.instagram.url}" target="_blank" rel="noopener" aria-label="Instagram" data-track="instagram">${ICON.instagram}</a>
          <a href="${C.redes.youtube.url}" target="_blank" rel="noopener" aria-label="YouTube" data-track="youtube">${ICON.youtube}</a>
          <a href="${C.redes.linkedin.url}" target="_blank" rel="noopener" aria-label="LinkedIn" data-track="linkedin">${ICON.linkedin}</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="wrap">
        <a class="logo" href="/index.html" aria-label="LIPPMANN Treinamentos e Soluções — página inicial">
          <img src="/assets/img/marca/LTS-LOGO-HOR-AZUL_REV01.svg" alt="LIPPMANN Treinamentos e Soluções" width="250" height="19">
        </a>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-principal" aria-label="Abrir menu">${ICON.menu}</button>
        <nav class="nav" id="nav-principal" aria-label="Navegação principal">
          ${MENU.map(m => `<a href="${m.href}"${m.id === atual ? ' aria-current="page"' : ""}>${m.rotulo}</a>`).join("")}
          <a class="nav-integra" href="/integra/" title="Área restrita da equipe LIPPMANN">${ICON.lock}<span>L³ INTEGRA</span></a>
        </nav>
        <a class="btn btn-primario header-cta" href="fale-conosco.html">Solicitar proposta</a>
      </div>
    </header>`;
    const btn = document.querySelector(".menu-btn");
    const nav = document.getElementById("nav-principal");
    btn.addEventListener("click", () => {
      const aberto = nav.classList.toggle("aberto");
      btn.setAttribute("aria-expanded", aberto);
      btn.innerHTML = aberto ? ICON.close : ICON.menu;
    });
  }

  /* ---------- Rodapé ---------- */
  const footer = document.getElementById("site-footer");
  if (footer) {
    const ano = new Date().getFullYear();
    footer.outerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <img class="foot-logo" src="/assets/img/marca/LTS-LOGO-EMP-BRANCO_REV01.svg" alt="LIPPMANN Treinamentos e Soluções" width="240" height="45">
            <p class="foot-slogan">“${C.empresa.slogan}”</p>
            <p>${C.empresa.manifesto}</p>
            <div class="foot-redes">
              <a href="${C.redes.instagram.url}" target="_blank" rel="noopener" aria-label="Instagram ${C.redes.instagram.exibicao}" data-track="instagram">${ICON.instagram}</a>
              <a href="${C.redes.youtube.url}" target="_blank" rel="noopener" aria-label="YouTube ${C.redes.youtube.exibicao}" data-track="youtube">${ICON.youtube}</a>
              <a href="${C.redes.linkedin.url}" target="_blank" rel="noopener" aria-label="LinkedIn" data-track="linkedin">${ICON.linkedin}</a>
              <a href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp" data-track="whatsapp">${ICON.whatsapp}</a>
            </div>
          </div>
          <div>
            <h4>Navegação</h4>
            <ul>
              <li><a href="/index.html">Início</a></li>
              ${MENU.map(m => `<li><a href="${m.href}">${m.rotulo}</a></li>`).join("")}
              <li><a href="trabalhe-conosco.html"><b>Trabalhe Conosco</b></a></li>
              <li><a href="politica-de-privacidade.html">Política de Privacidade</a></li>
              <li><a href="ajuda.html">Central de Ajuda</a></li>
              <li><a href="protocolo.html">Consultar protocolo</a></li>
              <li><a href="pedido.html">Consultar compra</a></li>
            </ul>
          </div>
          <div>
            <h4>Redes sociais</h4>
            <ul>
              <li><a href="${C.redes.instagram.url}" target="_blank" rel="noopener" data-track="instagram">Instagram · ${C.redes.instagram.exibicao}</a></li>
              <li><a href="${C.redes.youtube.url}" target="_blank" rel="noopener" data-track="youtube">YouTube · ${C.redes.youtube.exibicao}</a></li>
              <li><a href="${C.redes.linkedin.url}" target="_blank" rel="noopener" data-track="linkedin">LinkedIn · ${C.redes.linkedin.exibicao}</a></li>
              <li><a href="${C.redes.google.url}" target="_blank" rel="noopener" data-track="google">${C.redes.google.exibicao}</a></li>
            </ul>
          </div>
          <div>
            <h4>Contato</h4>
            <ul class="foot-contato">
              <li>${ICON.whatsapp}<a href="${wa()}" target="_blank" rel="noopener" data-track="whatsapp">${C.contato.whatsappExibicao}</a></li>
              <li>${ICON.mail}<span><a href="mailto:${C.contato.emailComercial}" data-track="email">${C.contato.emailComercial}</a><br><small>Comercial</small></span></li>
              <li>${ICON.globe}<a href="/index.html">${C.contato.site}</a></li>
            </ul>
            <a class="doc-mini doc-mini-escuro" href="${C.downloads.apresentacao}" target="_blank" rel="noopener" data-track="arquivo:apresentacao-institucional">
              <span class="doc-mini-capa"><img src="/assets/img/previews/apresentacao.webp" alt="" width="420" height="594" loading="lazy"><span class="doc-selo">PDF</span></span>
              <span class="doc-mini-txt"><b>Apresentação institucional</b><small>9 páginas · 1,2 MB</small><span class="doc-mini-acao">${ICON.eye} Visualizar</span></span>
            </a>
          </div>
        </div>
        <div class="foot-base">
          <span>© ${ano} ${C.empresa.razaoSocial} · CNPJ ${C.empresa.cnpj}</span>
          <span>“${C.empresa.slogan}”</span>
        </div>
      </div>
    </footer>
    <a class="whats-float" href="${wa()}" target="_blank" rel="noopener" aria-label="Falar com a LIPPMANN pelo WhatsApp" data-track="whatsapp">
      <span class="rotulo">Fale com a LIPPMANN</span>
      <span class="bolha">${ICON.whatsapp}</span>
      <span class="pulso" aria-hidden="true"></span>
    </a>`;
  }

  /* ---------- Ícones declarados no HTML: <i data-icon="mail"></i> ---------- */
  document.querySelectorAll("[data-icon]").forEach(el => { el.outerHTML = ICON[el.dataset.icon] || ""; });
  document.querySelectorAll("[data-wa]").forEach(a => {
    a.href = wa(a.dataset.wa || ""); a.target = "_blank"; a.rel = "noopener";
    if (!a.dataset.track) a.dataset.track = "whatsapp";
  });
  document.querySelectorAll("[data-download]").forEach(a => { a.href = C.downloads[a.dataset.download] || "#"; });

  /* =====================================================================
     VALIDAÇÃO E MÁSCARAS
     ===================================================================== */
  function validar(form) {
    let ok = true, primeiro = null;
    form.querySelectorAll("[required]").forEach(el => {
      const box = el.closest(".campo") || el.closest(".consent");
      let valido = el.type === "checkbox" ? el.checked : el.type === "file" ? el.files.length > 0 : el.value.trim() !== "";
      if (valido && el.type === "email") valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      if (valido && el.dataset.tipo === "tel") valido = el.value.replace(/\D/g, "").length >= 10;
      if (box) box.classList.toggle("erro", !valido);
      if (!valido) { ok = false; primeiro = primeiro || el; }
    });
    if (primeiro) primeiro.focus();
    return ok;
  }
  window.LTS_VALIDAR = validar;

  document.addEventListener("input", e => {
    const el = e.target;
    if (el.dataset && (el.dataset.tipo || "").startsWith("tel")) {
      let v = el.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}`;
      else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      else if (v.length) v = `(${v}`;
      el.value = v;
    }
    const box = el.closest && (el.closest(".campo.erro") || el.closest(".consent.erro"));
    if (box) box.classList.remove("erro");
  });

  window.LTS_AVISO = function (el, tipo, html) {
    el.className = "form-aviso " + tipo;
    el.innerHTML = html;
    el.hidden = false;
  };

  /* =====================================================================
     IDENTIFICAÇÃO ANÔNIMA DO VISITANTE (para estatísticas do L³ INTEGRA)
     ===================================================================== */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const consentido = () => store.get("lts_cookies") === "aceito";
  function visitante() {
    let v = store.get("lts_vid");
    if (!v) { v = rid(); if (consentido()) store.set("lts_vid", v); }
    return v;
  }
  let sessao = null;
  try { sessao = sessionStorage.getItem("lts_sid") || rid(); sessionStorage.setItem("lts_sid", sessao); } catch (e) { sessao = rid(); }

  /* =====================================================================
     COMUNICAÇÃO COM O SERVIDOR (api/)
     LTS_API.registrar(tipo, form, extras) -> {ok, mensagem}
       tipo: "lead" | "newsletter" | "contato" | "candidato"
     LTS_API.evento(tipo, alvo, extra)  (somente com consentimento)
     ===================================================================== */
  const DEMO = C.api.modoDemonstracao;
  const demoDB = {
    ler() { try { return JSON.parse(store.get("lts_demo_db") || "{}"); } catch (e) { return {}; } },
    gravar(db) { store.set("lts_demo_db", JSON.stringify(db)); }
  };
  window.LTS_DEMO_DB = demoDB;

  async function registrar(tipo, form, extras = {}) {
    const fd = new FormData(form);
    if (fd.get("_honey")) return { ok: true };
    fd.delete("_honey");
    fd.append("_tipo", tipo);
    fd.append("_pagina", location.pathname.split("/").pop() || "index.html");
    fd.append("_visitante", visitante());
    fd.append("_sessao", sessao);
    Object.entries(extras).forEach(([k, v]) => fd.append(k, v));
    if (DEMO) {
      await new Promise(r => setTimeout(r, 600));
      const db = demoDB.ler();
      const item = { id: Date.now(), tipo, criado: new Date().toISOString(), dados: {} };
      fd.forEach((v, k) => { item.dados[k] = v instanceof File ? (v.name || "") : v; });
      (db.registros = db.registros || []).push(item);
      demoDB.gravar(db);
      const pr = tipo === "contato" && window.LTS_OUV_DEMO ? window.LTS_OUV_DEMO.criar({ assunto: item.dados.Assunto, nome: item.dados.Nome, email: item.dados["E-mail"], telefone: item.dados.Telefone, mensagem: item.dados.Mensagem }) : null;
      return { ok: true, demonstracao: true, ...(pr || {}) };
    }
    // envia em JSON para a função /api/registrar (arquivos vão antes, direto ao Supabase Storage)
    const dados = {};
    fd.forEach((v, k) => { if (!(v instanceof File)) dados[k] = v; });
    try {
      const r = await fetch(C.api.base + "registrar", { method: "POST", body: JSON.stringify(dados), headers: { "Content-Type": "application/json" }, credentials: "same-origin" });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok && j.ok !== false, mensagem: j.mensagem, protocolo: j.protocolo, chave: j.chave };
    } catch (e) {
      return { ok: false };
    }
  }

  /* Envia um arquivo direto ao Supabase Storage usando o endereço temporário gerado em /api/upload
     (ou pelo painel). Retorna o caminho gravado. */
  async function enviarArquivo(arquivo, rota = "upload", extras = {}) {
    const r = await fetch(C.api.base + rota, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: arquivo.name, tamanho: arquivo.size, ...extras }), credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.mensagem || "Não foi possível preparar o envio do arquivo.");
    const fd = new FormData();
    fd.append("cacheControl", "3600");
    fd.append("", arquivo);
    const h = { "x-upsert": "false" };
    if (j.apikey) { h.apikey = j.apikey; h.Authorization = "Bearer " + j.apikey; }
    const up = await fetch(j.url, { method: "PUT", body: fd, headers: h });
    if (!up.ok) throw new Error("O envio do arquivo falhou. Verifique a conexão e tente novamente.");
    return j.caminho;
  }

  const fila = [];
  function evento(tipo, alvo = "", extra = {}) {
    if (!consentido()) return;
    const ev = { tipo, alvo, pagina: location.pathname.split("/").pop() || "index.html", visitante: visitante(), sessao, ref: document.referrer ? new URL(document.referrer).hostname : "", ...extra, t: new Date().toISOString() };
    if (DEMO) { const db = demoDB.ler(); (db.eventos = db.eventos || []).push(ev); if (db.eventos.length > 3000) db.eventos = db.eventos.slice(-3000); demoDB.gravar(db); return; }
    fila.push(ev);
    if (fila.length >= 5) enviarFila();
  }
  function enviarFila() {
    if (!fila.length || DEMO) return;
    const lote = JSON.stringify(fila.splice(0));
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(C.api.base + "evento", new Blob([lote], { type: "application/json" }));
      else fetch(C.api.base + "evento", { method: "POST", body: lote, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch (e) {}
  }
  window.LTS_API = { registrar, evento, visitante, enviarArquivo };

  /* ---------- Rastreamento (após consentimento) ---------- */
  // tempo ativo na página: envia apenas o acréscimo desde o último envio
  let ativo = 0, enviado = 0, ultimo = Date.now(), visivel = !document.hidden;
  function registrarTempo() {
    if (visivel) { ativo += Date.now() - ultimo; ultimo = Date.now(); }
    const delta = Math.round((ativo - enviado) / 1000);
    if (delta >= 1) { evento("tempo", "", { segundos: delta }); enviado = ativo; }
    enviarFila();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { registrarTempo(); visivel = false; }
    else { visivel = true; ultimo = Date.now(); }
  });
  window.addEventListener("pagehide", registrarTempo);
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-track]");
    if (!a) return;
    const [tipo, alvo] = a.dataset.track.includes(":") ? a.dataset.track.split(":") : ["clique", a.dataset.track];
    evento(tipo, alvo);
  }, true);

  function iniciarRastreamento() { evento("pageview", document.title); }

  /* ---------- Aviso de cookies (LGPD) ---------- */
  const escolha = store.get("lts_cookies");
  if (escolha === "aceito") iniciarRastreamento();
  else if (!escolha) {
    const bar = document.createElement("div");
    bar.className = "cookies";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Aviso de cookies");
    bar.innerHTML = `<p>Usamos armazenamento local para medir o uso do site e melhorar nossos conteúdos. Nenhum dado é vendido a terceiros. <a href="politica-de-privacidade.html">Política de Privacidade</a>.</p>
      <div><button class="btn btn-contorno" type="button" data-c="recusado">Recusar</button><button class="btn btn-primario" type="button" data-c="aceito">Aceitar</button></div>`;
    document.body.appendChild(bar);
    bar.addEventListener("click", e => {
      const b = e.target.closest("[data-c]"); if (!b) return;
      store.set("lts_cookies", b.dataset.c);
      bar.remove();
      if (b.dataset.c === "aceito") { store.set("lts_vid", visitante()); iniciarRastreamento(); }
    });
  }

  /* ---------- Newsletter (qualquer página com #form-news) ---------- */
  const news = document.getElementById("form-news");
  if (news) {
    news.addEventListener("submit", async e => {
      e.preventDefault();
      const aviso = news.querySelector(".form-aviso");
      if (!validar(news)) return;
      const bt = news.querySelector("button[type=submit]");
      bt.disabled = true; bt.textContent = "Enviando…";
      const r = await registrar("newsletter", news);
      bt.disabled = false; bt.textContent = "Cadastrar";
      if (r.ok) { news.reset(); window.LTS_AVISO(aviso, "ok", "Cadastro confirmado. Enviamos um e-mail de boas-vindas para o endereço informado."); }
      else window.LTS_AVISO(aviso, "falha", `Não foi possível concluir agora. Tente novamente ou escreva para <b>${C.contato.emailComercial}</b>.`);
    });
  }

  /* ---------- LIPP · assistente virtual (acima do botão do WhatsApp, nas páginas públicas) ---------- */
  if (document.querySelector(".whats-float") && C.lipp !== false) {
    const js = (src) => new Promise((ok) => { const s = document.createElement("script"); s.src = src; s.defer = true; s.onload = ok; s.onerror = ok; document.body.appendChild(s); });
    const carregar = () => (DEMO ? js("/assets/js/lipp-motor.js?v=7") : Promise.resolve()).then(() => js("/assets/js/lipp.js?v=7"));
    "requestIdleCallback" in window ? requestIdleCallback(carregar, { timeout: 2500 }) : setTimeout(carregar, 1200);
  }
})();
