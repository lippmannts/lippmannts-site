/* =====================================================================
   L³ INTEGRA · aplicação do painel
   Seções: Visão geral · Inteligência comercial · Leads e contatos · Newsletter ·
   Banco de talentos · Agenda · HUB · Treinamentos · Políticas · UniLTS · Financeiro e BI · Exportar · Configurações
   Todos os cálculos dos relatórios são feitos aqui, a partir dos dados
   brutos enviados pela função /api/painel (Vercel + Supabase) ou pelo modo demonstração.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  const DEMO = !!(C.api && C.api.modoDemonstracao);
  const TR = window.LTS_TREINAMENTOS || [], SOL = window.LTS_SOLUCOES || [];
  const $ = id => document.getElementById(id);
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = n => Number(n || 0).toLocaleString("pt-BR");
  const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    globo: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>'),
    painel: s('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    alvo: s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    pessoas: s('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    mala: s('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    cal: s('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    baixar: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
    fechar: s('<path d="M6 6l12 12M18 6 6 18"/>'),
    robo: s('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/><circle cx="12" cy="3" r="1"/>'),
    grafico: s('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
    capelo: s('<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>'),
    jornal: s('<path d="M4 4h13v16H6a2 2 0 0 1-2-2V4Z"/><path d="M17 8h3v10a2 2 0 0 1-2 2h-1M8 8h5M8 12h5M8 16h3"/>'),
    livro: s('<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h14"/>'),
    escudo: s('<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'),
    whats: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74 2.07.89 2.49.71 2.94.67.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>`
  };

  /* ================= Comunicação com o servidor ================= */
  let token = null;
  async function api(acao, { corpo, query = "", form } = {}) {
    if (DEMO) return window.L3_DEMO.call(acao, { corpo, query, form });
    const opt = { credentials: "same-origin", headers: {} };
    if (corpo || form) {
      opt.method = "POST";
      if (token) opt.headers["X-L3-Token"] = token;
      if (form) opt.body = form; else { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(corpo); }
    }
    try {
      const r = await fetch(`/api/painel?acao=${acao}${query ? "&" + query : ""}`, opt);
      const j = await r.json().catch(() => ({ ok: false, mensagem: "Resposta inválida do servidor." }));
      if (r.status === 401 && acao !== "login") { mostrarLogin("Sua sessão expirou. Entre novamente."); }
      return j;
    } catch (e) {
      return { ok: false, mensagem: "Não foi possível falar com o servidor. Verifique a conexão." };
    }
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ================= Estado ================= */
  const st = { usuario: null, dias: 30, dados: null, secao: "visao", filtros: {} };
  const admin = () => st.usuario && st.usuario.perfil === "admin";
  /* matriz de acessos: a aba só aparece se estiver liberada para o usuário */
  const pode = aba => !!st.usuario && (st.usuario.perfil === "admin" || (st.usuario.permissoes || []).includes(aba));
  const ABA_SECAO = { visao: ["visao"], inteligencia: ["inteligencia"], leads: ["leads", "denuncias"], ouvidoria: ["denuncias"], lipp: ["lipp"], newsletter: ["newsletter"], talentos: ["talentos"], agenda: ["agenda"], exportar: ["exportar"], hub: ["hub"], catalogo: ["catalogo"], solucoes: ["solucoes"], traducoes: ["traducoes"], politicas: ["politicas"], unilts: ["unilts"], financeiro: ["financeiro"], config: null };
  const podeSecao = id => !ABA_SECAO[id] || ABA_SECAO[id].some(pode);

  const SECOES = [
    { id: "visao", rotulo: "Visão geral", ic: "painel", grupo: "Relatórios", sub: "Métricas de audiência, engajamento e conversão do site" },
    { id: "inteligencia", rotulo: "Inteligência comercial", ic: "alvo", grupo: "Relatórios", sub: "Público-alvo, empresas em destaque e bases para campanhas" },
    { id: "leads", rotulo: "Leads e contatos", ic: "pessoas", grupo: "Relacionamento", sub: "Cadastros da Biblioteca Técnica e mensagens do Fale Conosco" },
    { id: "ouvidoria", rotulo: "Ouvidoria", ic: "escudo", grupo: "Relacionamento", sub: "Protocolos de denúncias, reclamações e sugestões, com respostas ao solicitante" },
    { id: "lipp", rotulo: "LIPP · Assistente IA", ic: "robo", grupo: "Relacionamento", sub: "Conversas do assistente virtual, principais dúvidas, leads capturados e reuniões no Google Meet" },
    { id: "newsletter", rotulo: "Newsletter", ic: "mail", grupo: "Relacionamento", sub: "Inscritos na Newsletter LIPPMANN" },
    { id: "talentos", rotulo: "Banco de talentos", ic: "mala", grupo: "Relacionamento", sub: "Currículos recebidos pelo Trabalhe Conosco" },
    { id: "agenda", rotulo: "Agenda", ic: "cal", grupo: "Relacionamento", sub: "Reuniões e entrevistas com convite por e-mail" },
    { id: "hub", rotulo: "HUB e publicações", ic: "jornal", grupo: "Site e conteúdo", sub: "Notícias, artigos técnicos e prestação de contas do site" },
    { id: "catalogo", rotulo: "Treinamentos", ic: "livro", grupo: "Site e conteúdo", sub: "Cartões e fichas da aba Treinamentos (modelo SENAI)" },
    { id: "solucoes", rotulo: "Soluções", ic: "grafico", grupo: "Site e conteúdo", sub: "Cartões, grupos e filtros da aba Soluções" },
    { id: "traducoes", rotulo: "Traduções", ic: "globo", grupo: "Site e conteúdo", sub: "Textos do site em português de Portugal, inglês e espanhol" },
    { id: "politicas", rotulo: "Políticas e Termo", ic: "escudo", grupo: "Site e conteúdo", sub: "Políticas corporativas e Termo de Compromisso Social" },
    { id: "unilts", rotulo: "UniLTS", ic: "capelo", grupo: "Ensino a distância", sub: "Turmas, cursos EaD, alunos, certificados e relatórios FR-DOC-18" },
    { id: "financeiro", rotulo: "Financeiro e BI", ic: "grafico", grupo: "Gestão", sub: "Faturamento, vendas da UniLTS, despesas, lucro líquido e Provisão Social de 10%" },
    { id: "exportar", rotulo: "Exportar dados", ic: "baixar", grupo: "Gestão", sub: "Bases completas em Excel (.xlsx) ou CSV" },
    { id: "config", rotulo: "Configurações", ic: "gear", grupo: "Gestão", sub: "Notificações, site, materiais, usuários e segurança" }
  ];

  /* ================= Login ================= */
  function mostrarLogin(msg) {
    st.usuario = null; token = null;
    try { sessionStorage.removeItem("l3_token"); } catch (e) {}
    $("tela-app").hidden = true; $("tela-login").hidden = false;
    const e = $("lg-erro"); e.hidden = !msg; e.textContent = msg || "";
    if (DEMO) { const d = $("lg-demo"); d.hidden = false; d.innerHTML = "Modo demonstração: os dados são fictícios e ficam só neste navegador. Use <b>admin</b> ou <b>marketing</b> com as senhas definidas."; }
    $("lg-usuario").focus();
  }
  $("form-login").addEventListener("submit", async e => {
    e.preventDefault();
    const bt = e.target.querySelector("button"); bt.disabled = true;
    const r = await api("login", { corpo: { usuario: $("lg-usuario").value.trim(), senha: $("lg-senha").value } });
    bt.disabled = false;
    if (!r.ok) { $("lg-erro").hidden = false; $("lg-erro").textContent = r.mensagem || "Não foi possível entrar."; $("lg-diag").hidden = !r.diagnostico; return; }
    $("lg-senha").value = "";
    entrar(r.usuario, r.token, r.senha_padrao);
  });

  async function entrar(usuario, tk, senhaPadrao) {
    st.usuario = usuario; token = tk;
    try { sessionStorage.setItem("l3_token", tk); } catch (e) {}
    $("tela-login").hidden = true; $("tela-app").hidden = false;
    $("pe-nome").textContent = usuario.nome || usuario.usuario;
    $("pe-perfil").textContent = usuario.perfil === "admin" ? "Superadministrador" : "Acesso personalizado";
    const fd = $("faixa-demo");
    if (DEMO) { fd.hidden = false; fd.innerHTML = "<b>Modo demonstração.</b> Os números abaixo são <b>dados de exemplo</b> gerados para a amostra, somados aos formulários que você enviar no site. No servidor definitivo, o painel mostra os dados reais."; }
    else if (senhaPadrao) { fd.hidden = false; fd.innerHTML = "<b>Segurança:</b> você entrou com a senha padrão. Troque-a agora em <a href='#config'>Configurações › Minha senha</a>."; }
    montarMenu();
    await carregar();
    rotear();
  }
  $("bt-sair").addEventListener("click", async () => { await api("logout", { corpo: {} }); mostrarLogin(); });
  $("bt-menu").addEventListener("click", () => $("tela-app").classList.toggle("menu-aberto"));

  function montarMenu() {
    let grupo = "", html = "";
    SECOES.filter(x => podeSecao(x.id)).forEach(x => {
      if (x.grupo !== grupo) { grupo = x.grupo; html += `<div class="grupo">${grupo}</div>`; }
      html += `<button type="button" data-secao="${x.id}">${IC[x.ic]}<span>${x.rotulo}</span><span class="badge" data-badge="${x.id}" hidden></span></button>`;
    });
    $("menu").innerHTML = html;
    $("menu").onclick = e => { const b = e.target.closest("[data-secao]"); if (b) { location.hash = b.dataset.secao; $("tela-app").classList.remove("menu-aberto"); } };
  }
  function badges() {
    const novos = t => st.dados.registros.filter(r => r.tipo === t && r.status === "novo").length;
    const map = { leads: novos("lead") + novos("contato"), talentos: novos("candidato") };
    Object.entries(map).forEach(([k, v]) => { const b = document.querySelector(`[data-badge="${k}"]`); if (b) { b.hidden = !v; b.textContent = v; } });
  }

  async function carregar() {
    const r = await api("dados", { query: "dias=" + Math.min(730, st.dias * 2) });
    if (!r.ok) { toast(r.mensagem || "Erro ao carregar os dados."); return; }
    st.dados = r;
    st.dados.registros.forEach(x => { x.criado = String(x.criado || ""); });
    badges();
  }

  window.addEventListener("hashchange", rotear);
  function rotear() {
    if (!st.usuario) return;
    let id = location.hash.slice(1) || "visao";
    let sec = SECOES.find(x => x.id === id && podeSecao(x.id));
    if (!sec) { sec = SECOES.find(x => podeSecao(x.id)); id = sec.id; }
    st.secao = id;
    document.querySelectorAll("[data-secao]").forEach(b => { if (b.dataset.secao === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    $("titulo-secao").textContent = sec.rotulo;
    $("sub-secao").textContent = sec.sub;
    $("acoes-topo").innerHTML = "";
    graficos.forEach(g => g.destroy()); graficos = [];
    ({ visao: secVisao, inteligencia: secInteligencia, leads: secLeads, ouvidoria: secOuvidoria, lipp: secLipp, newsletter: secNewsletter, talentos: secTalentos, agenda: secAgenda, exportar: secExportar, hub: secHub, catalogo: secCatalogo, solucoes: secSolucoes, traducoes: secTraducoes, politicas: secPoliticas, unilts: secUnilts, financeiro: secFinanceiro, config: secConfig })[id]();
    window.scrollTo(0, 0);
  }

  /* ================= Cálculos ================= */
  // evento: [t, tipo, alvo, pagina, visitante, segundos, cidade, uf, dispositivo, ref, sessao]
  function recorte(deslocamento = 0) {
    const fim = new Date(); fim.setHours(23, 59, 59, 999); fim.setDate(fim.getDate() - st.dias * deslocamento);
    const ini = new Date(fim); ini.setDate(ini.getDate() - st.dias + 1); ini.setHours(0, 0, 0, 0);
    const dentro = t => { const d = new Date(String(t).replace(" ", "T")); return d >= ini && d <= fim; };
    return {
      ini, fim,
      ev: st.dados.eventos.filter(e => dentro(e[0])),
      reg: st.dados.registros.filter(r => dentro(r.criado))
    };
  }
  function contar(lista, chave, filtro) {
    const m = new Map();
    lista.forEach(x => { if (filtro && !filtro(x)) return; const k = typeof chave === "function" ? chave(x) : x[chave]; if (k === undefined || k === null || k === "") return; m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  const unicos = (lista, i) => new Set(lista.map(x => x[i]).filter(Boolean)).size;
  function metricas(r) {
    const pv = r.ev.filter(e => e[1] === "pageview");
    const tempo = r.ev.filter(e => e[1] === "tempo").reduce((a, e) => a + (+e[5] || 0), 0);
    const sess = unicos(pv, 10) || unicos(pv, 4);
    return {
      pv: pv.length, vis: unicos(pv, 4), sess,
      tempoMedio: sess ? Math.round(tempo / sess) : 0,
      leads: r.reg.filter(x => x.tipo === "lead").length,
      news: r.reg.filter(x => x.tipo === "newsletter").length,
      contatos: r.reg.filter(x => x.tipo === "contato").length,
      cands: r.reg.filter(x => x.tipo === "candidato").length,
      propostas: r.ev.filter(e => e[1] === "whatsapp-proposta" || e[1] === "solucao" || (e[1] === "clique" && e[2] === "whatsapp")).length
    };
  }
  const NOMES_PAG = { "index.html": "Início", "": "Início", "a-lippmann.html": "A LIPPMANN", "treinamentos.html": "Treinamentos", "solucoes.html": "Soluções", "conteudo.html": "Conteúdo", "fale-conosco.html": "Fale Conosco", "trabalhe-conosco.html": "Trabalhe Conosco", "politica-de-privacidade.html": "Política de Privacidade" };
  const nomeTr = id => (TR.find(t => t.id === id) || {}).titulo || id;
  const nomeSol = id => (SOL.find(t => t.id === id) || {}).titulo || id;
  const nomeArquivo = a => ({ "apresentacao-institucional": "Apresentação Institucional (PDF)", "portfolio-treinamentos": "Portfólio de Treinamentos (PDF)", "portfolio-solucoes": "Portfólio de Soluções (PDF)" })[a] || (a.startsWith("ficha-") ? "Ficha: " + nomeTr(a.slice(6)) : ((window.LTS_CONTEUDOS || []).find(m => m.id === a) || {}).titulo || a);
  const REDES = { instagram: "Instagram", youtube: "YouTube", linkedin: "LinkedIn", whatsapp: "WhatsApp", google: "Avaliações Google", email: "E-mail comercial" };
  function origemTrafego(ref) {
    const h = String(ref || "").toLowerCase();
    if (!h) return "Acesso direto";
    if (h.includes("google")) return "Google"; if (h.includes("instagram")) return "Instagram"; if (h.includes("linkedin") || h.includes("lnkd")) return "LinkedIn";
    if (h.includes("facebook") || h.includes("fb.")) return "Facebook"; if (h.includes("youtube")) return "YouTube"; if (h.includes("bing")) return "Bing";
    if (h.includes("lippmannts")) return "Acesso direto";
    return h;
  }
  function interesseTreinamentos(ev) {
    const m = new Map();
    const soma = (id, p) => { if (!id) return; m.set(id, (m.get(id) || 0) + p); };
    ev.forEach(e => {
      if (e[1] === "ficha") soma(e[2], 1);
      if (e[1] === "whatsapp-proposta" && TR.some(t => t.id === e[2])) soma(e[2], 3);
      if (e[1] === "download" && String(e[2]).startsWith("ficha-")) soma(e[2].slice(6), 2);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  /* ================= Componentes visuais ================= */
  let graficos = [];
  const cor = { azul: "#1F55C9", inst: "#0A3490", nevoa: "#9DB8F2", gelo: "#D6DFF2", lip: "#003376", verde: "#1B7F4C", cinza: "#6C727C" };
  function kpi(rot, val, ant, sufixo = "") {
    let v = "";
    if (ant !== undefined) {
      const d = ant ? Math.round(((val - ant) / ant) * 100) : (val ? 100 : 0);
      v = `<span class="var ${d > 0 ? "sobe" : d < 0 ? "desce" : "neutra"}">${d > 0 ? "▲" : d < 0 ? "▼" : "•"} ${Math.abs(d)}% vs. período anterior</span>`;
    }
    return `<div class="card kpi c3"><span class="rot">${rot}</span><span class="val">${typeof val === "number" ? fmt(val) : val}${sufixo}</span>${v}</div>`;
  }
  function ranking(lista, nome = x => x, max = 8) {
    if (!lista.length) return `<p class="vazio">Ainda não há dados neste período.</p>`;
    const top = lista.slice(0, max), m = top[0][1] || 1;
    return `<div class="ranking">${top.map(([k, v]) => `<div class="lin"><span class="nome" title="${esc(nome(k))}">${esc(nome(k))}</span><span class="v">${fmt(v)}</span><span class="barra"><i style="width:${Math.max(3, (v / m) * 100)}%"></i></span></div>`).join("")}</div>`;
  }
  const card = (cls, titulo, desc, corpo, extra = "") => `<section class="card ${cls}"><div class="card-cab"><div><h2>${titulo}</h2>${desc ? `<p class="desc">${desc}</p>` : ""}</div>${extra}</div>${corpo}</section>`;
  function grafico(id, cfg) {
    const el = $(id); if (!el || !window.Chart) { if (el) el.parentElement.innerHTML = `<p class="vazio">Gráfico indisponível (biblioteca não carregada).</p>`; return; }
    Chart.defaults.font.family = "Inter, Arial, sans-serif"; Chart.defaults.color = "#49505C";
    graficos.push(new Chart(el, cfg));
  }
  function serieDiaria(r) {
    const dias = [], mapa = {};
    for (let d = new Date(r.ini); d <= r.fim; d.setDate(d.getDate() + 1)) { const k = d.toISOString().slice(0, 10); dias.push(k); mapa[k] = { pv: 0, vis: new Set(), conv: 0 }; }
    const dk = t => { const d = new Date(String(t).replace(" ", "T")); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
    r.ev.forEach(e => { if (e[1] !== "pageview") return; const m = mapa[dk(e[0])]; if (m) { m.pv++; m.vis.add(e[4]); } });
    r.reg.forEach(x => { const m = mapa[dk(x.criado)]; if (m && x.tipo !== "candidato") m.conv++; });
    return { rot: dias.map(d => d.slice(8, 10) + "/" + d.slice(5, 7)), pv: dias.map(d => mapa[d].pv), vis: dias.map(d => mapa[d].vis.size), conv: dias.map(d => mapa[d].conv) };
  }
  function periodoBotoes() {
    $("acoes-topo").innerHTML = `<div class="seg" role="group" aria-label="Período">${[[7, "7 dias"], [30, "30 dias"], [90, "90 dias"], [365, "12 meses"]].map(([d, r]) => `<button type="button" data-dias="${d}" aria-pressed="${st.dias === d}">${r}</button>`).join("")}</div><button class="btn btn-sec" type="button" id="bt-atualizar">Atualizar</button>`;
    $("acoes-topo").querySelectorAll("[data-dias]").forEach(b => b.onclick = async () => { st.dias = +b.dataset.dias; await carregar(); rotear(); });
    $("bt-atualizar").onclick = async () => { await carregar(); rotear(); toast("Dados atualizados."); };
  }

  /* ================= 1. Visão geral ================= */
  function secVisao() {
    periodoBotoes();
    const r = recorte(0), a = recorte(1), m = metricas(r), ma = metricas(a);
    const pv = r.ev.filter(e => e[1] === "pageview");
    const min = x => x >= 60 ? `${Math.floor(x / 60)}min ${x % 60}s` : `${x}s`;
    const cidades = contar(pv, e => e[6] ? `${e[6]}${e[7] ? " / " + e[7] : ""}` : "");
    const arquivos = contar(r.ev, e => e[2], e => ["download", "arquivo", "material"].includes(e[1]));
    const redes = contar(r.ev, e => REDES[e[2]] || "", e => e[1] === "clique");
    const disp = contar(pv, 8);
    const origem = contar(pv, e => origemTrafego(e[9]));
    $("conteudo").innerHTML = `<div class="grade">
      ${kpi("Visitantes únicos", m.vis, ma.vis)}${kpi("Páginas visualizadas", m.pv, ma.pv)}${kpi("Tempo médio por visita", min(m.tempoMedio))}${kpi("Leads e contatos", m.leads + m.contatos + m.news, ma.leads + ma.contatos + ma.news)}
      ${card("c8", "Audiência e conversões por dia", "Visitantes únicos, páginas vistas e cadastros (leads, newsletter, contatos)", `<div class="grafico"><canvas id="g-dia"></canvas></div>`)}
      ${card("c4", "Conversões do período", "", `<div class="ranking">${[["Leads da Biblioteca Técnica", m.leads], ["Inscritos na Newsletter", m.news], ["Mensagens Fale Conosco", m.contatos], ["Cliques para proposta (WhatsApp)", m.propostas], ...(pode("talentos") ? [["Currículos recebidos", m.cands]] : [])].map(([k, v]) => `<div class="lin"><span class="nome">${k}</span><span class="v">${fmt(v)}</span></div>`).join("")}</div><p class="desc">Taxa de conversão: <b>${pct(m.leads + m.contatos + m.news, m.vis)}%</b> dos visitantes deixaram contato.</p>`)}
      ${card("c4", "Páginas mais vistas", "", ranking(contar(pv, e => NOMES_PAG[e[3]] || e[3])))}
      ${card("c4", "Arquivos e materiais mais acessados", "Downloads, portfólios, fichas e Biblioteca", ranking(arquivos, nomeArquivo))}
      ${card("c4", "Cliques em redes e canais", "Instagram, YouTube, LinkedIn, WhatsApp e outros", ranking(redes))}
      ${card("c4", "Geolocalização dos visitantes", "Cidade aproximada pelo IP · visitas", ranking(cidades))}
      ${card("c4", "Origem do tráfego", "De onde os visitantes chegaram", ranking(origem))}
      ${card("c4", "Dispositivos", "", disp.length ? `<div class="grafico baixo"><canvas id="g-disp"></canvas></div>` : `<p class="vazio">Ainda não há dados.</p>`)}
    </div>`;
    const sd = serieDiaria(r);
    grafico("g-dia", { type: "line", data: { labels: sd.rot, datasets: [
      { label: "Visitantes", data: sd.vis, borderColor: cor.azul, backgroundColor: "rgba(31,85,201,.12)", fill: true, tension: .3, pointRadius: 0, borderWidth: 2 },
      { label: "Páginas vistas", data: sd.pv, borderColor: cor.nevoa, tension: .3, pointRadius: 0, borderWidth: 2 },
      { label: "Cadastros", data: sd.conv, borderColor: cor.verde, backgroundColor: cor.verde, type: "bar", yAxisID: "y2", barThickness: 6, borderRadius: 2 }] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, usePointStyle: true } } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: { color: "#EEF1F6" } }, y2: { beginAtZero: true, position: "right", grid: { display: false }, ticks: { precision: 0 } } } } });
    if (disp.length) grafico("g-disp", { type: "doughnut", data: { labels: disp.map(d => d[0][0].toUpperCase() + d[0].slice(1)), datasets: [{ data: disp.map(d => d[1]), backgroundColor: [cor.inst, cor.azul, cor.nevoa, cor.gelo], borderWidth: 0 }] }, options: { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { boxWidth: 10 } } } } });
  }

  /* ================= 2. Inteligência comercial ================= */
  function secInteligencia() {
    periodoBotoes();
    const r = recorte(0);
    const pv = r.ev.filter(e => e[1] === "pageview");
    const pessoas = r.reg.filter(x => x.tipo !== "candidato");
    const cargos = contar(pessoas, x => normalizarCargo(x.cargo));
    const empresas = contar(pessoas, x => (x.empresa || "").trim());
    const trein = interesseTreinamentos(r.ev);
    const sols = contar(r.ev, e => e[2], e => e[1] === "solucao");
    const ufs = contar([...pv.map(e => e[7]), ...pessoas.map(x => x.uf)].filter(Boolean).map(u => ({ u })), "u");
    const cidades = contar([...pessoas.map(x => x.cidade && (x.cidade + (x.uf ? " / " + x.uf : ""))), ...pv.map(e => e[6] && (e[6] + (e[7] ? " / " + e[7] : "")))].filter(Boolean).map(c => ({ c })), "c");
    const comoConheceu = contar(pessoas, "origem");
    const horas = Array(24).fill(0); pv.forEach(e => horas[new Date(String(e[0]).replace(" ", "T")).getHours()]++);
    const dsem = Array(7).fill(0); pv.forEach(e => dsem[new Date(String(e[0]).replace(" ", "T")).getDay()]++);
    const vis = unicos(pv, 4);
    const viuFicha = new Set(r.ev.filter(e => ["ficha", "solucao", "material"].includes(e[1])).map(e => e[4])).size;
    const propos = new Set(r.ev.filter(e => e[1] === "whatsapp-proposta" || e[1] === "solucao" || (e[1] === "clique" && e[2] === "whatsapp")).map(e => e[4])).size;
    const conv = pessoas.length;
    const funil = [["Visitantes", vis], ["Viram treinamento/solução", viuFicha], ["Clicaram para proposta", propos], ["Deixaram contato", conv]];
    const fmax = Math.max(1, ...funil.map(f => f[1]));
    const emp = empresas.map(([nome, n]) => { const regs = pessoas.filter(x => (x.empresa || "").trim() === nome); return { nome, n, cargos: [...new Set(regs.map(x => x.cargo).filter(Boolean))].slice(0, 3).join(", "), cidade: regs.find(x => x.cidade) ? regs.find(x => x.cidade).cidade + (regs.find(x => x.cidade).uf ? " / " + regs.find(x => x.cidade).uf : "") : "", ult: regs.map(x => x.criado).sort().pop() }; });

    $("conteudo").innerHTML = `<div class="grade">
      ${card("c5", "Funil comercial do site", "Do primeiro acesso ao contato", `<div class="funil">${funil.map(([k, v]) => `<div class="et"><span>${k}</span><span><span class="b" style="display:block;width:${Math.max(2, (v / fmax) * 100)}%"></span></span><b>${fmt(v)}</b></div>`).join("")}</div><p class="desc">Conversão final: <b>${pct(conv, vis)}%</b> dos visitantes.</p>`)}
      ${card("c7", "Treinamentos mais relevantes", "Pontuação: ficha aberta (1) · download da ficha (2) · pedido de proposta (3)", ranking(trein, nomeTr, 8))}
      ${card("c4", "Público-alvo: cargos", "Cargos informados nos cadastros", ranking(cargos))}
      ${card("c4", "Soluções mais procuradas", "Pedidos de proposta por solução", ranking(sols, nomeSol))}
      ${card("c4", "Como conheceram a LIPPMANN", "", ranking(comoConheceu))}
      ${card("c8", "Empresas em destaque", "Empresas com mais interações (cadastros, contatos e newsletter)", emp.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Empresa</th><th>Interações</th><th>Cargos</th><th>Cidade</th><th>Última</th></tr></thead><tbody>${emp.slice(0, 10).map(e => `<tr data-empresa="${esc(e.nome)}"><td><b>${esc(e.nome)}</b></td><td class="num">${e.n}</td><td>${esc(e.cargos)}</td><td>${esc(e.cidade)}</td><td class="nw">${esc(dataBR(e.ult))}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vazio">Ainda não há empresas cadastradas neste período.</p>`)}
      ${card("c4", "Regiões com mais interesse", "Visitas e cadastros por estado", ranking(ufs, x => x, 8))}
      ${card("c6", "Melhores horários de acesso", "Visitas por hora do dia", `<div class="grafico baixo"><canvas id="g-horas"></canvas></div>`)}
      ${card("c6", "Melhores dias da semana", "Visitas por dia", `<div class="grafico baixo"><canvas id="g-dsem"></canvas></div>`)}
      ${card("c12", "Bases para campanhas de tráfego pago", "Sugestões geradas automaticamente a partir dos dados do período. Revise antes de publicar.", `<div class="insights">${insights({ cargos, trein, sols, ufs, cidades, horas, dsem, empresas, vis, conv, viuFicha, comoConheceu, r })}</div>`)}
    </div>`;
    document.querySelectorAll("[data-empresa]").forEach(tr => tr.onclick = () => { st.filtros.leadsBusca = tr.dataset.empresa; location.hash = "leads"; });
    const barras = (id, rot, dados) => grafico(id, { type: "bar", data: { labels: rot, datasets: [{ data: dados, backgroundColor: dados.map(v => v === Math.max(...dados) && v ? cor.inst : cor.nevoa), borderRadius: 3 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: "#EEF1F6" }, ticks: { precision: 0 } } } } });
    barras("g-horas", horas.map((_, i) => i + "h"), horas);
    barras("g-dsem", ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], dsem);
  }
  function normalizarCargo(c) {
    const t = String(c || "").trim(); if (!t) return "";
    const l = t.toLowerCase();
    if (/t[eé]cnic[oa].*seguran/.test(l)) return "Técnico(a) de Segurança do Trabalho";
    if (/engenheir[oa].*seguran/.test(l)) return "Engenheiro(a) de Segurança";
    if (/supervis/.test(l)) return "Supervisor(a)";
    if (/coordenad/.test(l)) return "Coordenador(a)";
    if (/gerente|gestor/.test(l)) return "Gerente / Gestor(a)";
    if (/analista/.test(l) && /rh|recursos|pessoas/.test(l)) return "Analista de RH";
    if (/rh|recursos humanos|pessoas/.test(l)) return "Recursos Humanos";
    if (/diretor|ceo|s[oó]ci/.test(l)) return "Diretoria / Sócio(a)";
    if (/comprad|suprimento/.test(l)) return "Compras / Suprimentos";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function insights(d) {
    const top = (l, n = 3, f = x => x) => l.slice(0, n).map(x => f(x[0]));
    const melhorH = d.horas.indexOf(Math.max(...d.horas)), melhorD = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][d.dsem.indexOf(Math.max(...d.dsem))];
    const kw = d.trein.slice(0, 5).map(([id]) => { const t = TR.find(x => x.id === id) || {}; return t.nr ? [`curso ${t.nr.toLowerCase()}`, `treinamento ${t.nr.toLowerCase()} in company`] : [String(t.titulo || id).toLowerCase()]; }).flat();
    const cidadeTop = d.cidades[0] ? d.cidades[0][0].split(" / ")[0] : "";
    const out = [];
    if (d.vis < 30 && d.conv < 5) out.push(`<div class="insight"><h3><span class="tag">Dados</span>Volume ainda baixo para conclusões firmes</h3><p>Com ${fmt(d.vis)} visitantes e ${fmt(d.conv)} cadastros no período, as sugestões abaixo são preliminares. Elas ficam mais precisas a partir de algumas centenas de visitas.</p></div>`);
    out.push(`<div class="insight"><h3><span class="tag">LinkedIn Ads</span>Segmentação por cargo e região</h3><ul>
      <li>Cargos: ${top(d.cargos, 5).map(x => `<code>${esc(x)}</code>`).join(" ") || "aguardando cadastros com cargo"}</li>
      <li>Localização: ${top(d.ufs, 3).map(x => `<code>${esc(x)}</code>`).join(" ") || "aguardando dados"}${cidadeTop ? ` · priorize raio de 80 km de <code>${esc(cidadeTop)}</code>` : ""}</li>
      <li>Setores sugeridos: indústria, logística e armazenagem, alimentos e bebidas, construção civil (empresas com 50 a 5.000 funcionários).</li>
      <li>Oferta: ${d.trein[0] ? `ficha técnica de <b>${esc(nomeTr(d.trein[0][0]))}</b> como isca para cadastro` : "portfólio de treinamentos em PDF"}.</li></ul></div>`);
    out.push(`<div class="insight"><h3><span class="tag">Google Ads</span>Palavras-chave de pesquisa</h3><ul>
      <li>${kw.length ? kw.slice(0, 8).map(k => `<code>${esc(k)}${cidadeTop ? " " + esc(cidadeTop.toLowerCase()) : ""}</code>`).join(" ") : "Aguardando interesse em treinamentos para sugerir palavras-chave."}</li>
      <li>Soluções: ${top(d.sols, 3, nomeSol).map(x => `<code>${esc(x.toLowerCase())}</code>`).join(" ") || "aguardando pedidos de proposta"}</li>
      <li>Palavras negativas: <code>gratuito</code> <code>grátis</code> <code>apostila pdf</code> <code>vaga</code> <code>emprego</code>.</li>
      <li>Página de destino: <code>treinamentos.html</code> com o botão de WhatsApp como conversão.</li></ul></div>`);
    out.push(`<div class="insight"><h3><span class="tag">Instagram e Facebook</span>Programação e remarketing</h3><ul>
      <li>Concentre a verba entre <b>${melhorH}h e ${(melhorH + 3) % 24}h</b>, com destaque para <b>${melhorD}</b>, horário de maior acesso.</li>
      <li>Remarketing: ${fmt(Math.max(0, d.viuFicha - d.conv))} visitantes viram treinamentos ou soluções e não deixaram contato. Crie um público personalizado com quem visitou <code>treinamentos.html</code> nos últimos 30 dias.</li>
      <li>Criativos: use o Lipp e fotos reais de treinamento; chamada “Solicite uma proposta”.</li></ul></div>`);
    if (d.empresas.length) out.push(`<div class="insight"><h3><span class="tag">Prospecção ativa</span>Empresas para abordagem comercial</h3><p>${top(d.empresas, 5).map(x => `<b>${esc(x)}</b>`).join(", ")} tiveram mais interações. Vale um contato consultivo do comercial com proposta direcionada.</p></div>`);
    if (d.comoConheceu.length) out.push(`<div class="insight"><h3><span class="tag">Canais</span>Onde investir primeiro</h3><p>Os cadastros citam principalmente ${top(d.comoConheceu, 3).map(x => `<b>${esc(x)}</b>`).join(", ")}. Mantenha esses canais e teste o próximo com verba pequena antes de escalar.</p></div>`);
    return out.join("");
  }

  /* ================= Tabelas de registros ================= */
  const dataBR = t => { if (!t) return ""; const d = new Date(String(t).replace(" ", "T")); return isNaN(d) ? t : d.toLocaleDateString("pt-BR") + " " + d.toTimeString().slice(0, 5); };
  const STATUS = {
    lead: ["novo", "em atendimento", "proposta enviada", "convertido", "arquivado"],
    contato: ["novo", "em atendimento", "respondido", "proposta enviada", "convertido", "arquivado"],
    newsletter: ["ativo", "cancelado"],
    candidato: ["novo", "em análise", "entrevista agendada", "aprovado", "banco de talentos", "reprovado"]
  };
  const pill = s => { const c = /novo/.test(s) ? "p-novo" : /andamento|atendimento|análise|agendada|enviada|respondido/.test(s) ? "p-andamento" : /convertido|aprovado|ativo/.test(s) ? "p-ok" : /reprovado|cancel/.test(s) ? "p-alerta" : "p-fim"; return `<span class="pill ${c}">${esc(s || "novo")}</span>`; };
  const TIPO_NOME = { lead: "Lead · Biblioteca", contato: "Fale Conosco", newsletter: "Newsletter", candidato: "Candidato" };

  function tabela({ tipos, colunas, filtroExtra = "", vazio, chaveBusca }) {
    const bus = st.filtros[chaveBusca] || "";
    $("conteudo").innerHTML = `<div style="display:grid;gap:14px">
      <div class="filtros"><input type="search" id="busca" placeholder="Buscar por nome, empresa, e-mail, cidade…" value="${esc(bus)}">${filtroExtra}<span class="contagem" id="contagem"></span>
      <span style="margin-left:auto;display:flex;gap:8px"><button class="btn btn-sec" type="button" id="bt-xlsx">${IC.baixar} Excel</button><button class="btn btn-sec" type="button" id="bt-csv">CSV</button></span></div>
      <div class="tabela-box"><table class="t"><thead><tr>${colunas.map(c => `<th>${c.rot}</th>`).join("")}</tr></thead><tbody id="corpo"></tbody></table></div></div>`;
    let atuais = [];
    const desenhar = () => {
      const q = ($("busca").value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      st.filtros[chaveBusca] = $("busca").value;
      const extra = {};
      document.querySelectorAll("[data-filtro]").forEach(sel => extra[sel.dataset.filtro] = sel.value);
      atuais = st.dados.registros.filter(r => tipos.includes(r.tipo)
        && Object.entries(extra).every(([k, v]) => !v || (k === "tipoAssunto" ? (r.tipo === "lead" ? "lead" : r.assunto) === v : String(r[k]) === v))
        && (!q || [r.nome, r.empresa, r.email, r.cidade, r.cargo, r.cargo_pretendido, r.assunto, r.telefone].join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)));
      $("corpo").innerHTML = atuais.length ? atuais.map(r => `<tr data-id="${r.id}">${colunas.map(c => `<td>${c.v(r)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${colunas.length}" class="vazio">${vazio}</td></tr>`;
      $("contagem").textContent = `${atuais.length} registro(s)`;
    };
    $("busca").oninput = desenhar;
    document.querySelectorAll("[data-filtro]").forEach(sel => sel.onchange = desenhar);
    $("corpo").onclick = e => { const tr = e.target.closest("[data-id]"); if (tr) detalhe(+tr.dataset.id); };
    $("bt-xlsx").onclick = () => exportar(atuais, "xlsx", tipos.join("-"));
    $("bt-csv").onclick = () => exportar(atuais, "csv", tipos.join("-"));
    desenhar();
  }

  function secLeads() {
    const assuntos = [...new Set(st.dados.registros.filter(r => r.tipo === "contato").map(r => r.assunto).filter(Boolean))];
    tabela({
      tipos: ["lead", "contato"], chaveBusca: "leadsBusca", vazio: "Nenhum lead ou contato encontrado.",
      filtroExtra: `<select data-filtro="tipoAssunto" aria-label="Origem"><option value="">Todas as origens</option><option value="lead">Biblioteca Técnica</option>${assuntos.map(a => `<option>${esc(a)}</option>`).join("")}</select><select data-filtro="status" aria-label="Status"><option value="">Todos os status</option>${STATUS.contato.map(s => `<option>${s}</option>`).join("")}</select>`,
      colunas: [
        { rot: "Data", v: r => `<span class="nw">${dataBR(r.criado)}</span>` },
        { rot: "Origem", v: r => r.tipo === "lead" ? "Biblioteca Técnica" : `Fale Conosco<small>${esc(r.assunto)}</small>` },
        { rot: "Nome / empresa", v: r => `<b>${esc(r.nome || "Anônimo")}</b><small>${esc(r.empresa)}</small>` },
        { rot: "Cargo", v: r => esc(r.cargo) },
        { rot: "Contato", v: r => `${esc(r.email)}<small>${esc(r.telefone)}</small>` },
        { rot: "Cidade", v: r => esc([r.cidade, r.uf].filter(Boolean).join(" / ")) },
        { rot: "Status", v: r => pill(r.status) }
      ]
    });
  }
  function secNewsletter() {
    tabela({
      tipos: ["newsletter"], chaveBusca: "newsBusca", vazio: "Nenhum inscrito ainda.",
      filtroExtra: `<select data-filtro="status" aria-label="Status"><option value="">Todos</option><option>ativo</option><option>cancelado</option></select>`,
      colunas: [
        { rot: "Inscrição", v: r => `<span class="nw">${dataBR(r.criado)}</span>` },
        { rot: "Nome", v: r => `<b>${esc(r.nome)}</b>` },
        { rot: "E-mail", v: r => esc(r.email) },
        { rot: "Página", v: r => esc(NOMES_PAG[r.pagina] || r.pagina) },
        { rot: "Status", v: r => pill(r.status) }
      ]
    });
  }
  function secTalentos() {
    const cargos = C.cargosTrabalheConosco || [];
    tabela({
      tipos: ["candidato"], chaveBusca: "talBusca", vazio: "Nenhum currículo recebido ainda.",
      filtroExtra: `<select data-filtro="cargo_pretendido" aria-label="Cargo"><option value="">Todos os cargos</option>${cargos.map(c => `<option>${esc(c)}</option>`).join("")}</select><select data-filtro="status" aria-label="Status"><option value="">Todos os status</option>${STATUS.candidato.map(s => `<option>${s}</option>`).join("")}</select>`,
      colunas: [
        { rot: "Recebido", v: r => `<span class="nw">${dataBR(r.criado)}</span>` },
        { rot: "Candidato", v: r => `<b>${esc(r.nome)}</b><small>${esc(r.email)}</small>` },
        { rot: "Cargo pretendido", v: r => esc(r.cargo_pretendido) },
        { rot: "Cidade", v: r => esc([r.cidade, r.uf].filter(Boolean).join(" / ")) },
        { rot: "Currículo", v: r => r.tem_arquivo ? `<span class="pill p-novo">${esc((r.arquivo_nome || "anexo").split(".").pop().toUpperCase())}</span>` : "—" },
        { rot: "Status", v: r => pill(r.status) }
      ]
    });
  }

  function gaveta(html) {
    fecharGaveta();
    const f = document.createElement("div");
    f.className = "gaveta-fundo";
    f.innerHTML = `<div class="gaveta" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(f);
    f.addEventListener("click", e => { if (e.target === f || e.target.closest("[data-fechar]")) fecharGaveta(); });
    const foco = f.querySelector("input, select, textarea, button"); if (foco) foco.focus();
    return f;
  }
  function fecharGaveta() { document.querySelectorAll(".gaveta-fundo").forEach(x => x.remove()); }
  document.addEventListener("keydown", e => { if (e.key === "Escape") fecharGaveta(); });

  function detalhe(id) {
    const r = st.dados.registros.find(x => x.id === id); if (!r) return;
    const tel = String(r.telefone || "").replace(/\D/g, "");
    const waMsg = r.tipo === "candidato" ? `Olá, ${(r.nome || "").split(" ")[0]}! Aqui é da LIPPMANN Treinamentos e Soluções, sobre o seu currículo para ${r.cargo_pretendido}.` : `Olá, ${(r.nome || "").split(" ")[0]}! Aqui é da LIPPMANN Treinamentos e Soluções. Recebemos o seu contato pelo site.`;
    const linhas = [["Tipo", TIPO_NOME[r.tipo] + (r.assunto ? " · " + r.assunto : "")], ["Recebido em", dataBR(r.criado)], ["Nome", r.nome || (r.tipo === "contato" ? "Anônimo" : "")], ["Empresa", r.empresa], ["Cargo", r.cargo], ["Cargo pretendido", r.cargo_pretendido], ["E-mail", r.email], ["Telefone", r.telefone], ["Cidade / UF", [r.cidade, r.uf].filter(Boolean).join(" / ")], ["Localização (IP)", [r.geo_cidade, r.geo_uf].filter(Boolean).join(" / ")], ["Como conheceu", r.origem], ["LinkedIn", r.linkedin], ["Mensagem", r.mensagem], ["Página", NOMES_PAG[r.pagina] || r.pagina]].filter(x => x[1]);
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${TIPO_NOME[r.tipo]} · nº ${r.id}</p><h2>${esc(r.nome || "Contato anônimo")}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="linha-acoes">
        ${tel ? `<a class="btn btn-whats" href="https://wa.me/${tel.length <= 11 ? "55" + tel : tel}?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener">${IC.whats} WhatsApp</a>` : ""}
        ${r.email ? `<a class="btn btn-sec" href="mailto:${esc(r.email)}">${IC.mail} E-mail</a>` : ""}
        ${r.tipo === "candidato" && r.tem_arquivo ? `<a class="btn btn-primario" ${DEMO ? `href="#" id="cv-demo"` : `href="/api/painel?acao=curriculo&id=${r.id}" target="_blank" rel="noopener"`}>Abrir currículo</a>` : ""}
        ${r.tipo !== "newsletter" ? `<button class="btn btn-sec" type="button" id="bt-agendar">${IC.cal} ${r.tipo === "candidato" ? "Agendar entrevista" : "Agendar reunião"}</button>` : ""}
      </div>
      <dl class="dados">${linhas.map(([k, v]) => `<dt>${k}</dt><dd>${k === "LinkedIn" ? `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v)}</dd>`).join("")}</dl>
      <div class="form-grid">
        <div class="campo"><label for="d-status">Status</label><select id="d-status">${STATUS[r.tipo].map(s => `<option${s === r.status ? " selected" : ""}>${s}</option>`).join("")}</select></div>
        <div class="campo full"><label for="d-notas">Anotações internas</label><textarea id="d-notas" placeholder="Histórico de atendimento, próximos passos…">${esc(r.notas || "")}</textarea></div>
      </div>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="d-salvar">Salvar</button><button class="btn btn-perigo" type="button" id="d-excluir">Excluir registro</button></div>
      <p class="aviso erro" id="d-confirma" hidden></p>`);
    g.querySelector("#d-salvar").onclick = async () => {
      const corpo = { id: r.id, status: $("d-status").value, notas: $("d-notas").value };
      const res = await api("registro_atualizar", { corpo });
      if (res.ok) { r.status = corpo.status; r.notas = corpo.notas; badges(); fecharGaveta(); rotear(); toast("Registro atualizado."); } else toast(res.mensagem);
    };
    const ex = g.querySelector("#d-excluir");
    if (ex) ex.onclick = async () => {
      const conf = $("d-confirma");
      if (conf.hidden) { conf.hidden = false; conf.innerHTML = "Clique em <b>Excluir registro</b> de novo para confirmar. Isto não pode ser desfeito (use para pedidos de exclusão pela LGPD)."; return; }
      const res = await api("registro_excluir", { corpo: { id: r.id } });
      if (res.ok) { st.dados.registros = st.dados.registros.filter(x => x.id !== r.id); fecharGaveta(); rotear(); toast("Registro excluído."); } else toast(res.mensagem);
    };
    const ag = g.querySelector("#bt-agendar");
    if (ag) ag.onclick = () => formAgenda({ tipo: r.tipo === "candidato" ? "entrevista" : "reuniao", titulo: r.tipo === "candidato" ? `Entrevista · ${r.nome} · ${r.cargo_pretendido}` : `Reunião · ${r.empresa || r.nome}`, participantes: r.email, registro_id: r.id, plataforma: "Google Meet" });
    const cvd = g.querySelector("#cv-demo"); if (cvd) cvd.onclick = e => { e.preventDefault(); toast("No modo demonstração os currículos não ficam armazenados. No servidor, o arquivo abre aqui."); };
  }

  /* ================= Agenda ================= */
  let mesAg = new Date(); mesAg.setDate(1);
  function secAgenda() {
    $("acoes-topo").innerHTML = `<button class="btn btn-sec" type="button" id="ag-ant">‹</button><button class="btn btn-sec" type="button" id="ag-hoje">Hoje</button><button class="btn btn-sec" type="button" id="ag-prox">›</button><button class="btn btn-primario" type="button" id="ag-novo">${IC.cal} Novo compromisso</button>`;
    $("ag-ant").onclick = () => { mesAg.setMonth(mesAg.getMonth() - 1); secAgenda(); };
    $("ag-prox").onclick = () => { mesAg.setMonth(mesAg.getMonth() + 1); secAgenda(); };
    $("ag-hoje").onclick = () => { mesAg = new Date(); mesAg.setDate(1); secAgenda(); };
    $("ag-novo").onclick = () => formAgenda({});
    const ag = st.dados.agenda || [];
    const ini = new Date(mesAg); ini.setDate(1 - ini.getDay());
    const hoje = new Date().toDateString();
    let cel = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(ini); d.setDate(ini.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      const evs = ag.filter(a => String(a.inicio).slice(0, 10) === k);
      cel += `<div class="dia${d.getMonth() !== mesAg.getMonth() ? " fora" : ""}${d.toDateString() === hoje ? " hoje" : ""}" data-dia="${k}"><span class="n">${d.getDate()}</span>${evs.map(a => `<button type="button" class="ev ${a.tipo} ${a.status === "cancelado" ? "cancelado" : ""}" data-ag="${a.id}">${String(a.inicio).slice(11, 16)} ${esc(a.titulo)}</button>`).join("")}</div>`;
    }
    const prox = ag.filter(a => new Date(String(a.inicio).replace(" ", "T")) >= new Date(new Date().toDateString())).slice(0, 8);
    $("conteudo").innerHTML = `<div class="grade">
      <section class="c8" style="display:grid;gap:10px"><h2 style="font:400 1.8rem/1 var(--f-titulo);color:var(--azul-lippmann)">${mesAg.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
        <div class="cal">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => `<div class="dsem">${d}</div>`).join("")}${cel}</div></section>
      ${card("c4", "Próximos compromissos", "Reuniões e entrevistas agendadas", prox.length ? `<div class="lista-ag">${prox.map(a => { const d = new Date(String(a.inicio).replace(" ", "T")); return `<div class="item-ag" data-ag="${a.id}"><div class="data">${d.getDate()}<small>${d.toLocaleDateString("pt-BR", { month: "short" })}</small></div><div><b>${esc(a.titulo)}</b><br><span>${String(a.inicio).slice(11, 16)} · ${esc(a.plataforma || "")}${a.convite_enviado ? " · convite enviado" : ""}</span></div>${pill(a.tipo === "entrevista" ? "entrevista" : "reunião")}</div>`; }).join("")}</div>` : `<p class="vazio">Nenhum compromisso futuro.</p>`)}
    </div>`;
    $("conteudo").onclick = e => {
      const ev = e.target.closest("[data-ag]");
      if (ev) { e.stopPropagation(); formAgenda(ag.find(a => String(a.id) === ev.dataset.ag) || {}); return; }
      const dia = e.target.closest("[data-dia]");
      if (dia) formAgenda({ inicio: dia.dataset.dia + " 09:00", fim: dia.dataset.dia + " 10:00" });
    };
  }

  function formAgenda(a) {
    const local = v => v ? String(v).replace(" ", "T").slice(0, 16) : "";
    const base = new Date(); base.setDate(base.getDate() + 1); base.setHours(9, 0, 0, 0);
    const pad = n => String(n).padStart(2, "0");
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const ini = local(a.inicio) || iso(base), fim = local(a.fim) || iso(new Date(base.getTime() + 3600000));
    const contas = st.dados.contas_agenda || ["atendimento@lippmannts.com", "comercial@lippmannts.com"];
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${a.id ? "Editar compromisso" : "Novo compromisso"}</p><h2>${a.id ? esc(a.titulo) : "Agendar"}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="a-titulo">Título</label><input id="a-titulo" value="${esc(a.titulo || "")}" placeholder="Ex.: Reunião de proposta · Metalúrgica Alfa"></div>
        <div class="campo"><label for="a-tipo">Tipo</label><select id="a-tipo">${[["reuniao", "Reunião"], ["entrevista", "Entrevista"], ["treinamento", "Treinamento"], ["outro", "Outro"]].map(([v, r]) => `<option value="${v}"${a.tipo === v ? " selected" : ""}>${r}</option>`).join("")}</select></div>
        <div class="campo"><label for="a-plat">Plataforma</label><select id="a-plat">${["Google Meet", "Microsoft Teams", "Presencial", "Telefone / WhatsApp"].map(p => `<option${a.plataforma === p ? " selected" : ""}>${p}</option>`).join("")}</select></div>
        <div class="campo"><label for="a-ini">Início</label><input id="a-ini" type="datetime-local" value="${ini}"></div>
        <div class="campo"><label for="a-fim">Término</label><input id="a-fim" type="datetime-local" value="${fim}"></div>
        <div class="campo full"><label for="a-link">Link da reunião</label><input id="a-link" value="${esc(a.link || "")}" placeholder="https://meet.google.com/… ou link do Teams"><small>Use os botões abaixo para criar a sala no Meet ou no Teams e cole o link aqui.</small></div>
        <div class="campo full"><label for="a-part">Participantes (e-mails)</label><input id="a-part" value="${esc(a.participantes || "")}" placeholder="cliente@empresa.com.br, colega@lippmannts.com"></div>
        <div class="campo full"><label for="a-org">Enviar convite como</label><select id="a-org">${contas.map(c => `<option${a.organizador === c ? " selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="campo full"><label for="a-desc">Pauta / observações</label><textarea id="a-desc">${esc(a.descricao || "")}</textarea></div>
        <div class="campo"><label for="a-status">Situação</label><select id="a-status">${["agendado", "realizado", "cancelado"].map(s => `<option${a.status === s ? " selected" : ""}>${s}</option>`).join("")}</select></div>
      </div>
      <div class="linha-acoes">
        <a class="btn btn-sec" href="https://meet.google.com/new" target="_blank" rel="noopener">Criar sala no Meet</a>
        <a class="btn btn-sec" id="lk-teams" href="#" target="_blank" rel="noopener">Criar reunião no Teams</a>
        <a class="btn btn-sec" id="lk-gcal" href="#" target="_blank" rel="noopener">Google Agenda</a>
        <a class="btn btn-sec" id="lk-outlook" href="#" target="_blank" rel="noopener">Outlook</a>
      </div>
      <p class="aviso info" id="a-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="a-salvar">Salvar</button><button class="btn btn-whats" type="button" id="a-convite">${IC.mail} Salvar e enviar convite</button>${a.id ? `<button class="btn btn-perigo" type="button" id="a-excluir">Excluir</button>` : ""}</div>`);
    const v = () => ({ id: a.id, registro_id: a.registro_id, titulo: $("a-titulo").value.trim(), tipo: $("a-tipo").value, plataforma: $("a-plat").value, inicio: $("a-ini").value, fim: $("a-fim").value, link: $("a-link").value.trim(), participantes: $("a-part").value, organizador: $("a-org").value, descricao: $("a-desc").value, status: $("a-status").value });
    const utc = x => new Date(x).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const atualizarLinks = () => {
      const d = v(); if (!d.inicio || !d.fim) return;
      const corpo = [d.descricao, d.link ? "Link: " + d.link : ""].filter(Boolean).join("\n\n");
      $("lk-teams").href = `https://teams.microsoft.com/l/meeting/new?subject=${encodeURIComponent(d.titulo)}&startTime=${encodeURIComponent(new Date(d.inicio).toISOString())}&endTime=${encodeURIComponent(new Date(d.fim).toISOString())}&content=${encodeURIComponent(d.descricao)}&attendees=${encodeURIComponent(d.participantes.replace(/\s/g, ""))}`;
      $("lk-gcal").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(d.titulo)}&dates=${utc(d.inicio)}/${utc(d.fim)}&details=${encodeURIComponent(corpo)}&add=${encodeURIComponent(d.participantes.replace(/\s/g, ""))}&location=${encodeURIComponent(d.link || d.plataforma)}`;
      $("lk-outlook").href = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(d.titulo)}&startdt=${encodeURIComponent(new Date(d.inicio).toISOString())}&enddt=${encodeURIComponent(new Date(d.fim).toISOString())}&body=${encodeURIComponent(corpo)}&to=${encodeURIComponent(d.participantes.replace(/\s/g, ""))}&location=${encodeURIComponent(d.link || d.plataforma)}`;
    };
    g.addEventListener("input", atualizarLinks); atualizarLinks();
    const salvar = async () => {
      const d = v();
      if (!d.titulo || !d.inicio || !d.fim || new Date(d.fim) <= new Date(d.inicio)) { const m = $("a-msg"); m.hidden = false; m.className = "aviso erro"; m.textContent = "Informe título, início e término (o término deve ser depois do início)."; return null; }
      const r = await api("agenda_salvar", { corpo: d });
      if (!r.ok) { toast(r.mensagem); return null; }
      return r.id;
    };
    $("a-salvar").onclick = async () => { if (await salvar()) { await carregar(); fecharGaveta(); location.hash === "#agenda" ? rotear() : (location.hash = "agenda"); toast("Compromisso salvo."); } };
    $("a-convite").onclick = async () => {
      const id = await salvar(); if (!id) return;
      const r = await api("agenda_convite", { corpo: { id } });
      await carregar(); fecharGaveta(); location.hash === "#agenda" ? rotear() : (location.hash = "agenda");
      toast(r.mensagem || (r.ok ? "Convite enviado." : "Falha ao enviar."));
    };
    const ex = g.querySelector("#a-excluir");
    if (ex) ex.onclick = async () => { const r = await api("agenda_excluir", { corpo: { id: a.id } }); if (r.ok) { await carregar(); fecharGaveta(); rotear(); toast("Compromisso excluído."); } };
  }

  /* ================= Site e conteúdo (CMS no-code) ================= */
  const ehUrl = v => /^(https?:\/\/|\/)/i.test(String(v || ""));
  const urlYt = id => id ? `https://youtu.be/${id}` : "";
  const dataBRc = d => d ? new Date(String(d).replace(" ", "T")).toLocaleDateString("pt-BR") : "—";

  /* envia arquivo ao Supabase Storage (bucket público) e devolve o endereço público */
  async function enviarPublico(arquivo, pasta) {
    if (!arquivo) return "";
    if (DEMO) {
      if (arquivo.size > 1.5 * 1024 * 1024) throw new Error("Na demonstração, use arquivos de até 1,5 MB (no servidor o limite é 25 MB).");
      return await new Promise((ok, erro) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => erro(new Error("Não foi possível ler o arquivo.")); fr.readAsDataURL(arquivo); });
    }
    const up = await api("arquivo_upload", { corpo: { nome: arquivo.name || "arquivo.webp", tamanho: arquivo.size, pasta } });
    if (!up.ok) throw new Error(up.mensagem || "Não foi possível preparar o envio.");
    const fd = new FormData(); fd.append("cacheControl", "31536000"); fd.append("", arquivo, arquivo.name || "arquivo.webp");
    const h = { "x-upsert": "false" }; if (up.apikey) { h.apikey = up.apikey; h.Authorization = "Bearer " + up.apikey; }
    const envio = await fetch(up.url, { method: "PUT", body: fd, headers: h });
    if (!envio.ok) throw new Error("O envio do arquivo falhou. Tente novamente.");
    return up.publico;
  }
  /* campo de imagem com pré-visualização e botão de envio */
  function campoImagem(id, rotulo, valor, dica) {
    return `<div class="campo full"><label>${rotulo}</label>
      <div class="img-campo"><span class="img-prev" id="${id}-prev">${valor ? `<img src="${esc(valor)}" alt="">` : "Sem imagem"}</span>
      <div style="display:grid;gap:8px;min-width:0"><input id="${id}" value="${esc(valor || "")}" placeholder="Endereço da imagem (preenchido ao enviar)">
      <div class="linha-acoes" style="margin:0"><label class="btn btn-sec" style="cursor:pointer">Enviar imagem<input type="file" accept="image/jpeg,image/png,image/webp" data-up="${id}" hidden></label><button class="btn btn-sec" type="button" data-limpar-img="${id}">Remover</button></div>
      ${dica ? `<small>${dica}</small>` : ""}</div></div></div>`;
  }
  function ligarImagens(g, pasta) {
    g.querySelectorAll("[data-up]").forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      const alvo = g.querySelector("#" + inp.dataset.up), prev = g.querySelector("#" + inp.dataset.up + "-prev");
      prev.textContent = "Enviando…";
      try { const arq = await reduzirImagem(f); alvo.value = await enviarPublico(arq, pasta); prev.innerHTML = `<img src="${esc(alvo.value)}" alt="">`; }
      catch (e) { prev.textContent = "Falhou"; toast(e.message); }
      inp.value = "";
    });
    g.querySelectorAll("[data-limpar-img]").forEach(b => b.onclick = () => { g.querySelector("#" + b.dataset.limparImg).value = ""; g.querySelector("#" + b.dataset.limparImg + "-prev").textContent = "Sem imagem"; });
  }
  /* reduz fotos grandes para no máximo 1600 px (WEBP), deixando o site leve */
  async function reduzirImagem(f, max = 1600) {
    try {
      const bmp = await createImageBitmap(f);
      if (bmp.width <= max && f.size < 600 * 1024) return f;
      const k = Math.min(1, max / bmp.width), cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise(ok => cv.toBlob(ok, "image/webp", 0.84));
      return blob ? new File([blob], f.name.replace(/\.[a-z0-9]+$/i, "") + ".webp", { type: "image/webp" }) : f;
    } catch (e) { return f; }
  }
  /* PDF: conta as páginas e gera a capa (1ª página) no próprio navegador */
  let pdfjsCarregando = null;
  function carregarPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return pdfjsCarregando || (pdfjsCarregando = new Promise((ok, erro) => {
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      sc.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; ok(pdfjsLib); };
      sc.onerror = () => erro(new Error("Leitor de PDF indisponível."));
      document.head.appendChild(sc);
    }));
  }
  async function capaDoPdf(arquivo) {
    const lib = await carregarPdfjs();
    const pdf = await lib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
    const pg = await pdf.getPage(1), vp0 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: 840 / vp0.width }), cv = document.createElement("canvas");
    cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    const blob = await new Promise(ok => cv.toBlob(ok, "image/webp", 0.82));
    return { paginas: pdf.numPages, capa: new File([blob], arquivo.name.replace(/\.pdf$/i, "") + "-capa.webp", { type: "image/webp" }) };
  }

  /* editor de texto visual (sem código) */
  function editorRico(id, html) {
    const bt = (cmd, val, rot, tit) => `<button type="button" data-cmd="${cmd}"${val ? ` data-val="${val}"` : ""} title="${tit}" aria-label="${tit}">${rot}</button>`;
    return `<div class="rico" id="${id}-box">
      <div class="rico-barra" role="toolbar" aria-label="Formatação">
        ${bt("formatBlock", "H2", "T1", "Título de seção")}${bt("formatBlock", "H3", "T2", "Subtítulo")}${bt("formatBlock", "P", "¶", "Parágrafo normal")}
        <span class="sep"></span>${bt("bold", "", "<b>N</b>", "Negrito")}${bt("italic", "", "<i>I</i>", "Itálico")}${bt("underline", "", "<u>S</u>", "Sublinhado")}
        <span class="sep"></span>${bt("insertUnorderedList", "", "• Lista", "Lista com marcadores")}${bt("insertOrderedList", "", "1. Lista", "Lista numerada")}${bt("formatBlock", "BLOCKQUOTE", "❝ Destaque", "Citação em destaque")}
        <span class="sep"></span>${bt("link", "", "Link", "Inserir link")}${bt("imagem", "", "Imagem", "Inserir imagem")}${bt("youtube", "", "YouTube", "Inserir vídeo do YouTube")}${bt("insertHorizontalRule", "", "―", "Linha divisória")}
        <span class="sep"></span>${bt("removeFormat", "", "Limpar", "Remover formatação")}${bt("codigo", "", "&lt;/&gt;", "Ver em HTML (avançado)")}
      </div>
      <div class="rico-area artigo-corpo" id="${id}" contenteditable="true" spellcheck="true">${html || "<p></p>"}</div>
      <textarea class="rico-html" id="${id}-html" hidden spellcheck="false"></textarea>
      <input type="file" accept="image/jpeg,image/png,image/webp" id="${id}-img" hidden>
    </div>`;
  }
  function ligarEditor(g, id, pasta) {
    const area = g.querySelector("#" + id), html = g.querySelector("#" + id + "-html"), arq = g.querySelector("#" + id + "-img");
    let faixa = null;
    const guardar = () => { const s = getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) faixa = s.getRangeAt(0); };
    const restaurar = () => { area.focus(); if (faixa) { const s = getSelection(); s.removeAllRanges(); s.addRange(faixa); } };
    area.addEventListener("keyup", guardar); area.addEventListener("mouseup", guardar); area.addEventListener("blur", guardar);
    area.addEventListener("paste", e => {   // cola apenas o texto, sem a formatação do Word
      const t = (e.clipboardData || window.clipboardData).getData("text/plain"); if (!t) return;
      e.preventDefault();
      document.execCommand("insertHTML", false, t.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join(""));
    });
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}
    g.querySelector("#" + id + "-box .rico-barra").addEventListener("mousedown", e => { if (e.target.closest("[data-cmd]")) e.preventDefault(); });
    g.querySelector("#" + id + "-box .rico-barra").addEventListener("click", async e => {
      const b = e.target.closest("[data-cmd]"); if (!b) return;
      const cmd = b.dataset.cmd;
      if (cmd === "codigo") {
        const ver = html.hidden;
        if (ver) { html.value = area.innerHTML; } else { area.innerHTML = html.value; }
        html.hidden = !ver; area.hidden = ver; b.setAttribute("aria-pressed", ver);
        return;
      }
      if (!html.hidden) return toast("Volte ao modo visual para usar os botões.");
      restaurar();
      if (cmd === "link") { const u = prompt("Endereço do link (https://…):", "https://"); if (u && /^https?:\/\/|^\/|^mailto:/i.test(u)) document.execCommand("createLink", false, u); }
      else if (cmd === "imagem") { arq.click(); }
      else if (cmd === "youtube") {
        const u = prompt("Cole o link do vídeo do YouTube:"); const m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || String(u || "").match(/^([\w-]{11})$/);
        if (m) document.execCommand("insertHTML", false, `<iframe src="https://www.youtube.com/embed/${m[1]}" title="Vídeo" loading="lazy" allowfullscreen></iframe><p></p>`);
        else if (u) toast("Link do YouTube não reconhecido.");
      }
      else if (cmd === "formatBlock") document.execCommand("formatBlock", false, b.dataset.val);
      else document.execCommand(cmd, false, null);
      guardar();
    });
    arq.onchange = async () => {
      const f = arq.files[0]; if (!f) return;
      try {
        toast("Enviando imagem…");
        const url = await enviarPublico(await reduzirImagem(f, 1400), pasta);
        restaurar(); document.execCommand("insertHTML", false, `<img src="${esc(url)}" alt="" loading="lazy"><p></p>`);
      } catch (e) { toast(e.message); }
      arq.value = "";
    };
    return () => (html.hidden ? area.innerHTML : html.value).replace(/(\s*<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>)+\s*$/i, "").trim();
  }
  const caixaMarcar = (id, rot, marcado) => `<label class="full" style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="${id}" ${marcado ? "checked" : ""}> ${rot}</label>`;

  /* ---------- HUB ---------- */
  const TIPOS_HUB = { noticia: "Notícia", artigo: "Artigo técnico", transparencia: "Transparência / prestação de contas" };
  async function secHub() {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="hub-novo">+ Nova publicação</button>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("hub_listar"); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const itens = r.itens || [];
    $("conteudo").innerHTML = card("", "Publicações do HUB", "Notícias, artigos técnicos e prestações de contas exibidos em lippmannts.com/hub.html. Clique em uma linha para editar.",
      itens.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Publicação</th><th>Tipo</th><th>Situação</th><th>Publicada em</th></tr></thead><tbody>
        ${itens.map(p => `<tr data-hub="${p.id}"><td><b>${esc(p.titulo)}</b><small>${esc((p.tags || []).join(" · "))}</small></td><td>${esc(TIPOS_HUB[p.tipo] || p.tipo)}</td><td>${p.publicado ? `<span class="pill p-ok">Publicada</span>` : `<span class="pill p-alerta">Rascunho</span>`}</td><td>${dataBRc(p.publicado_em)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="vazio">Nenhuma publicação ainda. Clique em <b>+ Nova publicação</b>.</p>`);
    $("hub-novo").onclick = () => editarHub({});
    document.querySelectorAll("[data-hub]").forEach(tr => tr.onclick = () => editarHub(itens.find(p => String(p.id) === tr.dataset.hub)));
  }
  function editarHub(p) {
    const novo = !p.id;
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Nova publicação" : "Editar publicação"}</p><h2>${novo ? "HUB" : esc(p.titulo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="h-titulo">Título</label><input id="h-titulo" value="${esc(p.titulo || "")}" maxlength="200"></div>
        <div class="campo"><label for="h-tipo">Tipo</label><select id="h-tipo">${Object.entries(TIPOS_HUB).map(([k, v]) => `<option value="${k}"${p.tipo === k ? " selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo"><label for="h-autor">Autor</label><input id="h-autor" value="${esc(p.autor || st.usuario.nome || "")}"></div>
        <div class="campo full"><label for="h-resumo">Resumo (aparece no cartão)</label><textarea id="h-resumo" style="min-height:70px" maxlength="400">${esc(p.resumo || "")}</textarea></div>
        ${campoImagem("h-capa", "Imagem de capa", p.capa, "Formato horizontal (16:9). Fotos grandes são reduzidas automaticamente.")}
        <div class="campo"><label for="h-yt">Vídeo do YouTube (opcional)</label><input id="h-yt" value="${esc(urlYt(p.youtube))}" placeholder="https://youtu.be/…"><small>Se informado, aparece no topo do artigo.</small></div>
        <div class="campo"><label for="h-tags">Tags (separadas por vírgula)</label><input id="h-tags" value="${esc((p.tags || []).join(", "))}" placeholder="NR 35, Trabalho em altura"></div>
        <div class="campo full"><label>Texto</label>${editorRico("h-corpo", p.corpo_html)}</div>
        ${caixaMarcar("h-pub", "Publicada (visível no site)", p.publicado)}
      </div>
      <p class="aviso erro" id="h-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="h-salvar">Salvar</button>${!novo && p.publicado ? `<a class="btn btn-sec" href="/hub.html#${esc(p.slug)}" target="_blank" rel="noopener">Ver no site</a>` : ""}${novo ? "" : `<button class="btn btn-perigo" type="button" id="h-excluir">Excluir</button>`}</div>`);
    g.querySelector(".gaveta").classList.add("gaveta-larga");
    ligarImagens(g, "hub");
    const corpo = ligarEditor(g, "h-corpo", "hub");
    g.querySelector("#h-salvar").onclick = async e => {
      const d = { id: p.id, titulo: $("h-titulo").value.trim(), tipo: $("h-tipo").value, autor: $("h-autor").value, resumo: $("h-resumo").value, capa: $("h-capa").value.trim(),
        youtube: $("h-yt").value.trim(), tags: $("h-tags").value, corpo_html: corpo(), publicado: $("h-pub").checked };
      if (!d.titulo) return msg("h-msg", "erro", "Informe o título.");
      e.target.disabled = true;
      const res = await api("hub_salvar", { corpo: d }); e.target.disabled = false;
      if (res.ok) { fecharGaveta(); toast(d.publicado ? "Publicação salva e visível no site." : "Rascunho salvo."); secHub(); } else msg("h-msg", "erro", res.mensagem);
    };
    confirmarExclusao(g, "#h-excluir", async () => { const res = await api("hub_excluir", { corpo: { id: p.id } }); if (res.ok) { fecharGaveta(); toast("Publicação excluída."); secHub(); } else toast(res.mensagem); });
  }
  function confirmarExclusao(g, sel, acao) {
    const ex = g.querySelector(sel); if (!ex) return;
    ex.onclick = () => { if (!ex.dataset.conf) { ex.dataset.conf = 1; ex.textContent = "Clique de novo para confirmar"; return; } acao(); };
  }

  /* ---------- Catálogo de treinamentos ---------- */
  const CATS = { normativo: "Normativo (NR)", desenvolvimento: "Desenvolvimento humano", emergencia: "Emergência" };
  async function secCatalogo() {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="cat-novo">+ Novo treinamento</button>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("catalogo_listar"); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const lista = r.treinamentos || [];
    $("conteudo").innerHTML = card("", "Catálogo de treinamentos", "O que estiver ativo aparece na aba Treinamentos do site, com cartão, carga horária, “Saiba mais” e ficha completa.",
      `<div class="tabela-box"><table class="t"><thead><tr><th>Treinamento</th><th>Categoria</th><th>Carga horária</th><th>Ordem</th><th>Situação</th></tr></thead><tbody>
      ${lista.map(t => `<tr data-cat="${esc(t.id)}"><td><b>${esc(t.titulo)}</b><small>${esc([t.nr, t.norma].filter(Boolean).join(" · "))}</small></td><td>${esc(CATS[t.categoria] || t.categoria)}</td><td>${esc(t.carga_horaria || "—")}</td><td>${esc(t.ordem ?? "")}</td><td>${t.ativo === false ? `<span class="pill p-alerta">Oculto</span>` : `<span class="pill p-ok">No site</span>`}</td></tr>`).join("")}
      </tbody></table></div>`);
    $("cat-novo").onclick = () => editarCatalogo({});
    document.querySelectorAll("[data-cat]").forEach(tr => tr.onclick = () => editarCatalogo(lista.find(t => t.id === tr.dataset.cat)));
  }
  function editarCatalogo(t) {
    const novo = !t.id, ln = a => esc((a || []).join("\n"));
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Novo treinamento" : "Editar treinamento"}</p><h2>${novo ? "Treinamento" : esc(t.titulo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="t-titulo">Título</label><input id="t-titulo" value="${esc(t.titulo || "")}"></div>
        <div class="campo"><label for="t-nr">Sigla (ex.: NR 35)</label><input id="t-nr" value="${esc(t.nr || "")}"></div>
        <div class="campo"><label for="t-cat">Categoria</label><select id="t-cat">${Object.entries(CATS).map(([k, v]) => `<option value="${k}"${t.categoria === k ? " selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo full"><label for="t-norma">Norma de referência</label><input id="t-norma" value="${esc(t.norma || "")}" placeholder="Ex.: NR 35 · Trabalho em Altura"></div>
        <div class="campo"><label for="t-ch">Carga horária</label><input id="t-ch" value="${esc(t.carga_horaria || "")}" placeholder="Ex.: 8 horas"></div>
        <div class="campo"><label for="t-mod">Modalidade</label><input id="t-mod" value="${esc(t.modalidade || "")}" placeholder="Presencial · In company"></div>
        <div class="campo full"><label for="t-tags">Tags (separadas por vírgula)</label><input id="t-tags" value="${esc((t.tags || []).join(", "))}" placeholder="Altura, Resgate"></div>
        <div class="campo full"><label for="t-resumo">Resumo do cartão</label><textarea id="t-resumo" style="min-height:70px">${esc(t.resumo || "")}</textarea></div>
        ${campoImagem("t-img", "Foto do cartão", t.imagem, "Formato horizontal. Fotos grandes são reduzidas automaticamente.")}
        <div class="campo full"><label for="t-yt">Vídeo do YouTube na ficha (opcional)</label><input id="t-yt" value="${esc(urlYt(t.youtube))}" placeholder="https://youtu.be/…"></div>
        <div class="campo full"><label for="t-apr">O que você vai aprender (um item por linha)</label><textarea id="t-apr" style="min-height:140px">${ln(t.aprender)}</textarea></div>
        <div class="campo full"><label for="t-pub">Público-alvo (um por linha)</label><textarea id="t-pub" style="min-height:90px">${ln(t.publico)}</textarea></div>
        <div class="campo full"><label for="t-ben">Benefícios (um por linha)</label><textarea id="t-ben" style="min-height:90px">${ln(t.beneficios)}</textarea></div>
        <div class="campo full"><label for="t-pre">Pré-requisitos</label><textarea id="t-pre" style="min-height:60px">${esc(t.prerequisito || "")}</textarea></div>
        <div class="campo full"><label for="t-porque">Por que fazer com a LIPPMANN</label><textarea id="t-porque" style="min-height:90px">${esc(t.porque || "")}</textarea></div>
        <div class="campo full"><label for="t-at">Observação de atestado / certificado</label><input id="t-at" value="${esc(t.atestado || "")}"></div>
        <div class="campo full"><label>Ficha técnica em PDF (opcional)</label><div style="display:grid;gap:8px"><input id="t-ficha" value="${esc(t.ficha_pdf || "")}" placeholder="Endereço do PDF"><label class="btn btn-sec" style="cursor:pointer;justify-self:start">Enviar PDF<input type="file" accept="application/pdf" id="t-ficha-arq" hidden></label></div></div>
        <div class="campo"><label for="t-ordem">Ordem de exibição</label><input id="t-ordem" type="number" value="${esc(t.ordem ?? 100)}"><small>Números menores aparecem primeiro.</small></div>
        ${caixaMarcar("t-ativo", "Exibir no site", t.ativo !== false)}
      </div>
      <p class="aviso erro" id="t-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="t-salvar">Salvar</button>${novo ? "" : `<a class="btn btn-sec" href="/treinamentos.html#${esc(t.id)}" target="_blank" rel="noopener">Ver no site</a><button class="btn btn-perigo" type="button" id="t-excluir">Excluir</button>`}</div>`);
    ligarImagens(g, "catalogo");
    g.querySelector("#t-ficha-arq").onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { toast("Enviando PDF…"); $("t-ficha").value = await enviarPublico(f, "catalogo"); toast("PDF enviado."); } catch (e) { toast(e.message); } };
    g.querySelector("#t-salvar").onclick = async e => {
      const d = { id: t.id, titulo: $("t-titulo").value.trim(), nr: $("t-nr").value.trim(), categoria: $("t-cat").value, norma: $("t-norma").value, carga_horaria: $("t-ch").value, modalidade: $("t-mod").value,
        tags: $("t-tags").value, resumo: $("t-resumo").value, imagem: $("t-img").value.trim(), youtube: $("t-yt").value.trim(), aprender: $("t-apr").value, publico: $("t-pub").value, beneficios: $("t-ben").value,
        prerequisito: $("t-pre").value, porque: $("t-porque").value, atestado: $("t-at").value, ficha_pdf: $("t-ficha").value.trim(), ordem: $("t-ordem").value, ativo: $("t-ativo").checked ? 1 : 0 };
      if (!d.titulo) return msg("t-msg", "erro", "Informe o título.");
      e.target.disabled = true; const res = await api("catalogo_salvar", { corpo: d }); e.target.disabled = false;
      if (res.ok) { fecharGaveta(); toast("Treinamento salvo. O site é atualizado em até 1 minuto."); secCatalogo(); } else msg("t-msg", "erro", res.mensagem);
    };
    confirmarExclusao(g, "#t-excluir", async () => { const res = await api("catalogo_excluir", { corpo: { id: t.id } }); if (res.ok) { fecharGaveta(); toast("Treinamento excluído."); secCatalogo(); } else toast(res.mensagem); });
  }

  /* ---------- Soluções ---------- */
  async function secSolucoes() {
    $("acoes-topo").innerHTML = `<button class="btn btn-sec" type="button" id="sol-grupos">Grupos e filtros</button><button class="btn btn-primario" type="button" id="sol-novo">+ Nova solução</button>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("solucoes_listar"); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const lista = r.solucoes || [], grupos = r.grupos || {};
    const cont = k => lista.filter(s => s.grupo === k && s.ativo !== false).length;
    $("conteudo").innerHTML = card("", "Catálogo de soluções", "O que estiver ativo aparece na aba Soluções do site, numerado na ordem abaixo, com o botão “Solicitar proposta” pelo WhatsApp já preenchido com o nome da solução.",
      `<div class="sol-grupos-resumo">${Object.entries(grupos).map(([k, v]) => `<span class="pill">${esc(v)} · ${cont(k)}</span>`).join("")}</div>
      <div class="tabela-box"><table class="t"><thead><tr><th>#</th><th>Solução</th><th>Grupo</th><th>Ordem</th><th>Situação</th></tr></thead><tbody>
      ${lista.map((s, i) => `<tr data-sol="${esc(s.id)}"><td>${String(i + 1).padStart(2, "0")}</td><td><b>${esc(s.titulo)}</b><small>${esc(String(s.texto || "").slice(0, 120))}${String(s.texto || "").length > 120 ? "…" : ""}</small></td><td>${esc(grupos[s.grupo] || s.grupo)}</td><td>${esc(s.ordem ?? "")}</td><td>${s.ativo === false ? `<span class="pill p-alerta">Oculta</span>` : `<span class="pill p-ok">No site</span>`}</td></tr>`).join("") || `<tr><td colspan="5" class="vazio">Nenhuma solução cadastrada.</td></tr>`}
      </tbody></table></div>`);
    $("sol-novo").onclick = () => editarSolucao({}, grupos, lista);
    $("sol-grupos").onclick = () => editarGruposSol(grupos, lista);
    document.querySelectorAll("[data-sol]").forEach(tr => tr.onclick = () => editarSolucao(lista.find(s => s.id === tr.dataset.sol), grupos, lista));
  }
  function editarSolucao(s, grupos, lista) {
    const novo = !s.id, maxOrdem = Math.max(0, ...lista.map(x => +x.ordem || 0));
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Nova solução" : "Editar solução"}</p><h2>${novo ? "Solução" : esc(s.titulo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="s-titulo">Título</label><input id="s-titulo" value="${esc(s.titulo || "")}" placeholder="Ex.: Laudo de Insalubridade e Periculosidade"></div>
        <div class="campo"><label for="s-grupo">Grupo (filtro da página)</label><select id="s-grupo">${Object.entries(grupos).map(([k, v]) => `<option value="${esc(k)}"${s.grupo === k ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
        <div class="campo"><label for="s-ordem">Ordem de exibição</label><input id="s-ordem" type="number" value="${esc(s.ordem ?? maxOrdem + 10)}"><small>Números menores aparecem primeiro e definem a numeração 01, 02, 03…</small></div>
        <div class="campo full"><label for="s-texto">Descrição do cartão</label><textarea id="s-texto" style="min-height:140px" maxlength="2000">${esc(s.texto || "")}</textarea><small><span id="s-cont">0</span> caracteres · recomendado até 320 para os cartões ficarem alinhados.</small></div>
        ${caixaMarcar("s-ativo", "Exibir no site", s.ativo !== false)}
      </div>
      <div class="sol-previa"><p class="desc">Prévia do cartão</p><article class="sol-card-previa"><span class="num" id="s-pv-num">00</span><h3 id="s-pv-t"></h3><p id="s-pv-x"></p><span class="sol-cta-pv">Solicitar proposta →</span></article></div>
      <p class="aviso erro" id="s-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="s-salvar">Salvar</button>${novo ? "" : `<a class="btn btn-sec" href="/solucoes.html#${esc(s.id)}" target="_blank" rel="noopener">Ver no site</a><button class="btn btn-perigo" type="button" id="s-excluir">Excluir</button>`}</div>`);
    const pv = () => {
      $("s-pv-t").textContent = $("s-titulo").value || "Título da solução"; $("s-pv-x").textContent = $("s-texto").value || "Descrição da solução."; $("s-cont").textContent = $("s-texto").value.length;
      const ord = +$("s-ordem").value || 0, pos = lista.filter(x => x.id !== s.id && x.ativo !== false && (+x.ordem || 0) <= ord).length + 1; $("s-pv-num").textContent = String(pos).padStart(2, "0");
    };
    ["s-titulo", "s-texto", "s-ordem"].forEach(id => g.querySelector("#" + id).addEventListener("input", pv)); pv();
    g.querySelector("#s-salvar").onclick = async e => {
      const d = { id: s.id, titulo: $("s-titulo").value.trim(), grupo: $("s-grupo").value, texto: $("s-texto").value.trim(), ordem: $("s-ordem").value, ativo: $("s-ativo").checked ? 1 : 0 };
      if (!d.titulo) return msg("s-msg", "erro", "Informe o título."); if (!d.texto) return msg("s-msg", "erro", "Escreva a descrição.");
      e.target.disabled = true; const res = await api("solucoes_salvar", { corpo: d }); e.target.disabled = false;
      if (res.ok) { fecharGaveta(); toast("Solução salva. O site é atualizado em até 1 minuto."); secSolucoes(); } else msg("s-msg", "erro", res.mensagem);
    };
    confirmarExclusao(g, "#s-excluir", async () => { const res = await api("solucoes_excluir", { corpo: { id: s.id } }); if (res.ok) { fecharGaveta(); toast("Solução excluída."); secSolucoes(); } else toast(res.mensagem); });
  }
  function editarGruposSol(grupos, lista) {
    let itens = Object.entries(grupos).map(([id, nome]) => ({ id, nome }));
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">Soluções</p><h2>Grupos e filtros</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <p class="desc">Os grupos viram os botões de filtro da página Soluções (o botão “Todas” é automático). Renomeie, inclua ou remova; um grupo só pode ser removido quando não tiver soluções.</p>
      <div id="gr-lista" class="gr-lista"></div>
      <button class="btn btn-sec" type="button" id="gr-add">+ Incluir grupo</button>
      <p class="aviso erro" id="gr-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="gr-salvar">Salvar grupos</button></div>`);
    const desenhar = () => {
      g.querySelector("#gr-lista").innerHTML = itens.map((x, i) => { const n = lista.filter(s => s.grupo === x.id).length; return `<div class="gr-linha"><input data-gr="${i}" value="${esc(x.nome)}" placeholder="Nome do grupo" aria-label="Nome do grupo ${i + 1}"><small>${n} solução(ões)</small><button class="btn btn-sec" type="button" data-gr-up="${i}" ${i ? "" : "disabled"} aria-label="Subir">↑</button><button class="btn btn-perigo" type="button" data-gr-del="${i}" ${n ? "disabled title=\"Mova as soluções para outro grupo antes de remover\"" : ""}>Remover</button></div>`; }).join("");
      g.querySelectorAll("[data-gr]").forEach(inp => inp.oninput = () => { itens[+inp.dataset.gr].nome = inp.value; });
      g.querySelectorAll("[data-gr-up]").forEach(b => b.onclick = () => { const i = +b.dataset.grUp; [itens[i - 1], itens[i]] = [itens[i], itens[i - 1]]; desenhar(); });
      g.querySelectorAll("[data-gr-del]").forEach(b => b.onclick = () => { itens.splice(+b.dataset.grDel, 1); desenhar(); });
    };
    desenhar();
    g.querySelector("#gr-add").onclick = () => { itens.push({ id: "", nome: "" }); desenhar(); g.querySelector(`[data-gr="${itens.length - 1}"]`).focus(); };
    g.querySelector("#gr-salvar").onclick = async e => {
      const lst = itens.filter(x => x.nome.trim()).map(x => ({ id: x.id || x.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), nome: x.nome.trim() }));
      e.target.disabled = true; const res = await api("solucoes_grupos", { corpo: { grupos: lst } }); e.target.disabled = false;
      if (res.ok) { fecharGaveta(); toast("Grupos salvos."); secSolucoes(); } else msg("gr-msg", "erro", res.mensagem);
    };
  }

  /* ---------- Ouvidoria (protocolos rastreáveis) ---------- */
  const OUV_TIPO = { denuncia: "Denúncia", reclamacao: "Reclamação", sugestao: "Sugestão de melhoria" };
  const OUV_ST = { recebido: ["Recebido", "p-alerta"], em_analise: ["Em análise", "p-info"], respondido: ["Respondido", "p-ok"], concluido: ["Concluído", ""] };
  async function secOuvidoria() {
    st.ouv = st.ouv || { st: "abertos", tipo: "", busca: "" };
    $("acoes-topo").innerHTML = `<a class="btn btn-sec" href="/protocolo.html" target="_blank" rel="noopener">Página pública de consulta</a>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("ouv_listar"); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const lista = r.protocolos || [];
    const cont = k => lista.filter(p => k === "abertos" ? p.status !== "concluido" : k === "todos" ? true : p.status === k).length;
    $("conteudo").innerHTML = `<div class="grade">${[["Abertos", cont("abertos")], ["Aguardando 1ª resposta", cont("recebido")], ["Respondidos", cont("respondido")], ["Concluídos", cont("concluido")]].map(([t, v]) => `<div class="card kpi c3"><span class="rot">${t}</span><b class="val">${v}</b></div>`).join("")}</div>` +
      card("", "Protocolos da Ouvidoria", "Cada denúncia, reclamação ou sugestão enviada pelo Fale Conosco gera um protocolo. O solicitante acompanha em lippmannts.com/protocolo.html com o código de acesso. Cada resposta pública é enviada por e-mail automaticamente (quando houver e-mail).",
      `<div class="tr-barra"><label class="tr-campo"><span>Situação</span><select id="ouv-st">${[["abertos", "Abertos"], ["recebido", "Recebidos"], ["em_analise", "Em análise"], ["respondido", "Respondidos"], ["concluido", "Concluídos"], ["todos", "Todos"]].map(([k, v]) => `<option value="${k}"${st.ouv.st === k ? " selected" : ""}>${v}</option>`).join("")}</select></label>
        <label class="tr-campo tr-busca"><span>Buscar</span><input id="ouv-busca" type="search" value="${esc(st.ouv.busca)}" placeholder="Protocolo, nome, e-mail ou texto"></label></div>
      <div class="tr-filtros">${[["", "Todos os tipos"], ...Object.entries(OUV_TIPO)].map(([k, v]) => `<button type="button" class="filtro-chip" data-ouvt="${k}" aria-pressed="${st.ouv.tipo === k}">${v}</button>`).join("")}</div>
      <div class="tabela-box"><table class="t"><thead><tr><th>Protocolo</th><th>Tipo</th><th>Solicitante</th><th>Aberto em</th><th>Situação</th></tr></thead><tbody id="ouv-lista"></tbody></table></div>`);
    const desenhar = () => {
      const b = st.ouv.busca.toLowerCase();
      const vis = lista.filter(p => (st.ouv.st === "todos" || (st.ouv.st === "abertos" ? p.status !== "concluido" : p.status === st.ouv.st)) && (!st.ouv.tipo || p.tipo === st.ouv.tipo) && (!b || [p.protocolo, p.nome, p.email, p.mensagem].join(" ").toLowerCase().includes(b)));
      $("ouv-lista").innerHTML = vis.map(p => `<tr data-ouv="${p.id}"><td><b>${esc(p.protocolo)}</b><small>${esc(String(p.mensagem || "").slice(0, 90))}${String(p.mensagem || "").length > 90 ? "…" : ""}</small></td><td>${OUV_TIPO[p.tipo] || p.tipo}</td><td>${p.anonimo ? "<i>Anônimo</i>" : esc(p.nome || "—")}<small>${esc(p.email || "")}</small></td><td>${esc(p.criado || "")}</td><td><span class="pill ${(OUV_ST[p.status] || [])[1] || ""}">${(OUV_ST[p.status] || [p.status])[0]}</span></td></tr>`).join("") || `<tr><td colspan="5" class="vazio">Nenhum protocolo com esse filtro.</td></tr>`;
      document.querySelectorAll("[data-ouv]").forEach(tr => tr.onclick = () => abrirProtocolo(+tr.dataset.ouv));
    };
    desenhar();
    $("ouv-st").onchange = e => { st.ouv.st = e.target.value; desenhar(); };
    $("ouv-busca").oninput = e => { st.ouv.busca = e.target.value; desenhar(); };
    document.querySelectorAll("[data-ouvt]").forEach(bt => bt.onclick = () => { st.ouv.tipo = bt.dataset.ouvt; document.querySelectorAll("[data-ouvt]").forEach(x => x.setAttribute("aria-pressed", x === bt)); desenhar(); });
  }
  async function abrirProtocolo(id) {
    const r = await api("ouv_detalhe", { query: `id=${id}` }); if (!r.ok) return toast(r.mensagem);
    const p = r.protocolo, AUT = { lippmann: "LIPPMANN", solicitante: "Solicitante", sistema: "Sistema" };
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${OUV_TIPO[p.tipo]} · aberto em ${esc(p.criado)}</p><h2>${esc(p.protocolo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="ouv-dados"><div><small>Solicitante</small><b>${p.anonimo ? "Anônimo" : esc(p.nome || "—")}</b></div><div><small>E-mail</small><b>${esc(p.email || "—")}</b></div><div><small>Telefone</small><b>${esc(p.telefone || "—")}</b></div><div><small>Situação</small><b>${(OUV_ST[p.status] || [p.status])[0]}</b></div></div>
      <h3 class="ouv-h">Mensagem</h3><p class="ouv-msg">${esc(p.mensagem)}</p>
      <h3 class="ouv-h">Histórico</h3>
      <ul class="ouv-hist">${r.historico.map(m => `<li class="a-${esc(m.autor)}${m.publico ? "" : " interno"}"><div><b>${AUT[m.autor] || m.autor}${m.por ? " · " + esc(m.por) : ""}</b><small>${esc(m.criado || "")}${m.publico ? "" : " · anotação interna"}${m.status_novo ? " · " + (OUV_ST[m.status_novo] || [m.status_novo])[0] : ""}</small></div><p>${esc(m.texto)}</p></li>`).join("")}</ul>
      <h3 class="ouv-h">Responder</h3>
      <div class="form-grid">
        <div class="campo full"><label for="ouv-texto">Resposta</label><textarea id="ouv-texto" style="min-height:120px" placeholder="Escreva a resposta ao solicitante (ou uma anotação interna)."></textarea></div>
        <div class="campo"><label for="ouv-nst">Situação após responder</label><select id="ouv-nst">${Object.entries(OUV_ST).map(([k, v]) => `<option value="${k}"${(p.status === "recebido" ? "respondido" : p.status) === k ? " selected" : ""}>${v[0]}</option>`).join("")}</select></div>
        <div class="campo"><label for="ouv-vis">Visibilidade</label><select id="ouv-vis"><option value="1">Resposta ao solicitante (aparece na consulta e vai por e-mail)</option><option value="0">Anotação interna (só a equipe vê)</option></select></div>
      </div>
      <p class="aviso erro" id="ouv-m" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="ouv-enviar">Registrar</button></div>`);
    g.querySelector("#ouv-enviar").onclick = async e => {
      e.target.disabled = true; const x = await api("ouv_responder", { corpo: { id: p.id, texto: $("ouv-texto").value, status: $("ouv-nst").value, publico: $("ouv-vis").value } }); e.target.disabled = false;
      if (!x.ok) return msg("ouv-m", "erro", x.mensagem);
      toast(x.mensagem || "Registrado."); fecharGaveta(); secOuvidoria();
    };
  }

  /* ---------- LIPP · assistente virtual com IA ---------- */
  const LIPP_ST = { aberta: ["Conversa", ""], lead: ["Lead", "p-info"], agendada: ["Reunião", "p-ok"], encerrada: ["Encerrada", ""] };
  const AG_ST = { solicitado: ["A confirmar", "p-info"], agendado: ["Confirmada", "p-ok"], realizado: ["Realizada", ""], cancelado: ["Cancelada", "p-alerta"] };
  async function secLipp() {
    st.lipp = st.lipp || { aba: "conversas", busca: "", so: "" };
    $("acoes-topo").innerHTML = `<div class="seg" role="group" aria-label="Período">${[[7, "7 dias"], [30, "30 dias"], [90, "90 dias"], [365, "12 meses"]].map(([d, r]) => `<button type="button" data-ldias="${d}" aria-pressed="${st.dias === d}">${r}</button>`).join("")}</div>`;
    $("acoes-topo").querySelectorAll("[data-ldias]").forEach(b => b.onclick = () => { st.dias = +b.dataset.ldias; secLipp(); });
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("lipp_resumo", { query: "dias=" + st.dias }); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const cv = r.conversas || [], ag = r.agendamentos || [];
    const leads = cv.filter(c => c.lead), agPer = cv.filter(c => c.agendou).length;
    const conv = cv.length ? Math.round((leads.length / cv.length) * 100) : 0;
    const proximas = ag.filter(a => a.status !== "cancelado" && new Date(a.inicio) > new Date()).sort((a, z) => String(a.inicio).localeCompare(String(z.inicio)));
    const avisoCfg = `<div class="lipp-cfg"><span class="pill ${r.ia ? "p-ok" : "p-info"}">${r.ia ? "IA Claude ativa" : "IA não configurada · respondendo pela base de conhecimento"}</span><span class="pill ${r.google ? "p-ok" : "p-info"}">${r.google ? "Google Agenda + Meet conectados" : "Google Agenda não conectado · pedidos ficam a confirmar"}</span></div>`;
    $("conteudo").innerHTML = avisoCfg + `<div class="grade">${[["Conversas", cv.length], ["Leads capturados", leads.length], ["Reuniões pedidas", agPer], ["Taxa de conversão em lead", conv + "%"]].map(([t, v]) => `<div class="card kpi c3"><span class="rot">${t}</span><b class="val">${v}</b></div>`).join("")}` +
      card("c6", "Principais temas", "Assuntos identificados nas conversas do período.", ranking(r.temas || [])) +
      card("c6", "Principais dúvidas", "Primeira pergunta de cada conversa, agrupada.", (r.perguntas || []).length ? `<div class="ranking">${r.perguntas.slice(0, 10).map(p => `<div class="lin"><span class="nome" title="${esc(p.texto)}">${esc(p.texto)}</span><span class="v">${p.n}</span><span class="barra"><i style="width:${Math.max(3, (p.n / r.perguntas[0].n) * 100)}%"></i></span></div>`).join("")}</div>` : `<p class="vazio">Ainda não há dados neste período.</p>`) +
      card("c12", "Conversas, leads e reuniões", "Clique numa linha para ver a conversa completa. As reuniões vêm do agendamento pelo chat (segunda a sexta, 9h às 17h).",
        `<div class="tr-filtros">${[["conversas", `Conversas (${cv.length})`], ["leads", `Leads (${leads.length})`], ["reunioes", `Reuniões (${ag.length})`]].map(([k, v]) => `<button type="button" class="filtro-chip" data-laba="${k}" aria-pressed="${st.lipp.aba === k}">${v}</button>`).join("")}
         <label class="tr-campo tr-busca" style="margin-left:auto"><span>Buscar</span><input id="lipp-busca" type="search" value="${esc(st.lipp.busca)}" placeholder="Nome, empresa, e-mail ou tema"></label>
         <button class="btn btn-sec" type="button" id="lipp-xlsx">${IC.baixar} Excel</button></div>
         <div class="tabela-box"><table class="t"><thead id="lipp-cab"></thead><tbody id="lipp-lista"></tbody></table></div>`) + `</div>` +
      (proximas.length ? card("", "Próximas reuniões", "", `<ul class="lipp-prox">${proximas.slice(0, 6).map(a => `<li><b>${esc(a.quando)}</b> · ${esc(a.nome)}${a.empresa ? " (" + esc(a.empresa) + ")" : ""} <span class="pill ${AG_ST[a.status][1]}">${AG_ST[a.status][0]}</span></li>`).join("")}</ul>`) : "");
    const bate = (o, campos) => { const b = st.lipp.busca.toLowerCase(); return !b || campos.map(k => Array.isArray(o[k]) ? o[k].join(" ") : o[k] || "").join(" ").toLowerCase().includes(b); };
    const desenhar = () => {
      const aba = st.lipp.aba;
      if (aba === "reunioes") {
        $("lipp-cab").innerHTML = `<tr><th>Quando</th><th>Visitante</th><th>Necessidade</th><th>Google Meet</th><th>Situação</th></tr>`;
        const vis = ag.filter(a => bate(a, ["nome", "email", "empresa", "necessidade"]));
        $("lipp-lista").innerHTML = vis.map(a => `<tr data-lag="${a.id}"><td><b>${esc(a.quando)}</b></td><td>${esc(a.nome)}<small>${esc(a.empresa || "")} · ${esc(a.email)}${a.telefone ? " · " + esc(a.telefone) : ""}</small></td><td><small>${esc(String(a.necessidade || "—").slice(0, 120))}</small></td><td>${a.meet_url ? `<a href="${esc(a.meet_url)}" target="_blank" rel="noopener">Abrir</a>` : "—"}</td><td><span class="pill ${(AG_ST[a.status] || [])[1] || ""}">${(AG_ST[a.status] || [a.status])[0]}</span></td></tr>`).join("") || `<tr><td colspan="5" class="vazio">Nenhuma reunião.</td></tr>`;
        document.querySelectorAll("[data-lag]").forEach(tr => tr.onclick = e => { if (!e.target.closest("a")) abrirAgendamento(ag.find(a => a.id == tr.dataset.lag)); });
        return;
      }
      const base = aba === "leads" ? leads : cv;
      $("lipp-cab").innerHTML = `<tr><th>Data</th><th>Visitante</th><th>Temas</th><th>Mensagens</th><th>Situação</th></tr>`;
      const vis = base.filter(c => bate(c, ["lead_nome", "lead_email", "lead_empresa", "necessidade", "temas", "geo_cidade"]));
      $("lipp-lista").innerHTML = vis.map(c => `<tr data-lcv="${esc(c.id)}"><td>${esc(c.criado)}<small>${esc(c.pagina || "")}${c.geo_cidade ? " · " + esc(c.geo_cidade) + (c.geo_uf ? "/" + esc(c.geo_uf) : "") : ""}</small></td><td>${c.lead_nome ? esc(c.lead_nome) : "<i>Visitante anônimo</i>"}<small>${esc([c.lead_empresa, c.lead_email, c.lead_telefone].filter(Boolean).join(" · "))}</small></td><td><small>${esc((c.temas || []).slice(0, 4).join(", ") || "—")}</small></td><td>${c.mensagens || 0}<small>${c.modo === "ia" ? "IA" : "base"}</small></td><td><span class="pill ${(LIPP_ST[c.status] || [])[1] || ""}">${(LIPP_ST[c.status] || [c.status])[0]}</span></td></tr>`).join("") || `<tr><td colspan="5" class="vazio">Nenhuma conversa neste período.</td></tr>`;
      document.querySelectorAll("[data-lcv]").forEach(tr => tr.onclick = () => abrirConversaLipp(tr.dataset.lcv));
    };
    desenhar();
    document.querySelectorAll("[data-laba]").forEach(bt => bt.onclick = () => { st.lipp.aba = bt.dataset.laba; document.querySelectorAll("[data-laba]").forEach(x => x.setAttribute("aria-pressed", x === bt)); desenhar(); });
    $("lipp-busca").oninput = e => { st.lipp.busca = e.target.value; desenhar(); };
    $("lipp-xlsx").onclick = () => {
      const linhas = st.lipp.aba === "reunioes"
        ? ag.map(a => ({ Quando: a.quando, Nome: a.nome, "E-mail": a.email, Telefone: a.telefone || "", Empresa: a.empresa || "", Necessidade: a.necessidade || "", Situação: (AG_ST[a.status] || [a.status])[0], "Google Meet": a.meet_url || "" }))
        : (st.lipp.aba === "leads" ? leads : cv).map(c => ({ Data: c.criado, Nome: c.lead_nome || "", "E-mail": c.lead_email || "", Telefone: c.lead_telefone || "", Empresa: c.lead_empresa || "", Cargo: c.lead_cargo || "", Necessidade: c.necessidade || "", Temas: (c.temas || []).join(", "), Mensagens: c.mensagens || 0, Página: c.pagina || "", Cidade: [c.geo_cidade, c.geo_uf].filter(Boolean).join("/"), Situação: (LIPP_ST[c.status] || [c.status])[0] }));
      exportar(linhas, "xlsx", "LIPP-" + st.lipp.aba, true);
    };
  }
  async function abrirConversaLipp(id) {
    const r = await api("lipp_conversa", { query: "id=" + encodeURIComponent(id) }); if (!r.ok) return toast(r.mensagem);
    const c = r.conversa;
    gaveta(`
      <div class="gaveta-cab"><div><p class="desc">Conversa com o LIPP · ${esc(c.criado)} · ${esc(c.pagina || "")}</p><h2>${c.lead_nome ? esc(c.lead_nome) : "Visitante anônimo"}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      ${c.lead ? `<div class="ouv-dados"><div><small>E-mail</small><b>${esc(c.lead_email || "—")}</b></div><div><small>Telefone</small><b>${esc(c.lead_telefone || "—")}</b></div><div><small>Empresa</small><b>${esc(c.lead_empresa || "—")}</b></div><div><small>Situação</small><b>${(LIPP_ST[c.status] || [c.status])[0]}</b></div></div>
      <h3 class="ouv-h">Necessidade</h3><p class="ouv-msg">${esc(c.necessidade || "—")}</p>` : ""}
      <h3 class="ouv-h">Temas</h3><p>${(c.temas || []).map(x => `<span class="pill">${esc(x)}</span>`).join(" ") || "—"}</p>
      <h3 class="ouv-h">Conversa</h3>
      <div class="lipp-transcricao">${r.mensagens.map(m => `<div class="lt-${m.papel === "usuario" ? "eu" : "ele"}"><small>${m.papel === "usuario" ? "Visitante" : "LIPP" + (m.modo === "ia" ? " · IA" : m.modo === "base" ? " · base" : "")} · ${esc(m.criado || "")}</small><p>${esc(m.texto).replace(/\n/g, "<br>")}</p></div>`).join("") || `<p class="vazio">Sem mensagens.</p>`}</div>
      ${c.lead_email ? `<div class="linha-acoes"><a class="btn btn-primario" href="mailto:${esc(c.lead_email)}?subject=${encodeURIComponent("LIPPMANN · sua solicitação")}">Responder por e-mail</a>${c.lead_telefone ? `<a class="btn btn-sec" href="https://wa.me/55${esc(String(c.lead_telefone).replace(/\D/g, "").replace(/^55/, ""))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}</div>` : ""}`);
  }
  function abrirAgendamento(a) {
    if (!a) return;
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">Reunião pelo Google Meet · 30 minutos</p><h2>${esc(a.quando)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="ouv-dados"><div><small>Nome</small><b>${esc(a.nome)}</b></div><div><small>E-mail</small><b>${esc(a.email)}</b></div><div><small>Telefone</small><b>${esc(a.telefone || "—")}</b></div><div><small>Empresa</small><b>${esc(a.empresa || "—")}</b></div></div>
      <h3 class="ouv-h">Necessidade</h3><p class="ouv-msg">${esc(a.necessidade || "—")}</p>
      <div class="form-grid">
        <div class="campo"><label for="ag-st">Situação</label><select id="ag-st">${Object.entries(AG_ST).map(([k, v]) => `<option value="${k}"${a.status === k ? " selected" : ""}>${v[0]}</option>`).join("")}</select></div>
        <div class="campo"><label for="ag-meet">Link do Google Meet</label><input id="ag-meet" value="${esc(a.meet_url || "")}" placeholder="https://meet.google.com/..."></div>
        <div class="campo full"><label for="ag-obs">Observação interna</label><textarea id="ag-obs">${esc(a.observacao || "")}</textarea></div>
        <label class="campo full" style="flex-direction:row;gap:8px;align-items:center;display:flex"><input type="checkbox" id="ag-avisar" checked> Enviar e-mail ao visitante com a confirmação (ou o cancelamento)</label>
      </div>
      <p class="aviso erro" id="ag-m" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="ag-salvar">Salvar</button></div>`);
    g.querySelector("#ag-salvar").onclick = async e => {
      e.target.disabled = true;
      const x = await api("lipp_agendamento_salvar", { corpo: { id: a.id, status: $("ag-st").value, meet_url: $("ag-meet").value.trim(), observacao: $("ag-obs").value, avisar: $("ag-avisar").checked } });
      e.target.disabled = false;
      if (!x.ok) return msg("ag-m", "erro", x.mensagem);
      toast(x.mensagem); fecharGaveta(); st.lipp.aba = "reunioes"; secLipp();
    };
  }

  /* ---------- Traduções (multi-idiomas) ---------- */
  const IDIOMAS_TR = { "en-US": { nome: "Inglês (EUA)", arq: "en" }, "en-GB": { nome: "Inglês (Reino Unido)", arq: "en" }, "es-ES": { nome: "Espanhol (Espanha)", arq: "es" }, "pt-PT": { nome: "Português (Portugal)", arq: "pt-pt" } };
  const carregarDic = arq => new Promise(ok => { const D = window.LTS_I18N_DIC || {}; if (D[arq]) return ok(D[arq]); const sc = document.createElement("script"); sc.src = `/data/i18n/${arq}.js?v=painel`; sc.onload = () => ok((window.LTS_I18N_DIC || {})[arq] || { textos: {} }); sc.onerror = () => ok({ textos: {} }); document.head.appendChild(sc); });
  const normTr = t => String(t || "").replace(/\s+/g, " ").trim();
  async function secTraducoes() {
    st.tr = st.tr || { idioma: "en-US", filtro: "faltando", busca: "", limite: 60 };
    $("acoes-topo").innerHTML = `<a class="btn btn-sec" href="/index.html?lang=${st.tr.idioma}" target="_blank" rel="noopener">${IC.globo} Ver o site neste idioma</a>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const i = IDIOMAS_TR[st.tr.idioma];
    const [dic, ed, fon] = await Promise.all([carregarDic(i.arq), api("i18n_listar", { query: `l=${st.tr.idioma}` }), api("i18n_fontes")]);
    if (!ed.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(ed.mensagem)}</p>`; return; }
    const base = dic.textos || {}, gb = st.tr.idioma === "en-GB" ? (dic.gb || {}) : {}, editados = Object.fromEntries((ed.textos || []).map(x => [normTr(x.pt), x]));
    // textos que vêm do painel (treinamentos, soluções, HUB, políticas e cursos): entram na lista mesmo sem tradução
    const doPainel = new Set();
    const add = v => (Array.isArray(v) ? v : [v]).forEach(x => { x = normTr(x); if (x && /[A-Za-zÀ-ú]{2}/.test(x) && x.length <= 4000) doPainel.add(x); });
    if (fon.ok) {
      (fon.catalogo || []).filter(t => t.ativo !== false).forEach(t => ["titulo", "resumo", "norma", "carga_horaria", "modalidade", "aprender", "publico", "beneficios", "prerequisito", "porque", "atestado"].forEach(k => add(t[k])));
      (fon.solucoes || []).filter(s => s.ativo !== false).forEach(s => { add(s.titulo); add(s.texto); });
      Object.values(fon.grupos || {}).forEach(add);
      (fon.hub || []).filter(h => h.publicado !== false).forEach(h => { add(h.titulo); add(h.resumo); add(h.tags || []); });
      (fon.politicas || []).filter(p => p.ativo !== false).forEach(p => { add(p.titulo); add(p.resumo); });
      (fon.cursos || []).filter(c => c.ativo !== false).forEach(c => { add(c.titulo); add(c.resumo); });
    }
    const chaves = [...new Set([...Object.keys(base), ...doPainel, ...Object.keys(editados)])];
    const ptpt = st.tr.idioma === "pt-PT";
    const linhas = chaves.map(pt => {
      const e = editados[pt]; let padrao = gb[pt] ?? base[pt] ?? null;
      if (padrao == null && /\d/.test(pt)) { const n = []; const tpl = pt.replace(/\d+(?:[.,:/]\d+)*/g, x => "{" + (n.push(x) - 1) + "}"); const v = gb[tpl] ?? base[tpl]; if (v != null) padrao = v.replace(/\{(\d+)\}/g, (m, k) => n[+k] ?? ""); }
      return { pt, padrao, editado: e ? e.traducao : null, quem: e ? `${e.atualizado_por || ""}${e.atualizado ? " · " + e.atualizado : ""}` : "", painel: doPainel.has(pt), estado: e ? "editado" : padrao != null || ptpt ? "padrao" : "faltando" };
    }).sort((a, z) => ((z.estado === "faltando") - (a.estado === "faltando")) || a.pt.localeCompare(z.pt, "pt-BR"));
    const cont = { todos: linhas.length, faltando: linhas.filter(l => l.estado === "faltando").length, editado: linhas.filter(l => l.estado === "editado").length, painel: linhas.filter(l => l.painel).length };
    if (st.tr.filtro === "faltando" && !cont.faltando) st.tr.filtro = cont.editado ? "editado" : "todos";
    const visiveis = () => { const b = normTr(st.tr.busca).toLowerCase(); return linhas.filter(l => (st.tr.filtro === "todos" || (st.tr.filtro === "painel" ? l.painel : l.estado === st.tr.filtro)) && (!b || l.pt.toLowerCase().includes(b) || String(l.editado ?? l.padrao ?? "").toLowerCase().includes(b))); };
    $("conteudo").innerHTML = card("", "Traduções do site", `O site é escrito em português do Brasil. Ao escolher outro idioma no globo do topo, cada texto é trocado pela tradução abaixo. ${ptpt ? "Em português de Portugal, o site adapta automaticamente o vocabulário e a acentuação (equipa, registo, telemóvel, formação, contacto…); aqui você só ajusta frases específicas." : "O que não tiver tradução continua em português."} Conteúdo dos cursos EaD, avaliações, certificados, relatórios e o corpo dos artigos do HUB permanecem em português (Brasil). Marcas como {0} e {1} são números que o site preenche sozinho (datas, horas, valores): mantenha-as na tradução.`,
      `<div class="tr-barra">
        <label class="tr-campo"><span>Idioma</span><select id="tr-idioma">${Object.entries(IDIOMAS_TR).map(([c, x]) => `<option value="${c}"${c === st.tr.idioma ? " selected" : ""}>${x.nome}</option>`).join("")}</select></label>
        <label class="tr-campo tr-busca"><span>Buscar</span><input id="tr-busca" type="search" value="${esc(st.tr.busca)}" placeholder="Texto em português ou na tradução"></label>
      </div>
      <div class="tr-filtros" role="group" aria-label="Filtrar traduções">${[["faltando", `Sem tradução (${cont.faltando})`], ["painel", `Conteúdo do painel (${cont.painel})`], ["editado", `Editadas por vocês (${cont.editado})`], ["todos", `Todas (${cont.todos})`]].map(([k, v]) => `<button type="button" class="filtro-chip" data-trf="${k}" aria-pressed="${st.tr.filtro === k}">${v}</button>`).join("")}</div>
      <div id="tr-lista" class="tr-lista"></div><div id="tr-mais"></div>`);
    const desenhar = () => {
      const vis = visiveis(), lst = vis.slice(0, st.tr.limite);
      $("tr-lista").innerHTML = lst.length ? lst.map((l, n) => `<div class="tr-linha tr-${l.estado}" data-i="${n}">
          <div class="tr-orig"><small>Português (Brasil)${l.painel ? " · do painel" : ""}</small><p>${esc(l.pt)}</p></div>
          <div class="tr-dest"><small>${esc(IDIOMAS_TR[st.tr.idioma].nome)} · ${l.estado === "editado" ? `<b class="ok">editada</b>${l.quem ? " por " + esc(l.quem) : ""}` : l.estado === "padrao" ? (l.padrao != null ? "tradução padrão" : "adaptação automática") : `<b class="falta">sem tradução</b>`}</small>
            <textarea rows="${Math.min(6, Math.max(2, Math.ceil(String(l.editado ?? l.padrao ?? l.pt).length / 70)))}" data-tr="${n}" placeholder="${l.padrao != null ? esc(l.padrao) : ptpt ? "Deixe vazio para usar a adaptação automática" : "Escreva a tradução"}">${esc(l.editado ?? (ptpt ? "" : l.padrao ?? ""))}</textarea>
            <div class="tr-acoes"><button class="btn btn-primario" type="button" data-salvar="${n}">Salvar</button>${l.estado === "editado" ? `<button class="btn btn-sec" type="button" data-restaurar="${n}">${l.padrao != null || ptpt ? "Voltar ao padrão" : "Remover"}</button>` : ""}<span class="tr-ok" data-st="${n}"></span></div>
          </div></div>`).join("") : `<p class="vazio">Nada encontrado com esse filtro.</p>`;
      $("tr-mais").innerHTML = vis.length > lst.length ? `<button class="btn btn-sec" type="button" id="tr-mostrar">Mostrar mais (${vis.length - lst.length})</button>` : "";
      if ($("tr-mostrar")) $("tr-mostrar").onclick = () => { st.tr.limite += 60; desenhar(); };
      const salvar = async (n, valor) => {
        const l = lst[n], s = document.querySelector(`[data-st="${n}"]`); s.textContent = "Salvando…";
        const r = await api("i18n_salvar", { corpo: { idioma: st.tr.idioma, pt: l.pt, traducao: valor } });
        if (!r.ok) { s.textContent = r.mensagem; return; }
        if (normTr(valor)) { l.editado = normTr(valor); l.estado = "editado"; l.quem = "você · agora"; } else { l.editado = null; l.estado = l.padrao != null || ptpt ? "padrao" : "faltando"; }
        toast("Tradução salva. O site é atualizado em até 1 minuto."); desenhar();
      };
      $("tr-lista").querySelectorAll("[data-salvar]").forEach(bt => bt.onclick = () => { const n = +bt.dataset.salvar, v = document.querySelector(`[data-tr="${n}"]`).value; const l = lst[n]; if (!ptpt && !normTr(v) && l.padrao == null) return toast("Escreva a tradução antes de salvar."); salvar(n, normTr(v) === normTr(l.padrao) && l.estado !== "editado" ? "" : v); });
      $("tr-lista").querySelectorAll("[data-restaurar]").forEach(bt => bt.onclick = () => salvar(+bt.dataset.restaurar, ""));
    };
    desenhar();
    $("tr-idioma").onchange = e => { st.tr.idioma = e.target.value; st.tr.limite = 60; st.tr.filtro = "faltando"; secTraducoes(); };
    let tm; $("tr-busca").oninput = e => { clearTimeout(tm); tm = setTimeout(() => { st.tr.busca = e.target.value; st.tr.limite = 60; desenhar(); }, 200); };
    document.querySelectorAll("[data-trf]").forEach(bt => bt.onclick = () => { st.tr.filtro = bt.dataset.trf; st.tr.limite = 60; document.querySelectorAll("[data-trf]").forEach(x => x.setAttribute("aria-pressed", x === bt)); desenhar(); });
  }

  /* ---------- Políticas e Termo ---------- */
  async function secPoliticas() {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="pol-novo">+ Novo documento</button>`;
    $("conteudo").innerHTML = `<p class="vazio">Carregando…</p>`;
    const r = await api("politicas_listar"); if (!r.ok) { $("conteudo").innerHTML = `<p class="aviso erro">${esc(r.mensagem)}</p>`; return; }
    const lista = r.politicas || [];
    $("conteudo").innerHTML = card("", "Políticas corporativas e Termo de Compromisso Social", "Aparecem como cartões de pré-visualização em A LIPPMANN › Políticas. Documentos protegidos (como o Termo) são exibidos somente para leitura em tela, sem download.",
      `<div class="pol-lista">${lista.map(p => `<button type="button" class="pol-item" data-pol="${esc(p.id)}">
        <span class="pol-capa">${p.capa ? `<img src="${esc(p.capa)}" alt="">` : ""}</span>
        <span><b>${esc(p.titulo)}</b><small>${esc([p.codigo, p.revisao].filter(Boolean).join(" · "))}</small>
        <span style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${p.protegido ? `<span class="pill p-info">Protegido</span>` : `<span class="pill">PDF${p.paginas ? " · " + p.paginas + " p." : ""}</span>`}${p.ativo === false ? `<span class="pill p-alerta">Oculto</span>` : `<span class="pill p-ok">No site</span>`}</span></span>
      </button>`).join("") || `<p class="vazio">Nenhum documento.</p>`}</div>
      <p class="aviso atencao" style="margin-top:14px">Os textos iniciais são <b>minutas (REV00)</b> preparadas para aprovação da Direção. Revise, ajuste e troque a revisão para REV01 quando aprovar.</p>`);
    $("pol-novo").onclick = () => editarPolitica({});
    document.querySelectorAll("[data-pol]").forEach(b => b.onclick = () => editarPolitica(lista.find(p => p.id === b.dataset.pol)));
  }
  function editarPolitica(p) {
    const novo = !p.id;
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Novo documento" : "Editar documento"}</p><h2>${novo ? "Política" : esc(p.titulo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="p-titulo">Título</label><input id="p-titulo" value="${esc(p.titulo || "")}"></div>
        <div class="campo"><label for="p-cod">Código</label><input id="p-cod" value="${esc(p.codigo || "")}" placeholder="LTS-POL-003"></div>
        <div class="campo"><label for="p-rev">Revisão</label><input id="p-rev" value="${esc(p.revisao || "REV00")}"></div>
        <div class="campo full"><label for="p-resumo">Resumo do cartão</label><textarea id="p-resumo" style="min-height:70px">${esc(p.resumo || "")}</textarea></div>
        ${caixaMarcar("p-prot", "Documento protegido (somente leitura em tela, sem download)", p.protegido)}
        <div class="campo full" id="p-bloco-pdf">
          <label>Arquivo PDF</label>
          <div class="img-campo"><span class="img-prev retrato" id="p-capa-prev">${p.capa ? `<img src="${esc(p.capa)}" alt="">` : "Sem capa"}</span>
          <div style="display:grid;gap:8px;min-width:0"><input id="p-arq" value="${esc(p.arquivo || "")}" placeholder="Endereço do PDF">
          <label class="btn btn-sec" style="cursor:pointer;justify-self:start">Enviar PDF<input type="file" accept="application/pdf" id="p-arq-up" hidden></label>
          <small id="p-arq-info">${p.paginas ? p.paginas + " páginas. " : ""}Ao enviar, a capa e o número de páginas são gerados automaticamente.</small></div></div>
        </div>
        <div class="campo full" id="p-bloco-texto"><label>Texto do documento</label>${editorRico("p-corpo", p.corpo_html || "")}</div>
        <div class="campo"><label for="p-ordem">Ordem</label><input id="p-ordem" type="number" value="${esc(p.ordem ?? 100)}"></div>
        ${caixaMarcar("p-ativo", "Exibir no site", p.ativo !== false)}
      </div>
      <p class="aviso erro" id="p-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="p-salvar">Salvar</button>${novo ? "" : `<a class="btn btn-sec" href="${p.protegido ? "/termo-compromisso-social.html" : "/a-lippmann.html#politicas"}" target="_blank" rel="noopener">Ver no site</a><button class="btn btn-perigo" type="button" id="p-excluir">Excluir</button>`}</div>`);
    g.querySelector(".gaveta").classList.add("gaveta-larga");
    const corpo = ligarEditor(g, "p-corpo", "politicas");
    let capa = p.capa || "", paginas = p.paginas || null;
    const alternar = () => { const pr = $("p-prot").checked; $("p-bloco-pdf").hidden = pr; $("p-bloco-texto").hidden = !pr; };
    $("p-prot").onchange = alternar; alternar();
    $("p-arq-up").onchange = async ev => {
      const f = ev.target.files[0]; if (!f) return;
      const info = $("p-arq-info"); info.textContent = "Lendo o PDF e gerando a capa…";
      try {
        try { const c = await capaDoPdf(f); paginas = c.paginas; capa = await enviarPublico(c.capa, "politicas"); $("p-capa-prev").innerHTML = `<img src="${esc(capa)}" alt="">`; } catch (e) { console.warn(e); }
        info.textContent = "Enviando o PDF…";
        $("p-arq").value = await enviarPublico(f, "politicas");
        info.textContent = `PDF enviado${paginas ? ` · ${paginas} páginas` : ""}. Clique em Salvar para publicar.`;
      } catch (e) { info.textContent = e.message; }
      ev.target.value = "";
    };
    g.querySelector("#p-salvar").onclick = async e => {
      const pr = $("p-prot").checked;
      const d = { id: p.id, titulo: $("p-titulo").value.trim(), codigo: $("p-cod").value, revisao: $("p-rev").value, resumo: $("p-resumo").value, protegido: pr,
        corpo_html: pr ? corpo() : "", arquivo: pr ? "" : $("p-arq").value.trim(), capa, paginas, ordem: $("p-ordem").value, ativo: $("p-ativo").checked ? 1 : 0 };
      if (!d.titulo) return msg("p-msg", "erro", "Informe o título.");
      if (!pr && !d.arquivo) return msg("p-msg", "erro", "Envie o PDF do documento (ou marque como protegido e escreva o texto).");
      e.target.disabled = true; const res = await api("politicas_salvar", { corpo: d }); e.target.disabled = false;
      if (res.ok) { fecharGaveta(); toast("Documento salvo."); secPoliticas(); } else msg("p-msg", "erro", res.mensagem);
    };
    confirmarExclusao(g, "#p-excluir", async () => { const res = await api("politicas_excluir", { corpo: { id: p.id } }); if (res.ok) { fecharGaveta(); toast("Documento excluído."); secPoliticas(); } else toast(res.mensagem); });
  }

  /* ================= UniLTS (AVA EaD) ================= */
  const notaBR = n => n === null || n === undefined || n === "" ? "—" : Number(n).toFixed(2).replace(".", ",");
  const SIT_MAT = { em_andamento: ["Em andamento", "p-novo"], aprovado: ["Aprovado", "p-ok"], reprovado: ["Reprovado", "p-alerta"], cancelado: ["Cancelado", "p-fim"] };
  const SIT_TUR = { aberta: ["Aberta", "p-ok"], encerrada: ["Encerrada", "p-fim"], cancelada: ["Cancelada", "p-alerta"] };
  const pillU = (mapa, k) => { const [r, c] = mapa[k] || [k, "p-fim"]; return `<span class="pill ${c}">${r}</span>`; };
  const barraU = p => `<span class="uni-barra" title="${p}%"><span style="width:${p}%"></span></span>`;
  async function secUnilts() {
    const abas = [["turmas", "Turmas"], ["cursos", "Cursos"], ["empresas", "Empresas (B2B)"], ["parceiros", "Parceiros / instrutores"], ["alunos", "Alunos"], ["numeracao", "Numeração"]];
    const atual = abas.some(a => a[0] === st.filtros.abaUni) ? st.filtros.abaUni : "turmas";
    $("conteudo").innerHTML = `<div style="display:grid;gap:18px"><div class="abas" role="tablist">${abas.map(([k, r]) => `<button type="button" role="tab" data-aba="${k}" aria-selected="${k === atual}">${r}</button>`).join("")}</div><div id="aba"><p class="vazio">Carregando…</p></div></div>`;
    $("conteudo").querySelector(".abas").onclick = e => { const b = e.target.closest("[data-aba]"); if (b) { st.filtros.abaUni = b.dataset.aba; secUnilts(); } };
    const r = await api("uni_resumo"); if (!r.ok) return msgAba(r);
    st.uni = r;
    ({ turmas: uniTurmas, cursos: uniCursos, empresas: uniEmpresas, parceiros: uniParceiros, alunos: uniAlunos, numeracao: uniNumeracao })[atual](r);
  }
  const MOD_U = { ead: "EaD", presencial: "Presencial", hibrido: "Híbrida (Blended Learning)" };
  const nomeEmpresa = id => { const e = (st.uni.empresas || []).find(x => x.id === id); return e ? (e.nome_fantasia || e.razao_social) : "Empresa"; };
  const nomeParceiro = id => { const e = (st.uni.parceiros || []).find(x => x.id === id); return e ? e.nome : "—"; };
  async function uniEmpresas() {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="em-nova">+ Nova empresa</button>`;
    $("em-nova").onclick = () => formEmpresa({});
    const r = await api("uni_empresas"); if (!r.ok) return msgAba(r);
    $("aba").innerHTML = card("", "Empresas clientes (B2B)", "Cada empresa acessa a sua Área da Empresa (/empresa/) e enxerga somente os próprios colaboradores, turmas e certificados.",
      r.empresas.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Empresa</th><th>CNPJ</th><th>Colaboradores</th><th>Acessos</th><th>Situação</th></tr></thead><tbody>
      ${r.empresas.map(e => `<tr data-emp="${e.id}"><td><b>${esc(e.nome_fantasia || e.razao_social)}</b><small>${esc(e.razao_social)}</small></td><td class="nw">${esc(e.cnpj)}</td><td>${e.colaboradores}</td><td>${e.usuarios.map(u => `<small>${esc(u.nome)} · ${esc(u.email)}${u.trocar_senha ? " (primeiro acesso pendente)" : ""}</small>`).join("") || "<small>—</small>"}</td><td>${e.ativo ? `<span class="pill p-ok">Ativa</span>` : `<span class="pill p-fim">Suspensa</span>`}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="vazio">Nenhuma empresa cadastrada.</p>`);
    document.querySelectorAll("[data-emp]").forEach(tr => tr.onclick = () => formEmpresa(r.empresas.find(e => String(e.id) === tr.dataset.emp)));
  }
  function formEmpresa(e) {
    const novo = !e.id;
    const g = gaveta(`<div class="gaveta-cab"><div><p class="desc">${novo ? "Nova empresa" : "Editar empresa"}</p><h2>${novo ? "Empresa" : esc(e.nome_fantasia || e.razao_social)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="em-razao">Razão social</label><input id="em-razao" value="${esc(e.razao_social || "")}"></div>
        <div class="campo"><label for="em-fant">Nome fantasia</label><input id="em-fant" value="${esc(e.nome_fantasia || "")}"></div>
        <div class="campo"><label for="em-cnpj">CNPJ</label><input id="em-cnpj" value="${esc(e.cnpj || "")}" placeholder="00.000.000/0000-00"></div>
        <div class="campo"><label for="em-cn">Contato</label><input id="em-cn" value="${esc(e.contato_nome || "")}"></div>
        <div class="campo"><label for="em-ce">E-mail do contato</label><input id="em-ce" type="email" value="${esc(e.contato_email || "")}"></div>
        <div class="campo"><label for="em-ct">Telefone</label><input id="em-ct" value="${esc(e.contato_telefone || "")}"></div>
        ${caixaMarcar("em-ativo", "Empresa ativa (desmarque para suspender o acesso)", e.ativo !== false)}
      </div>
      ${(e.usuarios || []).length ? `<div class="uni-usuarios"><p class="desc"><b>Acessos da empresa</b></p>${e.usuarios.map(u => `<div class="uni-usu"><span><b>${esc(u.nome)}</b><small>${esc(u.email)} · ${u.trocar_senha ? "primeiro acesso pendente" : "último acesso " + esc(dataBR(u.ultimo_acesso) || "—")}</small></span><button class="btn btn-sec" type="button" data-reenv="${u.id}">Reenviar acesso</button></div>`).join("")}</div>` : ""}
      <div class="form-grid"><div class="campo"><label for="em-un">${novo ? "Responsável (acesso à Área da Empresa)" : "Novo acesso: nome"}</label><input id="em-un"></div><div class="campo"><label for="em-ue">E-mail de acesso</label><input id="em-ue" type="email"></div></div>
      <p class="desc">O responsável recebe por e-mail o endereço /empresa/ e uma senha provisória, trocada no primeiro acesso.</p>
      <p class="aviso" id="em-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="em-salvar">Salvar</button></div>`);
    g.querySelectorAll("[data-reenv]").forEach(b => b.onclick = async () => { const res = await api("uni_portal_reenviar", { corpo: { tipo: "empresa", id: +b.dataset.reenv } }); msg("em-msg", res.ok ? "ok" : "erro", res.mensagem); });
    g.querySelector("#em-salvar").onclick = async ev => {
      ev.target.disabled = true;
      const res = await api("uni_empresa_salvar", { corpo: { id: e.id, razao_social: $("em-razao").value, nome_fantasia: $("em-fant").value, cnpj: $("em-cnpj").value, contato_nome: $("em-cn").value, contato_email: $("em-ce").value, contato_telefone: $("em-ct").value, ativo: $("em-ativo").checked ? 1 : 0, usuario_nome: $("em-un").value, usuario_email: $("em-ue").value } });
      ev.target.disabled = false;
      if (!res.ok) return msg("em-msg", "erro", res.mensagem);
      fecharGaveta(); toast(res.mensagem); st.filtros.abaUni = "empresas"; secUnilts();
    };
  }
  async function uniParceiros() {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="pa-novo">+ Novo parceiro</button>`;
    $("pa-novo").onclick = () => formParceiro({});
    const r = await api("uni_parceiros"); if (!r.ok) return msgAba(r);
    $("aba").innerHTML = card("", "Parceiros / instrutores", "Acessam o Painel do Parceiro (/parceiro/) para registrar turmas presenciais e híbridas, notas, documentos e evidências.",
      r.parceiros.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Instrutor</th><th>Qualificação</th><th>Trilha obrigatória</th><th>Acesso</th><th></th></tr></thead><tbody>
      ${r.parceiros.map(x => `<tr data-par="${x.id}"><td><b>${esc(x.nome)}</b><small>${esc(x.email)}</small></td><td>${esc(x.qualificacao || "—")}<small>${esc(x.registro || "")}</small></td><td>${trilhaPill(x.trilha)}</td><td>${x.trocar_senha ? `<span class="pill p-andamento">Primeiro acesso pendente</span>` : `<small>Último: ${esc(dataBR(x.ultimo_acesso) || "—")}</small>`}${x.ativo ? "" : ` <span class="pill p-fim">Inativo</span>`}</td><td><button class="btn btn-sec" type="button" data-reenv="${x.id}">Reenviar acesso</button></td></tr>`).join("")}
      </tbody></table></div><p class="aviso" id="pa-msg" hidden></p>` : `<p class="vazio">Nenhum parceiro cadastrado.</p>`);
    document.querySelectorAll("[data-reenv]").forEach(b => b.onclick = async ev => { ev.stopPropagation(); const res = await api("uni_portal_reenviar", { corpo: { tipo: "parceiro", id: +b.dataset.reenv } }); msg("pa-msg", res.ok ? "ok" : "erro", res.mensagem); });
    document.querySelectorAll("[data-par]").forEach(tr => tr.onclick = () => formParceiro(r.parceiros.find(x => String(x.id) === tr.dataset.par)));
  }
  const trilhaPill = t => { t = t || {}; return t.status === "aprovada" ? `<span class="pill p-ok">Aprovada${t.nota ? " · " + String(Number(t.nota).toFixed(2)).replace(".", ",") : ""}</span>` : t.status === "dispensada" ? `<span class="pill">Dispensada</span>` : t.status === "em_andamento" ? `<span class="pill p-andamento">Em andamento${t.progresso ? " · " + t.progresso.pct + "%" : ""}</span>` : `<span class="pill p-alerta">Pendente</span>`; };
  function formParceiro(x) {
    const novo = !x.id;
    const g = gaveta(`<div class="gaveta-cab"><div><p class="desc">${novo ? "Novo parceiro" : "Editar parceiro"}</p><h2>${novo ? "Instrutor" : esc(x.nome)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="form-grid">
        <div class="campo full"><label for="pa-nome">Nome completo</label><input id="pa-nome" value="${esc(x.nome || "")}"></div>
        <div class="campo"><label for="pa-email">E-mail (login)</label><input id="pa-email" type="email" value="${esc(x.email || "")}" ${novo ? "" : "disabled"}></div>
        <div class="campo"><label for="pa-cpf">CPF</label><input id="pa-cpf" value="${esc(x.cpf || "")}"></div>
        <div class="campo"><label for="pa-tel">Telefone</label><input id="pa-tel" value="${esc(x.telefone || "")}"></div>
        <div class="campo"><label for="pa-reg">Registro (MTE / CREA)</label><input id="pa-reg" value="${esc(x.registro || "")}" placeholder="Ex.: MTE 0012345/SP"></div>
        <div class="campo full"><label for="pa-qual">Qualificação</label><input id="pa-qual" value="${esc(x.qualificacao || "")}" placeholder="Ex.: Técnico de Segurança do Trabalho · Instrutor NR 35"></div>
        ${caixaMarcar("pa-ativo", "Parceiro ativo", x.ativo !== false)}
        ${st.usuario && st.usuario.perfil === "admin" ? caixaMarcar("pa-trilha", "Dispensar a trilha obrigatória (instrutor já capacitado pela LIPPMANN)", !!x.trilha_dispensada) : ""}
      </div>
      ${novo ? `<p class="desc">Ao cadastrar, o parceiro recebe o acesso por e-mail. Para criar e concluir turmas, ele precisa ser aprovado na <b>Trilha de Capacitação do Instrutor Parceiro</b> (curso interno da UniLTS), iniciada pelo próprio Painel do Parceiro.</p>` : `<p class="desc">Trilha obrigatória: ${trilhaPill(x.trilha)}</p>`}
      <p class="aviso" id="pa-m" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="pa-salvar">${novo ? "Cadastrar e enviar acesso" : "Salvar"}</button></div>`);
    g.querySelector("#pa-salvar").onclick = async ev => {
      ev.target.disabled = true;
      const res = await api("uni_parceiro_salvar", { corpo: { id: x.id, nome: $("pa-nome").value, email: $("pa-email").value, cpf: $("pa-cpf").value, telefone: $("pa-tel").value, registro: $("pa-reg").value, qualificacao: $("pa-qual").value, ativo: $("pa-ativo").checked ? 1 : 0, ...($("pa-trilha") ? { trilha_dispensada: $("pa-trilha").checked ? 1 : 0 } : {}) } });
      ev.target.disabled = false;
      if (!res.ok) return msg("pa-m", "erro", res.mensagem);
      fecharGaveta(); toast(res.mensagem); st.filtros.abaUni = "parceiros"; secUnilts();
    };
  }
  function uniTurmas(r) {
    const tot = r.turmas.reduce((a, t) => ({ m: a.m + t.contagem.total, ap: a.ap + t.contagem.aprovado, rp: a.rp + t.contagem.reprovado }), { m: 0, ap: 0, rp: 0 });
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="uni-nova">+ Nova turma</button>`;
    $("uni-nova").onclick = () => formTurma({});
    $("aba").innerHTML = `<div style="display:grid;gap:18px">
      <div class="grade">${kpi("Turmas abertas", r.turmas.filter(t => t.status === "aberta").length)}${kpi("Matrículas", tot.m)}${kpi("Aprovados", tot.ap)}${kpi("Taxa de aprovação", (tot.ap + tot.rp ? Math.round(tot.ap / (tot.ap + tot.rp) * 100) : 0) + "%")}</div>
      ${card("", "Turmas", `Numeração contínua e sequencial. Próximo código: <b>${codigoPrevisto(r.proximo)}</b>`, r.turmas.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Turma</th><th>Curso</th><th>Período</th><th>Matrículas</th><th>Aprovados</th><th>Situação</th></tr></thead><tbody>
        ${r.turmas.map(t => `<tr data-turma="${t.id}"><td><b class="uni-cod">${esc(t.codigo)}</b><small>${MOD_U[t.modalidade] || "EaD"} · ${t.empresa_id ? esc(nomeEmpresa(t.empresa_id)) : "Pessoa física (B2C)"}</small></td><td>${esc(t.curso)}${t.parceiro_id ? `<small>Instrutor: ${esc(nomeParceiro(t.parceiro_id))}</small>` : ""}</td><td class="nw">${dataCurta(t.inicio)} a ${dataCurta(t.fim)}</td><td>${t.contagem.total}</td><td>${t.contagem.aprovado}</td><td>${pillU(SIT_TUR, t.status)}</td></tr>`).join("")}
      </tbody></table></div>` : `<p class="vazio">Nenhuma turma ainda. Clique em <b>+ Nova turma</b>: a primeira receberá o código ${codigoPrevisto(r.proximo)}.</p>`)}
    </div>`;
    document.querySelectorAll("[data-turma]").forEach(tr => tr.onclick = () => abrirTurma(+tr.dataset.turma));
  }
  const dataCurta = d => d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR") : "—";
  const codigoPrevisto = (n, ano) => `T${String(n || 33).padStart(5, "0")}-E${ano || new Date().getFullYear()}`;

  function formTurma(t) {
    const novo = !t.id, cursos = (st.uni.cursos || []).filter(c => c.ativo !== false || c.id === t.curso_id);
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Nova turma" : "Editar turma"}</p><h2>${novo ? `<span id="tu-prev">${codigoPrevisto(st.uni.proximo)}</span>` : esc(t.codigo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      ${novo ? `<p class="aviso info">O código é gerado automaticamente na sequência (TXXXXX-EAAAA, onde AAAA é o ano de início) e não pode ser alterado depois.</p>` : ""}
      <div class="form-grid">
        <div class="campo full"><label for="tu-curso">Curso</label><select id="tu-curso" ${novo ? "" : "disabled"}>${cursos.map(c => `<option value="${esc(c.id)}"${c.id === t.curso_id ? " selected" : ""}>${esc(c.titulo)}</option>`).join("")}</select></div>
        <div class="campo"><label for="tu-mod">Modalidade</label><select id="tu-mod" ${novo ? "" : "disabled"}>${Object.entries(MOD_U).map(([k, v]) => `<option value="${k}"${(t.modalidade || "ead") === k ? " selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo"><label for="tu-emp">Empresa contratante (B2B)</label><select id="tu-emp"><option value="">— Pessoa física (B2C) —</option>${(st.uni.empresas || []).filter(e => e.ativo !== false || e.id === t.empresa_id).map(e => `<option value="${e.id}"${e.id === t.empresa_id ? " selected" : ""}>${esc(e.nome_fantasia || e.razao_social)}</option>`).join("")}</select></div>
        <div class="campo"><label for="tu-par">Instrutor parceiro (presencial/híbrida)</label><select id="tu-par"><option value="">— Nenhum —</option>${(st.uni.parceiros || []).filter(x => x.ativo !== false || x.id === t.parceiro_id).map(x => `<option value="${x.id}"${x.id === t.parceiro_id ? " selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></div>
        <div class="campo"><label for="tu-prazo">Prazo para concluir o EaD (dias corridos)</label><input id="tu-prazo" type="number" min="1" max="365" value="${esc(t.prazo_dias || 30)}"><small>Estourou, o progresso do aluno volta a 0% automaticamente.</small></div>
        <div class="campo"><label for="tu-inst">Instrutor da turma</label><input id="tu-inst" value="${esc(t.instrutor_nome || "")}" placeholder="Padrão: instrutor do curso"></div>
        <div class="campo"><label for="tu-ini">Início</label><input id="tu-ini" type="date" value="${esc(t.inicio || new Date().toISOString().slice(0, 10))}"></div>
        <div class="campo"><label for="tu-fim">Término</label><input id="tu-fim" type="date" value="${esc(t.fim || "")}"></div>
        <div class="campo full"><label for="tu-local">Local</label><input id="tu-local" value="${esc(t.local || "AVA UniLTS · lippmannts.com (EaD)")}"></div>
        <div class="campo full"><label for="tu-obs">Observações</label><textarea id="tu-obs" style="min-height:70px">${esc(t.observacoes || "")}</textarea></div>
        ${novo ? "" : `<div class="campo"><label for="tu-status">Situação</label><select id="tu-status">${Object.entries(SIT_TUR).map(([k, [r]]) => `<option value="${k}"${t.status === k ? " selected" : ""}>${r}</option>`).join("")}</select></div>`}
      </div>
      <p class="aviso erro" id="tu-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="tu-salvar">${novo ? "Criar turma" : "Salvar"}</button></div>`);
    const EAD_LOCAL = "AVA UniLTS · lippmannts.com (EaD)";
    if (novo) g.querySelector("#tu-mod").onchange = e => { const l = $("tu-local"); if (e.target.value !== "ead" && l.value === EAD_LOCAL) { l.value = ""; l.placeholder = "Endereço do treinamento presencial"; } if (e.target.value === "ead" && !l.value) l.value = EAD_LOCAL; };
    if (novo) g.querySelector("#tu-ini").oninput = e => { $("tu-prev").textContent = codigoPrevisto(st.uni.proximo, (e.target.value || "").slice(0, 4) || undefined); };
    g.querySelector("#tu-salvar").onclick = async e => {
      const d = { id: t.id, curso_id: $("tu-curso").value, modalidade: $("tu-mod").value, empresa_id: $("tu-emp").value, parceiro_id: $("tu-par").value, prazo_dias: $("tu-prazo").value, tipo: $("tu-emp").value ? "b2b" : "b2c", instrutor_nome: $("tu-inst").value, inicio: $("tu-ini").value, fim: $("tu-fim").value, local: $("tu-local").value, observacoes: $("tu-obs").value, status: novo ? undefined : $("tu-status").value };
      if (!d.curso_id) return msg("tu-msg", "erro", "Cadastre um curso em “Cursos EaD” antes de abrir a turma.");
      if (d.fim && d.inicio && d.fim < d.inicio) return msg("tu-msg", "erro", "O término deve ser depois do início.");
      e.target.disabled = true; const res = await api("uni_turma_salvar", { corpo: d }); e.target.disabled = false;
      if (!res.ok) return msg("tu-msg", "erro", res.mensagem);
      fecharGaveta(); toast(novo ? `Turma ${res.codigo} criada.` : "Turma atualizada."); await secUnilts(); abrirTurma(res.id);
    };
  }

  async function abrirTurma(id) {
    const r = await api("uni_turma", { query: "id=" + id }); if (!r.ok) return toast(r.mensagem);
    const t = r.turma, c = r.curso || {}, ms = r.matriculas.filter(m => m.status !== "cancelado");
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${esc(c.titulo || "")}</p><h2>${esc(t.codigo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="uni-resumo-turma">${pillU(SIT_TUR, t.status)}<span>${dataCurta(t.inicio)} a ${dataCurta(t.fim)}</span><span>${Number(c.carga_horaria || 0)} h</span><span>${ms.length} matrícula(s)</span><span>${ms.filter(m => m.status === "aprovado").length} aprovado(s)</span></div>
      ${t.empresa_id || t.parceiro_id ? `<p class="desc">${t.empresa_id && r.empresa ? `Empresa: <b>${esc(r.empresa.nome_fantasia || r.empresa.razao_social)}</b> (CNPJ ${esc(r.empresa.cnpj)}) · ` : ""}${r.parceiro ? `Instrutor parceiro: <b>${esc(r.parceiro.nome)}</b>` : ""}${t.concluida_parceiro ? ` · concluída pelo instrutor em ${esc(dataCurta(t.concluida_parceiro))}` : ""}</p>` : ""}
      ${t.modalidade !== "ead" ? `<div class="uni-evid">${Object.entries(r.documentos || {}).map(([k, rot]) => { const a = (r.arquivos || []).find(x => x.categoria === "documento" && x.tipo === k); return a && a.url ? `<a class="pill p-ok" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(rot)}</a>` : `<span class="pill p-alerta">${esc(rot)}</span>`; }).join("")}
        ${Object.entries(r.fotos || {}).map(([k, rot]) => { const a = (r.arquivos || []).find(x => x.categoria === "foto" && x.tipo === k); return a && a.url ? `<a class="uni-foto" href="${esc(a.url)}" target="_blank" rel="noopener" title="${esc(a.legenda || rot)}"><img src="${esc(a.url)}" alt="${esc(rot)}"></a>` : `<span class="uni-foto vazia" title="${esc(rot)}">${esc(rot.slice(0, 2))}</span>`; }).join("")}</div>` : ""}
      <div class="linha-acoes">
        <a class="btn btn-primario" href="/integra/relatorio.html?turma=${t.id}" target="_blank" rel="noopener">${IC.baixar} Relatório FR-DOC-18</a>
        <button class="btn btn-sec" type="button" id="tu-editar">Editar turma</button>
      </div>
      ${t.status === "aberta" ? `<details class="uni-matricular" ${ms.length ? "" : "open"}><summary>+ Matricular aluno</summary>
        <div class="form-grid" style="margin-top:12px">
          <div class="campo full"><label for="ma-nome">Nome completo (como sairá no certificado)</label><input id="ma-nome" autocomplete="off"></div>
          <div class="campo"><label for="ma-cpf">CPF</label><input id="ma-cpf" inputmode="numeric" placeholder="000.000.000-00"></div>
          <div class="campo"><label for="ma-email">E-mail</label><input id="ma-email" type="email"></div>
          <div class="campo"><label for="ma-tel">Celular / WhatsApp</label><input id="ma-tel" inputmode="tel"></div>
          <div class="campo"><label for="ma-emp">Empresa (opcional)</label><input id="ma-emp"></div>
        </div>
        <p class="desc" style="margin-top:8px">O aluno recebe por e-mail o endereço de acesso e uma senha provisória aleatória, que deve ser trocada no primeiro login.</p>
        <p class="aviso" id="ma-msg" hidden></p>
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="ma-salvar">Matricular e enviar acesso</button></div>
      </details>` : ""}
      <div class="uni-alunos-turma">${ms.length ? ms.map(m => `
        <div class="uni-mat" data-mat="${m.id}">
          <div class="uni-mat-cab"><div><b>${esc(m.aluno.nome)}</b><small>${esc(m.aluno.email)} · CPF ${esc(m.aluno.cpf)}${m.aluno.empresa ? " · " + esc(m.aluno.empresa) : ""}</small></div>${pillU(SIT_MAT, m.status)}</div>
          ${m.acesso_revogado ? `<p class="aviso atencao" style="margin:0">Acesso revogado em ${esc(dataCurta(m.acesso_revogado))} (12 meses após o encerramento da turma).${r.superadmin ? "" : " Somente o superadministrador pode reabilitar."}</p>` : ""}
          <div class="uni-mat-dados">${t.modalidade === "presencial" ? `<span>Teórica ${notaBR(m.nota_teorica)} · Prática ${notaBR(m.nota_pratica)}</span><span>Entrada ${esc(dataBR(m.presenca_entrada) || "—")} · Saída ${esc(dataBR(m.presenca_saida) || "—")}</span>` : `<span>${barraU(m.progresso.pct)} ${m.progresso.pct}% das aulas</span><span>Tentativas ${m.tentativas}/${m.tentativas_max}</span>${m.dias_restantes !== null && m.dias_restantes !== undefined ? `<span class="${m.dias_restantes <= 5 ? "uni-alerta" : ""}">Prazo: ${m.dias_restantes} dia(s)</span>` : ""}${m.resets ? `<span class="uni-alerta">Progresso zerado ${m.resets}× por prazo</span>` : ""}${t.modalidade === "hibrido" ? `<span>Prática ${notaBR(m.nota_pratica)}</span>` : ""}`}<span>Nota ${notaBR(m.nota)}</span>${m.aluno.primeiro_acesso_pendente ? `<span class="pill p-andamento">Primeiro acesso pendente</span>` : `<span>Último acesso ${esc(dataBR(m.aluno.ultimo_acesso) || "—")}</span>`}</div>
          <div class="uni-mat-acoes">
            ${m.certificado ? `<a class="btn btn-sec" href="/unilts/certificado.html?c=${encodeURIComponent(m.certificado)}" target="_blank" rel="noopener">Certificado</a>` : ""}
            ${m.acesso_revogado && r.superadmin ? `<button class="btn btn-primario" type="button" data-acao="reabilitar">Reabilitar acesso</button>` : ""}
            ${m.aluno.email ? `<button class="btn btn-sec" type="button" data-acao="reenviar" data-aluno="${m.aluno.id}">Reenviar acesso</button>` : ""}
            ${m.status !== "aprovado" && m.tentativas > 0 ? `<button class="btn btn-sec" type="button" data-acao="tentativa">Liberar nova tentativa</button>` : ""}
            ${m.status !== "aprovado" ? `<button class="btn btn-perigo" type="button" data-acao="cancelar">Cancelar matrícula</button>` : ""}
          </div>
        </div>`).join("") : `<p class="vazio">Nenhum aluno matriculado.</p>`}</div>`);
    g.querySelector(".gaveta").classList.add("gaveta-larga");
    g.querySelector("#tu-editar").onclick = () => formTurma(t);
    const cpf = g.querySelector("#ma-cpf");
    if (cpf) cpf.oninput = () => { const d = cpf.value.replace(/\D/g, "").slice(0, 11); cpf.value = d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); };
    const bt = g.querySelector("#ma-salvar");
    if (bt) bt.onclick = async () => {
      bt.disabled = true;
      const res = await api("uni_matricular", { corpo: { turma_id: t.id, nome: $("ma-nome").value.trim(), cpf: $("ma-cpf").value, email: $("ma-email").value.trim(), telefone: $("ma-tel").value, empresa: $("ma-emp").value } });
      bt.disabled = false;
      if (!res.ok) return msg("ma-msg", "erro", res.mensagem);
      toast("Aluno matriculado."); await abrirTurma(t.id); msg("ma-msg", "ok", res.mensagem);
      const d = document.querySelector(".uni-matricular"); if (d) d.open = true;
    };
    g.querySelectorAll("[data-acao]").forEach(b => b.onclick = async () => {
      const mid = +b.closest("[data-mat]").dataset.mat, ac = b.dataset.acao;
      if (ac === "cancelar" && !b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Clique de novo para confirmar"; return; }
      const res = ac === "reenviar" ? await api("uni_reenviar_acesso", { corpo: { aluno_id: +b.dataset.aluno } })
        : ac === "tentativa" ? await api("uni_nova_tentativa", { corpo: { id: mid } }) : ac === "reabilitar" ? await api("uni_reabilitar", { corpo: { id: mid } }) : await api("uni_matricula_cancelar", { corpo: { id: mid } });
      if (!res.ok) return toast(res.mensagem);
      await abrirTurma(t.id);
      if (res.mensagem) { const m = document.createElement("p"); m.className = "aviso ok"; m.textContent = res.mensagem; document.querySelector(".uni-resumo-turma").after(m); }
      secUniltsSilencioso();
    });
  }
  async function secUniltsSilencioso() { const r = await api("uni_resumo"); if (r.ok) st.uni = r; }

  /* ---------- cursos ---------- */
  function uniCursos(r) {
    $("acoes-topo").innerHTML = `<button class="btn btn-primario" type="button" id="uc-novo">+ Novo curso</button>`;
    $("uc-novo").onclick = () => editarCursoUni({ modulos: [{ titulo: "Módulo 1", aulas: [{ titulo: "Aula 1" }] }], avaliacao: [], nota_corte: 7, tentativas_max: 3, carga_horaria: 4, ativo: true });
    $("aba").innerHTML = card("", "Cursos EaD", "Conteúdo exibido na Área do Aluno: plano de ensino, mapa mental, aulas (YouTube), avaliação e dados do certificado.",
      `<div class="tabela-box"><table class="t"><thead><tr><th>Curso</th><th>Carga horária</th><th>Aulas</th><th>Questões</th><th>Nota mínima</th><th>Situação</th></tr></thead><tbody>
      ${r.cursos.map(c => `<tr data-uc="${esc(c.id)}"><td><b>${esc(c.titulo)}</b><small>${esc(c.nr || "")}</small></td><td>${Number(c.carga_horaria)} h</td><td>${(c.modulos || []).reduce((a, m) => a + (m.aulas || []).length, 0)}</td><td>${(c.avaliacao || []).length}</td><td>${notaBR(c.nota_corte)}</td><td>${c.ativo === false ? `<span class="pill p-fim">Inativo</span>` : `<span class="pill p-ok">Ativo</span>`}</td></tr>`).join("") || `<tr><td colspan="6" class="vazio">Nenhum curso.</td></tr>`}
      </tbody></table></div>`);
    document.querySelectorAll("[data-uc]").forEach(tr => tr.onclick = () => editarCursoUni(JSON.parse(JSON.stringify(r.cursos.find(c => c.id === tr.dataset.uc)))));
  }
  function editarCursoUni(c) {
    const novo = !c.id;
    const g = gaveta(`
      <div class="gaveta-cab"><div><p class="desc">${novo ? "Novo curso EaD" : "Editar curso EaD"}</p><h2>${novo ? "Curso" : esc(c.titulo)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <div class="abas uni-abas-curso" role="tablist">${[["g", "Dados"], ["p", "Plano de ensino"], ["a", "Aulas"], ["q", "Avaliação"], ["c", "Certificado"]].map(([k, r], i) => `<button type="button" role="tab" data-pg="${k}" aria-selected="${i === 0}">${r}</button>`).join("")}</div>
      <div data-pagina="g" class="form-grid">
        <div class="campo full"><label for="uc-titulo">Título do curso</label><input id="uc-titulo" value="${esc(c.titulo || "")}"></div>
        <div class="campo"><label for="uc-nr">Sigla (ex.: NR 01)</label><input id="uc-nr" value="${esc(c.nr || "")}"></div>
        <div class="campo"><label for="uc-ch">Carga horária (horas)</label><input id="uc-ch" inputmode="decimal" value="${esc(String(c.carga_horaria ?? ""))}"></div>
        <div class="campo full"><label for="uc-norma">Referência normativa</label><input id="uc-norma" value="${esc(c.norma || "")}"></div>
        <div class="campo full"><label for="uc-resumo">Resumo (página UniLTS e Área do Aluno)</label><textarea id="uc-resumo" style="min-height:70px">${esc(c.resumo || "")}</textarea></div>
        ${campoImagem("uc-img", "Imagem do curso", c.imagem, "")}
        <div class="campo full"><label>Mapa mental (PDF ou imagem, para baixar e imprimir)</label><div style="display:grid;gap:8px"><input id="uc-mapa" value="${esc(c.mapa_mental || "")}" placeholder="Endereço do arquivo"><label class="btn btn-sec" style="cursor:pointer;justify-self:start">Enviar mapa mental<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" id="uc-mapa-arq" hidden></label></div></div>
        <div class="campo"><label for="uc-preco">Preço para pessoa física (R$)</label><input id="uc-preco" inputmode="decimal" value="${c.preco ? String(Number(c.preco).toFixed(2)).replace(".", ",") : ""}" placeholder="0,00"><small>Deixe 0 para cursos sem venda on-line.</small></div>
        ${caixaMarcar("uc-venda", "Vender on-line na página UniLTS (PIX e cartão via Mercado Pago)", !!c.venda_online)}
        ${caixaMarcar("uc-ativo", "Curso ativo (aparece na página UniLTS e pode receber turmas)", c.ativo !== false)}
      </div>
      <div data-pagina="p" hidden>
        <div class="campo"><label>Plano de ensino (projeto pedagógico)</label>${editorRico("uc-plano", c.plano_ensino || "")}</div>
        <div class="campo" style="margin-top:14px"><label for="uc-cp">Conteúdo programático (um item por linha · sai no verso do certificado)</label><textarea id="uc-cp" style="min-height:160px">${esc((c.conteudo_programatico || []).join("\n"))}</textarea></div>
      </div>
      <div data-pagina="a" hidden><div id="uc-modulos" class="uni-modulos"></div><div class="linha-acoes"><button class="btn btn-sec" type="button" id="uc-add-mod">+ Módulo</button></div></div>
      <div data-pagina="q" hidden>
        <div class="form-grid">
          <div class="campo"><label for="uc-nota">Nota mínima para aprovação (0 a 10)</label><input id="uc-nota" inputmode="decimal" value="${esc(String(c.nota_corte ?? 7).replace(".", ","))}"></div>
          <div class="campo"><label for="uc-tent">Limite de tentativas</label><input id="uc-tent" type="number" min="1" max="10" value="${esc(c.tentativas_max ?? 3)}"></div>
        </div>
        <p class="desc" style="margin:10px 0">Marque a bolinha da alternativa correta de cada questão. A nota é calculada automaticamente (acertos ÷ total × 10).</p>
        <div id="uc-questoes" class="uni-questoes"></div>
        <div class="linha-acoes"><button class="btn btn-sec" type="button" id="uc-add-q">+ Questão</button></div>
      </div>
      <div data-pagina="c" hidden class="form-grid">
        <div class="campo"><label for="uc-val">Validade do certificado (meses · 0 = indeterminada)</label><input id="uc-val" type="number" min="0" value="${esc(c.validade_meses ?? 0)}"></div>
        <div class="campo"><label for="uc-mod">Modalidade</label><input id="uc-mod" value="${esc(c.modalidade || "EaD (ensino a distância)")}"></div>
        <div class="campo"><label for="uc-in">Instrutor</label><input id="uc-in" value="${esc(c.instrutor_nome || "")}"></div>
        <div class="campo"><label for="uc-iq">Qualificação do instrutor</label><input id="uc-iq" value="${esc(c.instrutor_qualificacao || "")}"></div>
        ${campoImagem("uc-ia", "Assinatura do instrutor (imagem PNG com fundo transparente)", c.instrutor_assinatura, "")}
        <div class="campo"><label for="uc-rn">Responsável técnico</label><input id="uc-rn" value="${esc(c.rt_nome || "")}"></div>
        <div class="campo"><label for="uc-rq">Qualificação / registro do RT</label><input id="uc-rq" value="${esc(c.rt_qualificacao || "")}"></div>
        ${campoImagem("uc-ra", "Assinatura do responsável técnico (imagem PNG)", c.rt_assinatura, "Exigida pela NR 01 no certificado.")}
      </div>
      <p class="aviso erro" id="uc-msg" hidden></p>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="uc-salvar">Salvar curso</button>${novo ? "" : `<button class="btn btn-perigo" type="button" id="uc-excluir">Excluir</button>`}</div>`);
    g.querySelector(".gaveta").classList.add("gaveta-larga");
    g.querySelector(".uni-abas-curso").onclick = e => { const b = e.target.closest("[data-pg]"); if (!b) return; g.querySelectorAll("[data-pg]").forEach(x => x.setAttribute("aria-selected", x === b)); g.querySelectorAll("[data-pagina]").forEach(p => p.hidden = p.dataset.pagina !== b.dataset.pg); };
    ligarImagens(g, "unilts");
    const plano = ligarEditor(g, "uc-plano", "unilts");
    g.querySelector("#uc-mapa-arq").onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { toast("Enviando…"); $("uc-mapa").value = await enviarPublico(f.type.startsWith("image/") ? await reduzirImagem(f, 2400) : f, "unilts"); toast("Mapa mental enviado."); } catch (e) { toast(e.message); } };

    /* módulos e aulas */
    const editores = {};
    let seqEd = 0;
    function desenharModulos() {
      const box = g.querySelector("#uc-modulos");
      box.innerHTML = (c.modulos || []).map((m, i) => `<section class="uni-modulo" data-mod="${i}">
        <div class="uni-modulo-cab"><span class="uni-num">${i + 1}</span><input class="m-tit" value="${esc(m.titulo || "")}" aria-label="Título do módulo ${i + 1}"><button type="button" class="btn btn-sec" data-x="sobe" ${i ? "" : "disabled"} title="Mover para cima">↑</button><button type="button" class="btn btn-perigo" data-x="tira-mod" title="Remover módulo">✕</button></div>
        ${(m.aulas || []).map((a, j) => { const ed = a._ed || (a._ed = "ed" + (++seqEd)); return `<details class="uni-aula" data-aula="${j}"><summary><span>${esc(a.titulo || "Nova aula")}</span><small>${a.youtube ? "▶ vídeo" : "sem vídeo"}</small></summary>
          <div class="form-grid" style="margin-top:10px">
            <div class="campo full"><label>Título da aula</label><input class="a-tit" value="${esc(a.titulo || "")}"></div>
            <div class="campo"><label>Duração</label><input class="a-dur" value="${esc(a.duracao || "")}" placeholder="30 min"></div>
            <div class="campo"><label>Vídeo do YouTube</label><input class="a-yt" value="${esc(a.youtube ? "https://youtu.be/" + a.youtube : "")}" placeholder="https://youtu.be/…"></div>
            <div class="campo full"><label>Texto de apoio</label>${editorRico(ed, a.texto || "")}</div>
          </div>
          <div class="linha-acoes"><button type="button" class="btn btn-perigo" data-x="tira-aula">Remover aula</button></div></details>`; }).join("")}
        <button type="button" class="btn btn-sec" data-x="add-aula">+ Aula</button></section>`).join("");
      box.querySelectorAll(".uni-aula").forEach(d => { const id = d.querySelector(".rico-area").id; editores[id] = ligarEditor(d, id, "unilts"); });
    }
    function lerModulos() {
      g.querySelectorAll(".uni-modulo").forEach(sec => {
        const m = c.modulos[+sec.dataset.mod]; m.titulo = sec.querySelector(".m-tit").value;
        sec.querySelectorAll(".uni-aula").forEach(d => { const a = m.aulas[+d.dataset.aula]; a.titulo = d.querySelector(".a-tit").value; a.duracao = d.querySelector(".a-dur").value; a.youtube = d.querySelector(".a-yt").value; const id = d.querySelector(".rico-area").id; a.texto = editores[id] ? editores[id]() : a.texto; });
      });
    }
    g.querySelector("#uc-modulos").addEventListener("click", e => {
      const b = e.target.closest("[data-x]"); if (!b) return; lerModulos();
      const i = +b.closest("[data-mod]").dataset.mod, x = b.dataset.x;
      if (x === "add-aula") c.modulos[i].aulas.push({ titulo: `Aula ${c.modulos[i].aulas.length + 1}` });
      if (x === "tira-aula") c.modulos[i].aulas.splice(+b.closest("[data-aula]").dataset.aula, 1);
      if (x === "tira-mod") { if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Confirmar"; return; } c.modulos.splice(i, 1); }
      if (x === "sobe" && i) [c.modulos[i - 1], c.modulos[i]] = [c.modulos[i], c.modulos[i - 1]];
      desenharModulos();
      if (x === "add-aula") { const ds = g.querySelectorAll(`[data-mod="${i}"] .uni-aula`); ds[ds.length - 1].open = true; }
    });
    g.querySelector("#uc-add-mod").onclick = () => { lerModulos(); c.modulos = c.modulos || []; c.modulos.push({ titulo: `Módulo ${c.modulos.length + 1}`, aulas: [{ titulo: "Aula 1" }] }); desenharModulos(); };
    desenharModulos();

    /* avaliação */
    function desenharQuestoes() {
      g.querySelector("#uc-questoes").innerHTML = (c.avaliacao || []).map((q, i) => `<fieldset class="uni-questao" data-q="${i}"><legend>Questão ${i + 1}</legend>
        <textarea class="q-perg" aria-label="Enunciado da questão ${i + 1}" placeholder="Enunciado">${esc(q.pergunta || "")}</textarea>
        ${(q.alternativas || []).map((alt, j) => `<label class="uni-alt"><input type="radio" name="corr${i}" value="${j}" ${+q.correta === j ? "checked" : ""} title="Alternativa correta"><span>${"ABCDEF"[j]}</span><input class="q-alt" value="${esc(alt)}" placeholder="Alternativa ${"ABCDEF"[j]}"></label>`).join("")}
        <div class="linha-acoes">${(q.alternativas || []).length < 6 ? `<button type="button" class="btn btn-sec" data-y="add-alt">+ Alternativa</button>` : ""}${(q.alternativas || []).length > 2 ? `<button type="button" class="btn btn-sec" data-y="tira-alt">− Alternativa</button>` : ""}<button type="button" class="btn btn-perigo" data-y="tira-q">Remover questão</button></div></fieldset>`).join("") || `<p class="vazio">Nenhuma questão cadastrada.</p>`;
    }
    function lerQuestoes() {
      g.querySelectorAll(".uni-questao").forEach(f => { const q = c.avaliacao[+f.dataset.q]; q.pergunta = f.querySelector(".q-perg").value; q.alternativas = [...f.querySelectorAll(".q-alt")].map(x => x.value); const k = f.querySelector("input[type=radio]:checked"); q.correta = k ? +k.value : 0; });
    }
    g.querySelector("#uc-questoes").addEventListener("click", e => {
      const b = e.target.closest("[data-y]"); if (!b) return; lerQuestoes();
      const i = +b.closest("[data-q]").dataset.q, q = c.avaliacao[i];
      if (b.dataset.y === "add-alt") q.alternativas.push("");
      if (b.dataset.y === "tira-alt") { q.alternativas.pop(); if (q.correta >= q.alternativas.length) q.correta = 0; }
      if (b.dataset.y === "tira-q") c.avaliacao.splice(i, 1);
      desenharQuestoes();
    });
    g.querySelector("#uc-add-q").onclick = () => { lerQuestoes(); c.avaliacao = c.avaliacao || []; c.avaliacao.push({ pergunta: "", alternativas: ["", "", "", ""], correta: 0 }); desenharQuestoes(); const qs = g.querySelectorAll(".q-perg"); qs[qs.length - 1].focus(); };
    desenharQuestoes();

    g.querySelector("#uc-salvar").onclick = async e => {
      lerModulos(); lerQuestoes();
      const d = { id: c.id, titulo: $("uc-titulo").value.trim(), nr: $("uc-nr").value, carga_horaria: $("uc-ch").value, norma: $("uc-norma").value, resumo: $("uc-resumo").value, imagem: $("uc-img").value.trim(), mapa_mental: $("uc-mapa").value.trim(), ativo: $("uc-ativo").checked ? 1 : 0, preco: $("uc-preco").value, venda_online: $("uc-venda").checked ? 1 : 0,
        plano_ensino: plano(), conteudo_programatico: $("uc-cp").value, nota_corte: $("uc-nota").value, tentativas_max: $("uc-tent").value, validade_meses: $("uc-val").value, modalidade: $("uc-mod").value,
        instrutor_nome: $("uc-in").value, instrutor_qualificacao: $("uc-iq").value, instrutor_assinatura: $("uc-ia").value.trim(), rt_nome: $("uc-rn").value, rt_qualificacao: $("uc-rq").value, rt_assinatura: $("uc-ra").value.trim(),
        modulos: (c.modulos || []).map(m => ({ titulo: m.titulo, aulas: (m.aulas || []).map(a => ({ id: a.id, titulo: a.titulo, duracao: a.duracao, youtube: a.youtube, texto: a.texto })) })),
        avaliacao: (c.avaliacao || []).map(q => ({ pergunta: q.pergunta, alternativas: q.alternativas, correta: q.correta })) };
      if (!d.titulo) return msg("uc-msg", "erro", "Informe o título do curso (aba Dados).");
      if (!d.modulos.some(m => m.aulas.length)) return msg("uc-msg", "erro", "Cadastre ao menos uma aula (aba Aulas).");
      const incompleta = d.avaliacao.findIndex(q => !q.pergunta.trim() || q.alternativas.filter(x => x.trim()).length < 2 || !String(q.alternativas[q.correta] || "").trim());
      if (incompleta >= 0) return msg("uc-msg", "erro", `Questão ${incompleta + 1}: preencha o enunciado, ao menos duas alternativas e marque a correta (aba Avaliação).`);
      if (!d.avaliacao.length) return msg("uc-msg", "erro", "Cadastre as questões da avaliação (aba Avaliação).");
      e.target.disabled = true; const res = await api("uni_curso_salvar", { corpo: d }); e.target.disabled = false;
      if (!res.ok) return msg("uc-msg", "erro", res.mensagem);
      fecharGaveta(); toast("Curso salvo."); st.filtros.abaUni = "cursos"; secUnilts();
    };
    confirmarExclusao(g, "#uc-excluir", async () => { const res = await api("uni_curso_excluir", { corpo: { id: c.id } }); if (res.ok) { fecharGaveta(); toast("Curso excluído."); secUnilts(); } else msg("uc-msg", "erro", res.mensagem); });
  }

  /* ---------- alunos ---------- */
  async function uniAlunos() {
    $("acoes-topo").innerHTML = "";
    const r = await api("uni_alunos"); if (!r.ok) return msgAba(r);
    $("aba").innerHTML = card("", "Alunos", "Cadastrados automaticamente ao matricular em uma turma. Os dados pessoais são tratados conforme a LGPD.",
      r.alunos.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Aluno</th><th>CPF</th><th>Matrículas</th><th>Acesso</th><th></th></tr></thead><tbody>
      ${r.alunos.map(a => `<tr><td><b>${esc(a.nome)}</b><small>${esc(a.email)}${a.empresa ? " · " + esc(a.empresa) : ""}</small></td><td class="nw">${esc(a.cpf)}</td><td>${a.matriculas}</td><td>${a.trocar_senha ? `<span class="pill p-andamento">Primeiro acesso pendente</span>` : `<small>Último: ${esc(dataBR(a.ultimo_acesso) || "—")}</small>`}</td><td><button class="btn btn-sec" type="button" data-reenviar="${a.id}">Reenviar acesso</button></td></tr>`).join("")}
      </tbody></table></div><p class="aviso" id="al-msg" hidden></p>` : `<p class="vazio">Nenhum aluno cadastrado.</p>`);
    document.querySelectorAll("[data-reenviar]").forEach(b => b.onclick = async e => { e.stopPropagation(); const res = await api("uni_reenviar_acesso", { corpo: { aluno_id: +b.dataset.reenviar } }); msg("al-msg", res.ok ? "ok" : "erro", res.mensagem); });
  }
  function uniNumeracao(r) {
    $("acoes-topo").innerHTML = "";
    const maior = Math.max(0, ...r.turmas.map(t => t.numero));
    $("aba").innerHTML = card("", "Numeração das turmas", "Formato TXXXXX-EAAAA: número contínuo e sequencial (não reinicia na virada do ano) + ano de início da turma.", `
      <p style="font-size:1.05rem">Próxima turma: <b class="uni-cod">${codigoPrevisto(r.proximo)}</b></p>
      <p class="desc">Última turma criada: ${maior ? codigoPrevisto(maior) : "nenhuma"}. Os números nunca se repetem e não ficam lacunas: se a criação falhar, o número não é consumido.</p>
      ${admin() ? `<div class="form-grid" style="max-width:520px;margin-top:12px"><div class="campo"><label for="nu-prox">Ajustar próximo número</label><input id="nu-prox" type="number" min="${maior + 1}" value="${r.proximo}"></div></div>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="nu-salvar">Salvar</button></div><p id="nu-msg" hidden></p>
      <p class="desc">Só é possível avançar a numeração (por exemplo, para continuar uma sequência usada fora do sistema).</p>` : `<p class="aviso info">Somente o superadministrador pode ajustar a numeração.</p>`}`);
    const b = $("nu-salvar");
    if (b) b.onclick = async () => { const res = await api("uni_ajustar_numero", { corpo: { proximo: +$("nu-prox").value } }); msg("nu-msg", res.ok ? "ok" : "erro", res.ok ? "Numeração ajustada." : res.mensagem); if (res.ok) setTimeout(secUnilts, 600); };
  }

  /* ================= Financeiro e BI ================= */
  const brl = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const CAT_DESP = ["Pró-labore e salários", "Encargos e benefícios", "Instrutores parceiros", "Impostos e tributos", "Aluguel e estrutura", "Marketing e publicidade", "Software e sistemas", "Materiais, EPIs e equipamentos", "Deslocamento e hospedagem", "Taxas bancárias e de pagamento", "Contabilidade e jurídico", "Outros"];
  const CAT_REC = ["Contrato B2B / in company", "Consultoria e soluções técnicas", "Turma presencial avulsa", "Outras receitas"];
  const SIT_PED = { pendente: ["Pendente", "p-andamento"], aprovado: ["Aprovado", "p-ok"], recusado: ["Recusado", "p-alerta"], estornado: ["Estornado", "p-alerta"], cancelado: ["Cancelado", "p-fim"], expirado: ["Expirado", "p-fim"] };
  const CORES = ["#0A3490", "#1F55C9", "#9DB8F2", "#003376", "#5B7FD6", "#C5D3F5", "#2E6BE6", "#7F9BD9"];
  const mesDe = d => String(d || "").slice(0, 7);
  const rotMes = m => { const [a, b] = m.split("-"); return ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+b - 1] + "/" + a.slice(2); };
  function periodoFin(preset) {
    const h = new Date(), iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const ini = { mes: new Date(h.getFullYear(), h.getMonth(), 1), mes_ant: new Date(h.getFullYear(), h.getMonth() - 1, 1), m3: new Date(h.getFullYear(), h.getMonth() - 2, 1), m6: new Date(h.getFullYear(), h.getMonth() - 5, 1), m12: new Date(h.getFullYear(), h.getMonth() - 11, 1), ano: new Date(h.getFullYear(), 0, 1) }[preset];
    const fim = preset === "mes_ant" ? new Date(h.getFullYear(), h.getMonth(), 0) : h;
    return ini ? { inicio: iso(ini), fim: iso(fim) } : null;
  }
  /* todos os números do BI saem daqui, a partir dos pedidos, lançamentos e aprovações do período */
  function calcularFin(d) {
    const cursos = Object.fromEntries((d.cursos || []).map(c => [c.id, c]));
    const dataPed = p => p.pago_em || p.criado;
    const vendidos = d.pedidos.filter(p => ["aprovado", "estornado"].includes(p.status));
    const aprov = d.pedidos.filter(p => p.status === "aprovado"), estorn = d.pedidos.filter(p => p.status === "estornado");
    const rec = d.lancamentos.filter(l => l.tipo === "receita"), desp = d.lancamentos.filter(l => l.tipo === "despesa");
    const soma = (l, f = x => x.valor) => l.reduce((s, x) => s + Number(f(x) || 0), 0);
    const vendasBrutas = soma(vendidos), outrasReceitas = soma(rec), bruto = vendasBrutas + outrasReceitas;
    const estornos = soma(estorn), taxas = soma(vendidos, p => p.taxa), despesas = soma(desp);
    const liquidaVendas = vendasBrutas - estornos - taxas, receitaLiquida = liquidaVendas + outrasReceitas, lucro = receitaLiquida - despesas;
    const provisao = Math.max(0, lucro) * 0.10;
    const horas = d.aprovacoes.reduce((s, a) => s + Number((cursos[a.curso_id] || {}).carga_horaria || 0), 0);
    const meses = []; for (let x = new Date(d.inicio + "T12:00:00"); mesDe(x.toISOString()) <= mesDe(d.fim); x.setMonth(x.getMonth() + 1, 1)) meses.push(mesDe(x.toISOString()));
    const porMes = Object.fromEntries(meses.map(m => [m, { bruto: 0, estornos: 0, taxas: 0, despesas: 0, receitas: 0, horas: 0, vendas: 0 }]));
    vendidos.forEach(p => { const m = porMes[mesDe(dataPed(p))]; if (m) { m.bruto += +p.valor; m.taxas += +p.taxa || 0; m.vendas++; } });
    estorn.forEach(p => { const m = porMes[mesDe(p.estornado_em || dataPed(p))]; if (m) m.estornos += +p.valor; });
    rec.forEach(l => { const m = porMes[mesDe(l.data)]; if (m) { m.bruto += +l.valor; m.receitas += +l.valor; } });
    desp.forEach(l => { const m = porMes[mesDe(l.data)]; if (m) m.despesas += +l.valor; });
    d.aprovacoes.forEach(a => { const m = porMes[mesDe(a.data)]; if (m) m.horas += Number((cursos[a.curso_id] || {}).carga_horaria || 0); });
    meses.forEach(k => { const m = porMes[k]; m.lucro = m.bruto - m.estornos - m.taxas - m.despesas; m.provisao = Math.max(0, m.lucro) * 0.10; });
    const rank = {}; aprov.forEach(p => { const r = rank[p.curso_id] = rank[p.curso_id] || { qtd: 0, valor: 0 }; r.qtd++; r.valor += +p.valor; });
    const metodos = { pix: { qtd: 0, valor: 0 }, cartao: { qtd: 0, valor: 0 } }; aprov.forEach(p => { metodos[p.metodo].qtd++; metodos[p.metodo].valor += +p.valor; });
    const cats = {}; desp.forEach(l => cats[l.categoria] = (cats[l.categoria] || 0) + +l.valor);
    return { cursos, bruto, vendasBrutas, outrasReceitas, estornos, taxas, receitaLiquida, despesas, lucro, provisao, horas, aprovados: d.aprovacoes.length,
      ticket: aprov.length ? soma(aprov) / aprov.length : 0, nAprov: aprov.length, nEstorn: estorn.length, meses, porMes,
      ranking: Object.entries(rank).sort((a, b) => b[1].qtd - a[1].qtd || b[1].valor - a[1].valor), metodos, cats: Object.entries(cats).sort((a, b) => b[1] - a[1]) };
  }
  async function secFinanceiro() {
    const abas = [["bi", "BI & Analytics"], ["pedidos", "Pedidos e estornos"], ["lancamentos", "Despesas e receitas"]];
    const atual = abas.some(a => a[0] === st.filtros.abaFin) ? st.filtros.abaFin : "bi";
    if (!st.fin) st.fin = { preset: "m6", ...periodoFin("m6") };
    $("acoes-topo").innerHTML = `<div class="fin-periodo">
      <select id="fp-preset" aria-label="Período">${[["mes", "Mês atual"], ["mes_ant", "Mês anterior"], ["m3", "Últimos 3 meses"], ["m6", "Últimos 6 meses"], ["m12", "Últimos 12 meses"], ["ano", "Ano atual"], ["pers", "Personalizado"]].map(([k, v]) => `<option value="${k}"${st.fin.preset === k ? " selected" : ""}>${v}</option>`).join("")}</select>
      <input type="date" id="fp-ini" value="${st.fin.inicio}" aria-label="Data inicial"><input type="date" id="fp-fim" value="${st.fin.fim}" aria-label="Data final"></div>`;
    $("fp-preset").onchange = e => { const p = periodoFin(e.target.value); st.fin.preset = e.target.value; if (p) Object.assign(st.fin, p); secFinanceiro(); };
    ["fp-ini", "fp-fim"].forEach(id => $(id).onchange = () => { st.fin = { preset: "pers", inicio: $("fp-ini").value, fim: $("fp-fim").value }; secFinanceiro(); });
    $("conteudo").innerHTML = `<div style="display:grid;gap:18px"><div class="abas" role="tablist">${abas.map(([k, r]) => `<button type="button" role="tab" data-aba="${k}" aria-selected="${k === atual}">${r}</button>`).join("")}</div><div id="aba"><p class="vazio">Carregando…</p></div></div>`;
    $("conteudo").querySelector(".abas").onclick = e => { const b = e.target.closest("[data-aba]"); if (b) { st.filtros.abaFin = b.dataset.aba; secFinanceiro(); } };
    const r = await api("fin_dados", { query: `inicio=${st.fin.inicio}&fim=${st.fin.fim}` }); if (!r.ok) return msgAba(r);
    st.finDados = r;
    ({ bi: finBI, pedidos: finPedidos, lancamentos: finLancamentos })[atual](r, calcularFin(r));
  }
  function finBI(d, c) {
    const amb = { simulacao: "Simulação (sem cobrança)", sandbox: "Sandbox Mercado Pago (teste)", producao: "Produção" }[d.ambiente] || d.ambiente;
    $("aba").innerHTML = `<div style="display:grid;gap:18px">
      <p class="desc">Período: <b>${dataCurta(d.inicio)} a ${dataCurta(d.fim)}</b> · Pagamentos: <span class="pill ${d.ambiente === "producao" ? "p-ok" : "p-andamento"}">${amb}</span></p>
      <div class="grade fin-kpis">
        ${kpi("Faturamento bruto consolidado", brl(c.bruto))}${kpi("Receita líquida", brl(c.receitaLiquida))}${kpi("Despesas operacionais", brl(c.despesas))}
        <div class="card kpi c3 fin-destaque ${c.lucro < 0 ? "neg" : ""}"><span class="rot">Lucro líquido</span><b class="val">${brl(c.lucro)}</b></div>
        <div class="card kpi c3 fin-social"><span class="rot">Provisão Social (10%)</span><b class="val">${brl(c.provisao)}</b><small>Termo de Compromisso Social</small></div>
        ${kpi("Ticket médio", brl(c.ticket))}${kpi("Vendas aprovadas", c.nAprov)}${kpi("Horas de treinamento (ESG)", `${Math.round(c.horas).toLocaleString("pt-BR")} h`)}
      </div>
      <div class="dois">${card("", "Faturamento, despesas e lucro por mês", "Faturamento bruto (vendas on-line + receitas lançadas), despesas e lucro líquido; a linha tracejada é a provisão social de 10%.", `<div class="graf-box" style="height:300px"><canvas id="g-mes"></canvas></div>`)}
        ${card("", "Ranking de cursos mais vendidos", "Vendas on-line aprovadas no período (quantidade).", c.ranking.length ? `<div class="graf-box" style="height:300px"><canvas id="g-rank"></canvas></div>` : `<p class="vazio">Sem vendas no período.</p>`)}</div>
      <div class="dois">${card("", "Horas de treinamento dedicadas (ESG)", `Carga horária × alunos aprovados (EaD, presencial e híbrido): <b>${Math.round(c.horas).toLocaleString("pt-BR")} horas</b> com ${c.aprovados} aprovação(ões).`, `<div class="graf-box" style="height:260px"><canvas id="g-horas"></canvas></div>`)}
        ${card("", "Formas de pagamento", `PIX: ${c.metodos.pix.qtd} venda(s) · ${brl(c.metodos.pix.valor)} — Cartão: ${c.metodos.cartao.qtd} venda(s) · ${brl(c.metodos.cartao.valor)}`, c.nAprov ? `<div class="graf-box" style="height:260px"><canvas id="g-met"></canvas></div>` : `<p class="vazio">Sem vendas no período.</p>`)}</div>
      <div class="dois">${card("", "Demonstrativo do resultado (DRE simplificada)", "", `<table class="t fin-dre"><tbody>
          <tr><td>Vendas on-line (UniLTS)</td><td>${brl(c.vendasBrutas)}</td></tr><tr><td>Outras receitas lançadas (B2B, consultorias…)</td><td>${brl(c.outrasReceitas)}</td></tr>
          <tr class="sub"><td>Faturamento bruto consolidado</td><td>${brl(c.bruto)}</td></tr>
          <tr><td>(−) Estornos (${c.nEstorn})</td><td class="neg">${brl(-c.estornos)}</td></tr><tr><td>(−) Taxas do Mercado Pago</td><td class="neg">${brl(-c.taxas)}</td></tr>
          <tr class="sub"><td>Receita líquida</td><td>${brl(c.receitaLiquida)}</td></tr>
          <tr><td>(−) Despesas operacionais</td><td class="neg">${brl(-c.despesas)}</td></tr>
          <tr class="tot"><td>Lucro líquido</td><td>${brl(c.lucro)}</td></tr>
          <tr class="soc"><td>Provisão Social (10% do lucro líquido)</td><td>${brl(c.provisao)}</td></tr>
        </tbody></table><div class="linha-acoes"><button class="btn btn-sec" type="button" id="fin-xlsx">${IC.baixar} Exportar Excel</button></div>`)}
        ${card("", "Despesas por categoria", "", c.cats.length ? `<div class="graf-box" style="height:280px"><canvas id="g-cat"></canvas></div>` : `<p class="vazio">Nenhuma despesa lançada no período. Lance em “Despesas e receitas”.</p>`)}</div>
      <p class="aviso info">A provisão social segue o Termo de Compromisso Social: 10% do lucro líquido apurado (quando positivo). Os valores são gerenciais e não substituem a apuração contábil oficial.</p>
    </div>`;
    const m = c.meses, pm = c.porMes;
    grafico("g-mes", { type: "bar", data: { labels: m.map(rotMes), datasets: [
      { label: "Faturamento bruto", data: m.map(k => pm[k].bruto), backgroundColor: "#1F55C9", borderRadius: 4, order: 3 },
      { label: "Despesas", data: m.map(k => pm[k].despesas), backgroundColor: "#C5D3F5", borderRadius: 4, order: 4 },
      { label: "Lucro líquido", type: "line", data: m.map(k => pm[k].lucro), borderColor: "#003376", backgroundColor: "#003376", tension: .3, order: 1 },
      { label: "Provisão social (10%)", type: "line", data: m.map(k => pm[k].provisao), borderColor: "#1B7F4C", backgroundColor: "#1B7F4C", borderDash: [6, 4], tension: .3, order: 2 }] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { tooltip: { callbacks: { label: x => `${x.dataset.label}: ${brl(x.raw)}` } } }, scales: { y: { ticks: { callback: v => brl(v).replace(",00", "") } } } } });
    if (c.ranking.length) grafico("g-rank", { type: "bar", data: { labels: c.ranking.slice(0, 8).map(([id]) => { const cu = c.cursos[id] || {}, t = String(cu.titulo || id).replace(/\s*\(.*?\)\s*/g, " ").trim(), r = (cu.nr ? cu.nr.split("/")[0].trim() + " · " : "") + t.replace(/^NR\s*\d+\s*·\s*/, ""); return r.length > 30 ? r.slice(0, 29).trim() + "…" : r; }), datasets: [{ label: "Vendas", data: c.ranking.slice(0, 8).map(x => x[1].qtd), backgroundColor: "#0A3490", borderRadius: 4 }] },
      options: { indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => `${x.raw} venda(s) · ${brl(c.ranking[x.dataIndex][1].valor)}` } } }, scales: { x: { ticks: { precision: 0 } } } } });
    grafico("g-horas", { type: "bar", data: { labels: m.map(rotMes), datasets: [{ label: "Horas de treinamento", data: m.map(k => pm[k].horas), backgroundColor: "#1B7F4C", borderRadius: 4 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    if (c.nAprov) grafico("g-met", { type: "doughnut", data: { labels: ["PIX", "Cartão de crédito"], datasets: [{ data: [c.metodos.pix.valor, c.metodos.cartao.valor], backgroundColor: ["#1F55C9", "#003376"] }] }, options: { maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: x => `${x.label}: ${brl(x.raw)}` } } } } });
    if (c.cats.length) grafico("g-cat", { type: "doughnut", data: { labels: c.cats.map(x => x[0]), datasets: [{ data: c.cats.map(x => x[1]), backgroundColor: CORES }] }, options: { maintainAspectRatio: false, plugins: { legend: { position: "right" }, tooltip: { callbacks: { label: x => `${x.label}: ${brl(x.raw)}` } } } } });
    $("fin-xlsx").onclick = () => {
      if (!window.XLSX) return toast("Biblioteca de planilhas não carregada.");
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["DRE simplificada · LIPPMANN Treinamentos e Soluções", "", ""], ["Período", `${dataCurta(d.inicio)} a ${dataCurta(d.fim)}`, ""], [],
        ["Vendas on-line (UniLTS)", c.vendasBrutas], ["Outras receitas", c.outrasReceitas], ["Faturamento bruto consolidado", c.bruto], ["(−) Estornos", -c.estornos], ["(−) Taxas Mercado Pago", -c.taxas], ["Receita líquida", c.receitaLiquida], ["(−) Despesas operacionais", -c.despesas], ["Lucro líquido", c.lucro], ["Provisão Social (10%)", c.provisao], [], ["Ticket médio", c.ticket], ["Vendas aprovadas", c.nAprov], ["Horas de treinamento (ESG)", c.horas]]), "DRE");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Mês", "Faturamento bruto", "Estornos", "Taxas", "Despesas", "Lucro líquido", "Provisão social", "Horas ESG"], ...m.map(k => [rotMes(k), pm[k].bruto, pm[k].estornos, pm[k].taxas, pm[k].despesas, pm[k].lucro, pm[k].provisao, pm[k].horas])]), "Por mês");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Pedido", "Data", "Cliente", "Curso", "Forma", "Valor", "Taxa", "Situação"], ...d.pedidos.map(p => [p.codigo, dataBR(p.pago_em || p.criado), p.nome, (c.cursos[p.curso_id] || {}).titulo || p.curso_id, p.metodo === "pix" ? "PIX" : "Cartão", +p.valor, +p.taxa || 0, (SIT_PED[p.status] || [p.status])[0]])]), "Pedidos");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Data", "Tipo", "Categoria", "Descrição", "Valor"], ...d.lancamentos.map(l => [dataCurta(l.data), l.tipo === "receita" ? "Receita" : "Despesa", l.categoria, l.descricao || "", +l.valor])]), "Lançamentos");
      XLSX.writeFile(wb, `Financeiro-LIPPMANN-${d.inicio}-a-${d.fim}.xlsx`);
    };
  }
  function finPedidos(d, c) {
    const f = st.filtros.ped || (st.filtros.ped = { status: "", metodo: "", q: "" });
    const lista = d.pedidos.filter(p => (!f.status || p.status === f.status) && (!f.metodo || p.metodo === f.metodo) && (!f.q || [p.codigo, p.nome, p.email].join(" ").toLowerCase().includes(f.q.toLowerCase())));
    const sim = d.ambiente !== "producao";
    const garantia = p => p.pago_em ? new Date(new Date(p.pago_em).getTime() + 7 * 864e5) : null;
    $("aba").innerHTML = card("", "Pedidos da loja UniLTS", `Checkout de pessoa física via Mercado Pago (PIX dinâmico e cartão). Estorno dentro de 7 dias: o acesso é bloqueado e o certificado invalidado automaticamente.${sim ? " Ambiente de teste: use “Simular” para aprovar ou recusar pedidos pendentes." : ""}`, `
      <div class="filtros-linha"><select id="pf-st"><option value="">Todas as situações</option>${Object.entries(SIT_PED).map(([k, [r]]) => `<option value="${k}"${f.status === k ? " selected" : ""}>${r}</option>`).join("")}</select>
        <select id="pf-met"><option value="">PIX e cartão</option><option value="pix"${f.metodo === "pix" ? " selected" : ""}>PIX</option><option value="cartao"${f.metodo === "cartao" ? " selected" : ""}>Cartão</option></select>
        <input id="pf-q" value="${esc(f.q)}" placeholder="Buscar pedido, cliente ou e-mail"></div>
      <p class="aviso" id="pf-msg" hidden></p>
      ${lista.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Pedido</th><th>Cliente</th><th>Curso</th><th>Valor</th><th>Situação</th><th>Garantia</th><th></th></tr></thead><tbody>
      ${lista.map(p => { const g = garantia(p), dentro = g && g > new Date();
        return `<tr data-ped="${p.id}"><td><b class="uni-cod">${esc(p.codigo)}</b><small>${dataBR(p.criado)} · ${p.metodo === "pix" ? "PIX" : `Cartão${p.parcelas > 1 ? " " + p.parcelas + "x" : ""}`}${p.ambiente !== "producao" ? " · teste" : ""}</small></td><td>${esc(p.nome)}<small>${esc(p.email)}</small></td><td>${esc((c.cursos[p.curso_id] || {}).titulo || p.curso_id)}</td><td class="nw">${brl(p.valor)}${+p.taxa ? `<small>taxa ${brl(p.taxa)}</small>` : ""}</td><td>${pillU(SIT_PED, p.status)}${p.estorno_motivo ? `<small>${esc(p.estorno_motivo)}</small>` : ""}</td>
          <td>${p.status === "aprovado" && g ? `<small class="${dentro ? "" : "uni-alerta"}">${dentro ? "até" : "encerrada em"} ${g.toLocaleDateString("pt-BR")}</small>` : "<small>—</small>"}</td>
          <td class="nw">${p.status === "aprovado" ? `<button class="btn btn-perigo" type="button" data-est="${p.id}" data-dentro="${dentro ? 1 : 0}">Estornar</button>` : ""}${p.status === "pendente" && sim ? `<button class="btn btn-sec" type="button" data-sim="${p.id}" data-res="aprovado">Simular aprovação</button> <button class="btn btn-sec" type="button" data-sim="${p.id}" data-res="recusado">Recusar</button>` : ""}</td></tr>`; }).join("")}
      </tbody></table></div>` : `<p class="vazio">Nenhum pedido no período.</p>`}`);
    $("pf-st").onchange = e => { f.status = e.target.value; finPedidos(d, c); };
    $("pf-met").onchange = e => { f.metodo = e.target.value; finPedidos(d, c); };
    $("pf-q").oninput = e => { f.q = e.target.value; clearTimeout(st.tq); st.tq = setTimeout(() => { finPedidos(d, c); const i = $("pf-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
    document.querySelectorAll("[data-est]").forEach(b => b.onclick = async () => {
      if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = b.dataset.dentro === "1" ? "Confirmar estorno" : "Fora da garantia: confirmar"; return; }
      const motivo = prompt("Motivo do estorno (fica registrado):", b.dataset.dentro === "1" ? "Direito de arrependimento (7 dias)" : "Estorno excepcional autorizado pela Direção");
      if (motivo === null) return;
      const res = await api("fin_estornar", { corpo: { id: +b.dataset.est, motivo } });
      if (!res.ok) return msg("pf-msg", "erro", res.mensagem);
      await secFinanceiro(); toast(res.mensagem);
    });
    document.querySelectorAll("[data-sim]").forEach(b => b.onclick = async () => {
      const res = await api("fin_simular", { corpo: { id: +b.dataset.sim, resultado: b.dataset.res } });
      if (!res.ok) return msg("pf-msg", "erro", res.mensagem);
      await secFinanceiro(); toast(res.mensagem);
    });
  }
  function finLancamentos(d, c, editar) {
    const l = editar || { tipo: "despesa", data: new Date().toISOString().slice(0, 10), categoria: CAT_DESP[0] };
    const cats = t => (t === "receita" ? CAT_REC : CAT_DESP);
    $("aba").innerHTML = `<div class="dois fin-lanc">
      ${card("", editar ? "Editar lançamento" : "Novo lançamento", "Lance as despesas do mês (e receitas fora da loja, como contratos B2B). O lucro e a provisão social são recalculados na hora.", `
        <div class="fin-tipo" role="radiogroup"><label><input type="radio" name="fl-tipo" value="despesa"${l.tipo !== "receita" ? " checked" : ""}> Despesa</label><label><input type="radio" name="fl-tipo" value="receita"${l.tipo === "receita" ? " checked" : ""}> Receita</label></div>
        <div class="form-grid">
          <div class="campo"><label for="fl-data">Data</label><input id="fl-data" type="date" value="${esc(l.data)}"></div>
          <div class="campo"><label for="fl-valor">Valor (R$)</label><input id="fl-valor" inputmode="decimal" placeholder="0,00" value="${l.valor ? String(Number(l.valor).toFixed(2)).replace(".", ",") : ""}"></div>
          <div class="campo full"><label for="fl-cat">Categoria</label><select id="fl-cat">${cats(l.tipo).map(x => `<option${x === l.categoria ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
          <div class="campo full"><label for="fl-desc">Descrição</label><input id="fl-desc" value="${esc(l.descricao || "")}" placeholder="Ex.: aluguel da sala de treinamento"></div>
        </div>
        <div class="fin-previa" id="fl-previa"></div>
        <p class="aviso" id="fl-msg" hidden></p>
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="fl-salvar">${editar ? "Salvar alteração" : "Lançar"}</button>${editar ? `<button class="btn btn-sec" type="button" id="fl-cancelar">Cancelar</button>` : ""}</div>`)}
      ${card("", "Resultado do período", `${dataCurta(d.inicio)} a ${dataCurta(d.fim)}`, `<div class="fin-res">
        <div><span>Receita líquida</span><b>${brl(c.receitaLiquida)}</b></div><div><span>Despesas</span><b class="neg">${brl(c.despesas)}</b></div>
        <div class="tot ${c.lucro < 0 ? "neg" : ""}"><span>Lucro líquido</span><b>${brl(c.lucro)}</b></div><div class="soc"><span>Provisão Social (10%)</span><b>${brl(c.provisao)}</b></div></div>`)}
    </div>
    ${card("", "Lançamentos do período", "", d.lancamentos.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th></th></tr></thead><tbody>
      ${d.lancamentos.map(x => `<tr><td class="nw">${dataCurta(x.data)}</td><td>${x.tipo === "receita" ? `<span class="pill p-ok">Receita</span>` : `<span class="pill p-fim">Despesa</span>`}</td><td>${esc(x.categoria)}</td><td>${esc(x.descricao || "")}<small>${esc(x.criado_por || "")}</small></td><td class="nw ${x.tipo === "despesa" ? "neg" : ""}">${brl(x.tipo === "despesa" ? -x.valor : x.valor)}</td><td class="nw"><button class="btn btn-sec" type="button" data-ed="${x.id}">Editar</button> <button class="btn btn-perigo" type="button" data-ex="${x.id}">Excluir</button></td></tr>`).join("")}
    </tbody></table></div>` : `<p class="vazio">Nenhum lançamento no período.</p>`)}`;
    const tipo = () => (document.querySelector('[name="fl-tipo"]:checked') || {}).value || "despesa";
    const valorNum = () => Number(String($("fl-valor").value || "0").replace(/\./g, "").replace(",", ".")) || 0;
    const previa = () => {   // simulação em tempo real do impacto do lançamento
      const v = valorNum(), antes = editar ? (editar.tipo === "despesa" ? -editar.valor : +editar.valor) : 0;
      const novoLucro = c.lucro - antes + (tipo() === "despesa" ? -v : v);
      $("fl-previa").innerHTML = v ? `Com este lançamento: lucro líquido <b class="${novoLucro < 0 ? "neg" : ""}">${brl(novoLucro)}</b> · provisão social <b>${brl(Math.max(0, novoLucro) * 0.1)}</b>` : "";
    };
    document.querySelectorAll('[name="fl-tipo"]').forEach(r => r.onchange = () => { $("fl-cat").innerHTML = cats(tipo()).map(x => `<option>${esc(x)}</option>`).join(""); previa(); });
    $("fl-valor").oninput = previa; previa();
    $("fl-salvar").onclick = async e => {
      e.target.disabled = true;
      const res = await api("fin_lancamento_salvar", { corpo: { id: editar && editar.id, tipo: tipo(), data: $("fl-data").value, valor: $("fl-valor").value, categoria: $("fl-cat").value, descricao: $("fl-desc").value } });
      e.target.disabled = false;
      if (!res.ok) return msg("fl-msg", "erro", res.mensagem);
      toast("Lançamento salvo. Resultado recalculado."); st.filtros.abaFin = "lancamentos"; secFinanceiro();
    };
    const canc = $("fl-cancelar"); if (canc) canc.onclick = () => finLancamentos(d, c);
    document.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { finLancamentos(d, c, d.lancamentos.find(x => String(x.id) === b.dataset.ed)); window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.querySelectorAll("[data-ex]").forEach(b => b.onclick = async () => { if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Confirmar"; return; } const res = await api("fin_lancamento_excluir", { corpo: { id: +b.dataset.ex } }); if (res.ok) { toast("Lançamento excluído."); secFinanceiro(); } });
  }

  /* ================= Exportação ================= */
  const COLS = {
    lead: [["criado", "Data"], ["nome", "Nome completo"], ["empresa", "Empresa"], ["cargo", "Cargo"], ["cidade", "Cidade"], ["uf", "Estado"], ["email", "E-mail"], ["telefone", "Celular / WhatsApp"], ["origem", "Como conheceu"], ["status", "Status"], ["notas", "Anotações"]],
    contato: [["criado", "Data"], ["assunto", "Assunto"], ["nome", "Nome"], ["empresa", "Empresa"], ["cargo", "Cargo"], ["email", "E-mail"], ["telefone", "Telefone"], ["cidade", "Cidade"], ["uf", "UF"], ["mensagem", "Mensagem"], ["status", "Status"], ["notas", "Anotações"]],
    newsletter: [["criado", "Inscrição"], ["nome", "Nome"], ["email", "E-mail"], ["status", "Status"]],
    candidato: [["criado", "Recebido"], ["nome", "Nome"], ["email", "E-mail"], ["telefone", "Telefone"], ["cidade", "Cidade"], ["uf", "UF"], ["cargo_pretendido", "Cargo pretendido"], ["linkedin", "LinkedIn"], ["mensagem", "Apresentação"], ["arquivo_nome", "Arquivo do currículo"], ["status", "Status"], ["notas", "Anotações"]]
  };
  function linhasExport(regs) {
    const tipos = [...new Set(regs.map(r => r.tipo))];
    const cols = tipos.length === 1 ? COLS[tipos[0]] : [["tipo", "Tipo"], ...COLS.contato];
    return regs.map(r => Object.fromEntries(cols.map(([k, rot]) => [rot, k === "tipo" ? TIPO_NOME[r.tipo] : k === "criado" ? dataBR(r.criado) : (r[k] ?? "")])));
  }
  function baixarArquivo(blob, nome) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportar(regsOuLinhas, formato, nome, jaLinhas) {
    const linhas = jaLinhas ? regsOuLinhas : linhasExport(regsOuLinhas);
    if (!linhas.length) { toast("Não há registros para exportar."); return; }
    const arq = `L3-INTEGRA_${nome}_${new Date().toISOString().slice(0, 10)}`;
    if (formato === "xlsx") {
      if (!window.XLSX) { toast("Biblioteca do Excel indisponível. Use CSV."); return; }
      const ws = XLSX.utils.json_to_sheet(linhas);
      ws["!cols"] = Object.keys(linhas[0]).map(k => ({ wch: Math.min(50, Math.max(k.length, ...linhas.slice(0, 200).map(l => String(l[k] ?? "").length)) + 2) }));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Dados");
      XLSX.writeFile(wb, arq + ".xlsx");
    } else {
      const cab = Object.keys(linhas[0]);
      const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = "﻿" + [cab.map(q).join(";"), ...linhas.map(l => cab.map(c => q(l[c])).join(";"))].join("\r\n");
      baixarArquivo(new Blob([csv], { type: "text/csv;charset=utf-8" }), arq + ".csv");
    }
    toast(`${linhas.length} registro(s) exportado(s).`);
  }
  function secExportar() {
    const R = st.dados.registros;
    const bases = [...(pode("leads") || pode("denuncias") ? [["lead", "Leads da Biblioteca Técnica", "Cadastros feitos para acessar os materiais"]] : []), ...(pode("newsletter") ? [["newsletter", "Newsletter", "Lista de inscritos (nome, e-mail, status)"]] : []), ...(pode("leads") || pode("denuncias") ? [["contato", "Fale Conosco", "Mensagens, assuntos e status de atendimento"]] : []), ...(pode("talentos") ? [["candidato", "Banco de talentos", "Candidatos, cargos pretendidos e status"]] : [])];
    $("conteudo").innerHTML = `<div class="grade">${bases.map(([t, rot, d]) => card("c6", rot, d, `<p><b class="num" style="font:400 2.2rem/1 var(--f-titulo);color:var(--azul-inst)">${fmt(R.filter(r => r.tipo === t).length)}</b> registros</p><div class="linha-acoes"><button class="btn btn-primario" type="button" data-exp="${t}" data-f="xlsx">${IC.baixar} Excel (.xlsx)</button><button class="btn btn-sec" type="button" data-exp="${t}" data-f="csv">CSV</button></div>`)).join("")}
      ${card("c12", "Eventos de navegação", `Visitas, cliques e downloads dos últimos ${st.dias * 2} dias (dados anônimos)`, `<div class="linha-acoes"><button class="btn btn-sec" type="button" data-exp="eventos" data-f="xlsx">${IC.baixar} Excel (.xlsx)</button><button class="btn btn-sec" type="button" data-exp="eventos" data-f="csv">CSV</button></div>`)}</div>`;
    $("conteudo").onclick = e => {
      const b = e.target.closest("[data-exp]"); if (!b) return;
      if (b.dataset.exp === "eventos") {
        const linhas = st.dados.eventos.map(e => ({ "Data/hora": e[0], Tipo: e[1], Alvo: e[2], Página: NOMES_PAG[e[3]] || e[3], Visitante: e[4], Segundos: e[5] ?? "", Cidade: e[6], UF: e[7], Dispositivo: e[8], Origem: origemTrafego(e[9]) }));
        exportar(linhas, b.dataset.f, "eventos", true);
      } else exportar(R.filter(r => r.tipo === b.dataset.exp), b.dataset.f, b.dataset.exp);
    };
  }

  /* ================= Configurações ================= */
  function secConfig() {
    const abas = [
      ...(pode("usuarios") ? [["usuarios", "Usuários e acessos"]] : []),
      ...(pode("notificacoes") ? [["notif", "Notificações e e-mail"]] : []),
      ...(pode("materiais") ? [["materiais", "Materiais"]] : []),
      ...(pode("materiais") || pode("notificacoes") ? [["site", "Site e GitHub"]] : []),
      ...(pode("seguranca") ? [["seguranca", "Segurança e registros"]] : []),
      ["senha", "Minha senha"]];
    const atual = st.filtros.abaConfig && abas.some(a => a[0] === st.filtros.abaConfig) ? st.filtros.abaConfig : abas[0][0];
    $("conteudo").innerHTML = `<div style="display:grid;gap:18px"><div class="abas" role="tablist">${abas.map(([k, r]) => `<button type="button" role="tab" data-aba="${k}" aria-selected="${k === atual}">${r}</button>`).join("")}</div><div id="aba"></div></div>`;
    $("conteudo").querySelector(".abas").onclick = e => { const b = e.target.closest("[data-aba]"); if (b) { st.filtros.abaConfig = b.dataset.aba; secConfig(); } };
    ({ notif: abaNotif, site: abaSite, materiais: abaMateriais, usuarios: abaUsuarios, senha: abaSenha, seguranca: abaSeguranca })[atual]();
  }
  const msg = (id, tipo, t) => { const m = $(id); m.hidden = false; m.className = "aviso " + tipo; m.textContent = t; };

  async function abaNotif() {
    const r = await api("config");
    if (!r.ok) return msgAba(r);
    const c = r.config, sm = r.smtp;
    $("aba").innerHTML = `<div class="grade">
      ${card("c7", "Quem recebe as notificações", "Cada formulário enviado no site gera um e-mail imediato com o resumo para estes endereços", `
        <div class="campo"><label for="c-emails">E-mails da equipe (separados por vírgula)</label><textarea id="c-emails" style="min-height:70px">${esc(c.emails_notificacao)}</textarea><small>Estes endereços não aparecem no site.</small></div>
        <div class="campo"><label for="c-bv-ass">Assunto do e-mail de boas-vindas da Newsletter</label><input id="c-bv-ass" value="${esc(c.boas_vindas_assunto)}"></div>
        <div class="campo"><label for="c-bv-txt">Texto de boas-vindas</label><textarea id="c-bv-txt" style="min-height:160px">${esc(c.boas_vindas_texto)}</textarea></div>
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="c-salvar">Salvar</button></div><p id="c-msg" hidden></p>`)}
      ${card("c5", "Servidor de e-mail (SMTP)", "Configurado nas variáveis de ambiente da Vercel (SMTP_HOST, SMTP_USER, SMTP_PASS…)", `
        <p>${sm.configurado ? `<span class="pill p-ok">Configurado</span> ${esc(sm.host)} · remetente ${esc(sm.remetente)}` : `<span class="pill p-alerta">Não configurado</span> Os e-mails não serão enviados até que as variáveis SMTP_* sejam preenchidas na Vercel com a conta atendimento@lippmannts.com.`}</p>
        <div class="campo"><label for="c-teste">Enviar e-mail de teste para</label><input id="c-teste" type="email" placeholder="seu-email@lippmannts.com"></div>
        <div class="linha-acoes"><button class="btn btn-sec" type="button" id="c-testar">Enviar teste</button></div><p id="c-tmsg" hidden></p>`)}
    </div>`;
    $("c-salvar").onclick = async () => { const res = await api("config_salvar", { corpo: { emails_notificacao: $("c-emails").value, boas_vindas_assunto: $("c-bv-ass").value, boas_vindas_texto: $("c-bv-txt").value } }); msg("c-msg", res.ok ? "ok" : "erro", res.ok ? "Configurações salvas." : res.mensagem); };
    $("c-testar").onclick = async () => { const res = await api("email_teste", { corpo: { para: $("c-teste").value } }); msg("c-tmsg", res.ok ? "ok" : "erro", res.mensagem); };
  }
  function msgAba(r) { $("aba").innerHTML = `<p class="aviso erro">${esc(r.mensagem || "Não foi possível carregar.")}</p>`; }

  async function abaSite() {
    const r = await api("config"); if (!r.ok) return msgAba(r);
    const gh = r.github || "";
    const arq = (caminho, desc) => `<tr><td><code>${caminho}</code></td><td>${desc}</td><td>${gh ? `<a class="btn btn-sec" href="${esc(gh.replace(/\/$/, ""))}/edit/main/${caminho}" target="_blank" rel="noopener">Editar no GitHub</a>` : "—"}</td></tr>`;
    $("aba").innerHTML = card("", "Textos, contatos e código do site", "O site fica no GitHub. Ao salvar uma alteração lá, a Vercel publica a nova versão sozinha em cerca de 1 minuto.", `
      ${gh ? `<p><a class="btn btn-primario" href="${esc(gh)}" target="_blank" rel="noopener">Abrir o repositório no GitHub</a></p>` : `<p class="aviso atencao">Informe o endereço do repositório na variável <code>GITHUB_REPO_URL</code> da Vercel para mostrar os atalhos de edição aqui.</p>`}
      <div class="tabela-box"><table class="t"><thead><tr><th>Arquivo</th><th>O que muda</th><th></th></tr></thead><tbody>
        ${arq("assets/js/config.js", "WhatsApp, mensagem padrão, e-mail comercial, redes sociais, cargos do Trabalhe Conosco")}
        ${arq("data/treinamentos.js", "Lista reserva dos treinamentos (a versão oficial é editada no menu Treinamentos deste painel)")}
        ${arq("data/solucoes.js", "As 20 soluções")}
        ${arq("assets/css/style.css", "Cores, fontes e espaçamentos")}
        ${arq("index.html", "Textos da página inicial")}
      </tbody></table></div>
      <p class="desc">Dica: no GitHub, clique no lápis (Edit), altere só o texto entre aspas e clique em "Commit changes". Se algo der errado, a Vercel mantém a versão anterior disponível em Deployments › Promote.</p>`);
  }

  async function abaMateriais() {
    const r = await api("materiais"); if (!r.ok) return msgAba(r);
    const lista = r.materiais || [];
    $("aba").innerHTML = `<div class="grade">
      ${card("c7", "Materiais da Biblioteca Técnica", "Aparecem na aba Conteúdo, liberados após o cadastro", lista.length ? `<div class="tabela-box"><table class="t"><thead><tr><th>Material</th><th>Área</th><th>PDF</th><th>Vídeo</th></tr></thead><tbody>${lista.map(m => `<tr data-mat="${esc(m.id)}"><td><b>${esc(m.titulo)}</b><small>${esc(m.tipo)} · ${esc(m.tema)}</small></td><td>${m.area === "solucoes" ? "Soluções" : "Treinamentos"}</td><td>${m.arquivo ? "Sim" : "—"}</td><td>${m.youtube ? "Sim" : "—"}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vazio">Nenhum material cadastrado.</p>`)}
      ${card("c5", "Adicionar ou editar material", "PowerPoint: exporte como PDF antes de enviar (Arquivo › Exportar › PDF)", `
        <form id="m-form" class="form-grid" style="grid-template-columns:1fr">
          <input type="hidden" name="id" id="m-id">
          <div class="campo"><label for="m-titulo">Título</label><input id="m-titulo" name="titulo" required></div>
          <div class="campo"><label for="m-area">Área</label><select id="m-area" name="area"><option value="treinamentos">Treinamentos</option><option value="solucoes">Soluções</option></select></div>
          <div class="campo"><label for="m-tipo">Tipo</label><select id="m-tipo" name="tipo">${["Apostila", "Apresentação", "Vídeo-aula", "Guia", "Checklist"].map(t => `<option>${t}</option>`).join("")}</select></div>
          <div class="campo"><label for="m-tema">Tema</label><input id="m-tema" name="tema" placeholder="Ex.: NR 35"></div>
          <div class="campo"><label for="m-resumo">Resumo</label><textarea id="m-resumo" name="resumo" style="min-height:70px"></textarea></div>
          <div class="campo"><label for="m-yt">Vídeo do YouTube (link)</label><input id="m-yt" name="youtube" placeholder="https://youtu.be/…"></div>
          <div class="campo"><label for="m-pdf">Arquivo PDF</label><input id="m-pdf" name="pdf" type="file" accept="application/pdf"><small>Deixe em branco para manter o PDF atual.</small></div>
          <div class="linha-acoes"><button class="btn btn-primario" type="submit">Salvar material</button><button class="btn btn-perigo" type="button" id="m-excluir" hidden>Excluir</button><button class="btn btn-sec" type="button" id="m-limpar">Novo</button></div>
          <p id="m-msg" hidden></p>
        </form>`)}
    </div>`;
    const preencher = m => { $("m-id").value = m.id || ""; $("m-titulo").value = m.titulo || ""; $("m-area").value = m.area || "treinamentos"; $("m-tipo").value = m.tipo || "Apostila"; $("m-tema").value = m.tema || ""; $("m-resumo").value = m.resumo || ""; $("m-yt").value = m.youtube || ""; $("m-excluir").hidden = !m.id; };
    document.querySelectorAll("[data-mat]").forEach(tr => tr.onclick = () => preencher(lista.find(m => m.id === tr.dataset.mat)));
    $("m-limpar").onclick = () => preencher({});
    $("m-form").onsubmit = async e => {
      e.preventDefault();
      if (!$("m-titulo").value.trim()) return msg("m-msg", "erro", "Informe o título.");
      const corpo = Object.fromEntries([...new FormData(e.target).entries()].filter(([k, v]) => !(v instanceof File)));
      const pdf = $("m-pdf").files[0];
      const bt = e.target.querySelector("button[type=submit]"); bt.disabled = true;
      try {
        if (pdf && !DEMO) {
          msg("m-msg", "info", "Enviando o PDF…");
          const up = await api("material_upload", { corpo: { nome: pdf.name, tamanho: pdf.size, id: corpo.id || corpo.titulo } });
          if (!up.ok) throw new Error(up.mensagem);
          const fd = new FormData(); fd.append("cacheControl", "3600"); fd.append("", pdf);
          const h = { "x-upsert": "false" }; if (up.apikey) { h.apikey = up.apikey; h.Authorization = "Bearer " + up.apikey; }
          const envio = await fetch(up.url, { method: "PUT", body: fd, headers: h });
          if (!envio.ok) throw new Error("O envio do PDF falhou. Tente novamente.");
          corpo.arquivo = up.caminho;
        }
        const res = await api("material_salvar", { corpo });
        if (!res.ok) throw new Error(res.mensagem);
        toast("Material salvo."); abaMateriais();
      } catch (err) { msg("m-msg", "erro", err.message || "Não foi possível salvar."); }
      finally { bt.disabled = false; }
    };
    $("m-excluir").onclick = async () => { const res = await api("material_excluir", { corpo: { id: $("m-id").value } }); if (res.ok) { toast("Material excluído."); abaMateriais(); } };
  }

  async function abaUsuarios() {
    const r = await api("usuarios"); if (!r.ok) return msgAba(r);
    const ABAS = r.abas || {};
    const chaves = Object.keys(ABAS);
    const marca = (u, k) => u.perfil === "admin" || (u.permissoes || []).includes(k);
    $("aba").innerHTML = `<div style="display:grid;gap:18px">
      ${card("", "Matriz de acessos", "Cada coluna é uma aba do painel. Abas sem marcação somem do menu do usuário e são bloqueadas no servidor. O superadministrador tem acesso total.", `
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="u-novo">+ Novo usuário</button></div>
        <div class="tabela-box"><table class="t matriz"><thead><tr><th>Usuário</th><th>Situação</th>${chaves.map(k => `<th class="rot-v"><span>${esc(ABAS[k])}</span></th>`).join("")}</tr></thead>
        <tbody>${r.usuarios.map(u => `<tr data-u="${u.id}"><td><b>${esc(u.usuario)}</b><small>${u.perfil === "admin" ? "Superadministrador" : esc(u.nome || "Acesso personalizado")}</small><small>Último acesso: ${esc(dataBR(u.ultimo_acesso) || "—")}</small></td><td>${pill(+u.ativo ? "ativo" : "inativo")}</td>${chaves.map(k => `<td class="ck">${marca(u, k) ? "✓" : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="desc">Clique em um usuário para editar acessos, trocar a senha, inativar ou excluir.</p>`)}
    </div>`;
    const editar = u => {
      const novo = !u.id, sa = u.perfil === "admin";
      const g = gaveta(`
        <div class="gaveta-cab"><div><p class="desc">${novo ? "Novo usuário" : "Editar usuário"}</p><h2>${novo ? "Criar acesso" : esc(u.usuario)}</h2></div><button class="fechar" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
        <div class="form-grid">
          <div class="campo"><label for="u-usuario">Usuário (login)</label><input id="u-usuario" value="${esc(u.usuario || "")}" autocomplete="off"></div>
          <div class="campo"><label for="u-nome">Nome</label><input id="u-nome" value="${esc(u.nome || "")}"></div>
          <div class="campo full"><label for="u-email">E-mail</label><input id="u-email" type="email" value="${esc(u.email || "")}"></div>
          <div class="campo full"><label for="u-senha">${novo ? "Senha" : "Nova senha"}</label><div class="senha-box"><input id="u-senha" type="password" autocomplete="new-password" placeholder="${novo ? "Mínimo de 10 caracteres" : "Deixe em branco para manter a atual"}"><button type="button" class="olho" data-olho="u-senha" aria-label="Mostrar senha" aria-pressed="false"></button></div></div>
          ${admin() ? `<label class="full" style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="u-sa" ${sa ? "checked" : ""}> Superadministrador (acesso total e irrestrito)</label>` : ""}
          <fieldset class="full permissoes" id="u-perms" ${sa ? "disabled" : ""}><legend>Abas liberadas</legend>
            <div class="perm-grid">${chaves.map(k => `<label class="perm"><input type="checkbox" value="${k}" ${marca(u, k) ? "checked" : ""} ${!admin() && !pode(k) ? "disabled" : ""}><span>${esc(ABAS[k])}</span></label>`).join("")}</div>
            <div class="linha-acoes" style="margin-top:8px"><button class="btn btn-sec" type="button" id="u-todas">Marcar todas</button><button class="btn btn-sec" type="button" id="u-nenhuma">Desmarcar todas</button></div>
          </fieldset>
          <label class="full" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="u-ativo" ${u.ativo === undefined || +u.ativo ? "checked" : ""}> Usuário ativo (desmarque para bloquear o acesso sem excluir)</label>
        </div>
        <p class="aviso erro" id="u-msg" hidden></p>
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="u-salvar">Salvar</button>${novo ? "" : `<button class="btn btn-perigo" type="button" id="u-excluir">Excluir usuário</button>`}</div>`);
      const sab = g.querySelector("#u-sa");
      if (sab) sab.onchange = () => { g.querySelector("#u-perms").disabled = sab.checked; };
      g.querySelector("#u-todas").onclick = () => g.querySelectorAll("#u-perms input:not(:disabled)").forEach(x => x.checked = true);
      g.querySelector("#u-nenhuma").onclick = () => g.querySelectorAll("#u-perms input:not(:disabled)").forEach(x => x.checked = false);
      ligarOlhos(g);
      g.querySelector("#u-salvar").onclick = async () => {
        const corpo = { id: u.id, usuario: $("u-usuario").value, nome: $("u-nome").value, email: $("u-email").value, senha: $("u-senha").value, ativo: $("u-ativo").checked ? 1 : 0,
          perfil: sab && sab.checked ? "admin" : "personalizado", permissoes: [...g.querySelectorAll("#u-perms input:checked")].map(x => x.value) };
        const res = await api("usuario_salvar", { corpo });
        if (res.ok) { fecharGaveta(); toast("Usuário salvo."); abaUsuarios(); } else msg("u-msg", "erro", res.mensagem);
      };
      const ex = g.querySelector("#u-excluir");
      if (ex) ex.onclick = async () => {
        if (!ex.dataset.conf) { ex.dataset.conf = 1; ex.textContent = "Clique de novo para confirmar"; return; }
        const res = await api("usuario_excluir", { corpo: { id: u.id } });
        if (res.ok) { fecharGaveta(); toast("Usuário excluído."); abaUsuarios(); } else msg("u-msg", "erro", res.mensagem);
      };
    };
    document.querySelectorAll("[data-u]").forEach(tr => tr.onclick = () => editar(r.usuarios.find(u => String(u.id) === tr.dataset.u)));
    $("u-novo").onclick = () => editar({});
  }

  /* botão de olho: mostra/oculta a senha */
  const OLHO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const OLHO_FECHADO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;
  function ligarOlhos(raiz = document) {
    raiz.querySelectorAll("[data-olho]").forEach(b => {
      const campo = document.getElementById(b.dataset.olho); if (!campo || b.dataset.ligado) return;
      b.dataset.ligado = 1; b.innerHTML = OLHO;
      b.addEventListener("click", () => {
        const mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        b.innerHTML = mostrar ? OLHO_FECHADO : OLHO;
        b.setAttribute("aria-pressed", mostrar); b.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
        campo.focus();
      });
    });
  }
  ligarOlhos();

  function abaSenha() {
    $("aba").innerHTML = card("", "Alterar minha senha", "Use uma frase longa, com ao menos 10 caracteres", `<div style="display:grid;gap:12px;max-width:420px">
      <div class="campo"><label for="p-atual">Senha atual</label><input id="p-atual" type="password" autocomplete="current-password"></div>
      <div class="campo"><label for="p-nova">Nova senha</label><input id="p-nova" type="password" autocomplete="new-password"></div>
      <div class="campo"><label for="p-conf">Confirmar nova senha</label><input id="p-conf" type="password" autocomplete="new-password"></div>
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="p-salvar">Alterar senha</button></div><p id="p-msg" hidden></p></div>`);
    $("p-salvar").onclick = async () => {
      if ($("p-nova").value !== $("p-conf").value) return msg("p-msg", "erro", "A confirmação não confere com a nova senha.");
      const res = await api("minha_senha", { corpo: { atual: $("p-atual").value, nova: $("p-nova").value } });
      msg("p-msg", res.ok ? "ok" : "erro", res.mensagem || (res.ok ? "Senha alterada." : "Erro."));
      if (res.ok) { $("faixa-demo").hidden = !DEMO; ["p-atual", "p-nova", "p-conf"].forEach(i => $(i).value = ""); }
    };
  }

  async function abaSeguranca() {
    const r = await api("emails_log"); if (!r.ok) return msgAba(r);
    $("aba").innerHTML = `<div class="grade">
      ${card("c12", "Verificação do site", "Confere variáveis da Vercel, tabelas e buckets do Supabase, e-mail e a integridade de todos os arquivos (imagens e PDFs)", `<div class="linha-acoes"><a class="btn btn-primario" href="/integra/diagnostico.html" target="_blank" rel="noopener">Abrir verificação</a></div>`)}
      ${card("c4", "Cópia de segurança", "Todos os cadastros, agenda e configurações em um arquivo .json", `<p class="desc">Recomendado: baixe uma cópia por semana. Os currículos ficam guardados no Supabase Storage (bucket curriculos).</p><div class="linha-acoes">${DEMO ? `<button class="btn btn-primario" type="button" onclick="this.nextElementSibling.hidden=false">Baixar backup</button><span class="aviso info" hidden>Disponível no servidor definitivo.</span>` : `<a class="btn btn-primario" href="/api/painel?acao=backup">${IC.baixar} Baixar backup</a>`}</div>`)}
      ${card("c8", "E-mails enviados pelo sistema", "Últimos 200 envios (notificações, boas-vindas, convites)", r.log.length ? `<div class="tabela-box" style="max-height:340px"><table class="t"><thead><tr><th>Data</th><th>Para</th><th>Assunto</th><th>Resultado</th></tr></thead><tbody>${r.log.map(l => `<tr><td class="nw">${esc(dataBR(l.t))}</td><td>${esc(l.para)}</td><td>${esc(l.assunto)}</td><td>${+l.ok ? pill("enviado") : `<span class="pill p-alerta" title="${esc(l.erro)}">falhou</span><small>${esc(l.erro)}</small>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vazio">Nenhum e-mail enviado ainda.</p>`)}
      ${card("c12", "Acessos ao painel", "Últimas 100 tentativas de login", r.acessos.length ? `<div class="tabela-box" style="max-height:300px"><table class="t"><thead><tr><th>Data</th><th>Usuário</th><th>Resultado</th></tr></thead><tbody>${r.acessos.map(a => `<tr><td class="nw">${esc(dataBR(a.t))}</td><td>${esc(a.usuario)}</td><td>${+a.ok ? pill("aprovado") : pill("reprovado")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vazio">Sem registros.</p>`)}
    </div>`;
  }

  /* ================= Início ================= */
  (async () => {
    try { token = sessionStorage.getItem("l3_token"); } catch (e) {}
    const r = await api("sessao");
    if (r.ok) entrar(r.usuario, r.token); else mostrarLogin();
  })();
})();
