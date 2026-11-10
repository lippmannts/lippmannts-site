/* =====================================================================
   L³ INTEGRA · aplicação do painel
   Seções: Visão geral · Inteligência comercial · Leads e contatos ·
   Newsletter · Banco de talentos · Agenda · Exportar · Configurações
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
    painel: s('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    alvo: s('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    pessoas: s('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    mala: s('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    cal: s('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    baixar: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'),
    gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
    fechar: s('<path d="M6 6l12 12M18 6 6 18"/>'),
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

  const SECOES = [
    { id: "visao", rotulo: "Visão geral", ic: "painel", grupo: "Relatórios", sub: "Métricas de audiência, engajamento e conversão do site" },
    { id: "inteligencia", rotulo: "Inteligência comercial", ic: "alvo", grupo: "Relatórios", sub: "Público-alvo, empresas em destaque e bases para campanhas" },
    { id: "leads", rotulo: "Leads e contatos", ic: "pessoas", grupo: "Relacionamento", sub: "Cadastros da Biblioteca Técnica e mensagens do Fale Conosco" },
    { id: "newsletter", rotulo: "Newsletter", ic: "mail", grupo: "Relacionamento", sub: "Inscritos na Newsletter LIPPMANN" },
    { id: "talentos", rotulo: "Banco de talentos", ic: "mala", grupo: "Relacionamento", sub: "Currículos recebidos pelo Trabalhe Conosco", soAdmin: true },
    { id: "agenda", rotulo: "Agenda", ic: "cal", grupo: "Relacionamento", sub: "Reuniões e entrevistas com convite por e-mail" },
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
    $("pe-perfil").textContent = usuario.perfil === "admin" ? "Administrador" : "Marketing";
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
    SECOES.filter(x => !x.soAdmin || admin()).forEach(x => {
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
    let sec = SECOES.find(x => x.id === id && (!x.soAdmin || admin()));
    if (!sec) { sec = SECOES[0]; id = "visao"; }
    st.secao = id;
    document.querySelectorAll("[data-secao]").forEach(b => { if (b.dataset.secao === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    $("titulo-secao").textContent = sec.rotulo;
    $("sub-secao").textContent = sec.sub;
    $("acoes-topo").innerHTML = "";
    graficos.forEach(g => g.destroy()); graficos = [];
    ({ visao: secVisao, inteligencia: secInteligencia, leads: secLeads, newsletter: secNewsletter, talentos: secTalentos, agenda: secAgenda, exportar: secExportar, config: secConfig })[id]();
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
      ${card("c4", "Conversões do período", "", `<div class="ranking">${[["Leads da Biblioteca Técnica", m.leads], ["Inscritos na Newsletter", m.news], ["Mensagens Fale Conosco", m.contatos], ["Cliques para proposta (WhatsApp)", m.propostas], ...(admin() ? [["Currículos recebidos", m.cands]] : [])].map(([k, v]) => `<div class="lin"><span class="nome">${k}</span><span class="v">${fmt(v)}</span></div>`).join("")}</div><p class="desc">Taxa de conversão: <b>${pct(m.leads + m.contatos + m.news, m.vis)}%</b> dos visitantes deixaram contato.</p>`)}
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
      <div class="linha-acoes"><button class="btn btn-primario" type="button" id="d-salvar">Salvar</button>${admin() ? `<button class="btn btn-perigo" type="button" id="d-excluir">Excluir registro</button>` : ""}</div>
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
    const bases = [["lead", "Leads da Biblioteca Técnica", "Cadastros feitos para acessar os materiais"], ["newsletter", "Newsletter", "Lista de inscritos (nome, e-mail, status)"], ["contato", "Fale Conosco", "Mensagens, assuntos e status de atendimento"], ...(admin() ? [["candidato", "Banco de talentos", "Candidatos, cargos pretendidos e status"]] : [])];
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
    const abas = admin() ? [["notif", "Notificações e e-mail"], ["materiais", "Materiais"], ["usuarios", "Usuários"], ["senha", "Minha senha"], ["site", "Site e GitHub"], ["seguranca", "Segurança e registros"]] : [["senha", "Minha senha"]];
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
        ${arq("data/treinamentos.js", "Os 19 treinamentos e suas fichas técnicas")}
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
    $("aba").innerHTML = `<div class="grade">
      ${card("c7", "Usuários do painel", "Administrador: acesso total · Marketing: relatórios, leads, newsletter, agenda e exportação (sem banco de talentos, denúncias, reclamações e configurações)", `<div class="tabela-box"><table class="t"><thead><tr><th>Usuário</th><th>Perfil</th><th>Último acesso</th><th>Situação</th></tr></thead><tbody>${r.usuarios.map(u => `<tr data-u="${u.id}"><td><b>${esc(u.usuario)}</b><small>${esc(u.nome || "")}</small></td><td>${u.perfil === "admin" ? "Administrador" : "Marketing"}</td><td class="nw">${esc(dataBR(u.ultimo_acesso) || "—")}</td><td>${pill(+u.ativo ? "ativo" : "cancelado")}</td></tr>`).join("")}</tbody></table></div>`)}
      ${card("c5", "Criar ou editar usuário", "", `<div style="display:grid;gap:12px">
        <input type="hidden" id="u-id">
        <div class="campo"><label for="u-usuario">Usuário</label><input id="u-usuario" autocomplete="off"></div>
        <div class="campo"><label for="u-nome">Nome</label><input id="u-nome"></div>
        <div class="campo"><label for="u-email">E-mail</label><input id="u-email" type="email"></div>
        <div class="campo"><label for="u-perfil">Perfil</label><select id="u-perfil"><option value="marketing">Marketing</option><option value="admin">Administrador</option></select></div>
        <div class="campo"><label for="u-senha">Senha</label><input id="u-senha" type="password" autocomplete="new-password"><small>Mínimo de 10 caracteres. Na edição, deixe em branco para manter.</small></div>
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="u-ativo" checked> Usuário ativo</label>
        <div class="linha-acoes"><button class="btn btn-primario" type="button" id="u-salvar">Salvar</button><button class="btn btn-sec" type="button" id="u-novo">Novo</button></div><p id="u-msg" hidden></p></div>`)}
    </div>`;
    const pre = u => { $("u-id").value = u.id || ""; $("u-usuario").value = u.usuario || ""; $("u-nome").value = u.nome || ""; $("u-email").value = u.email || ""; $("u-perfil").value = u.perfil || "marketing"; $("u-senha").value = ""; $("u-ativo").checked = u.ativo === undefined ? true : !!+u.ativo; };
    document.querySelectorAll("[data-u]").forEach(tr => tr.onclick = () => pre(r.usuarios.find(u => String(u.id) === tr.dataset.u)));
    $("u-novo").onclick = () => pre({});
    $("u-salvar").onclick = async () => { const res = await api("usuario_salvar", { corpo: { id: $("u-id").value, usuario: $("u-usuario").value, nome: $("u-nome").value, email: $("u-email").value, perfil: $("u-perfil").value, senha: $("u-senha").value, ativo: $("u-ativo").checked ? 1 : 0 } }); if (res.ok) { toast("Usuário salvo."); abaUsuarios(); } else msg("u-msg", "erro", res.mensagem); };
  }

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
