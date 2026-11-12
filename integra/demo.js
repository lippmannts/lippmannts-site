/* =====================================================================
   L³ INTEGRA · MODO DEMONSTRAÇÃO
   Usado apenas quando "modoDemonstracao": true em assets/js/config.js.
   Simula o servidor no próprio navegador, com DADOS FICTÍCIOS de exemplo
   somados aos formulários enviados no site durante o teste.
   No servidor definitivo este arquivo não é utilizado.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  if (!C || !C.api || !C.api.modoDemonstracao) return;

  const HASH = { admin: "c7739851cbbdddc92769949444ac79bd6b8ef22c8536a2e1e501693e0a434c95", marketing: "917406553d234053acde849dbf45a27ce55e0b9c3e1961d0676158c25eff4d6e" };
  const ABAS = { visao: "Visão geral", inteligencia: "Inteligência comercial", leads: "Leads e contatos", denuncias: "Denúncias e reclamações", lipp: "LIPP · Assistente IA (conversas, leads e reuniões)", newsletter: "Newsletter", talentos: "Banco de talentos", agenda: "Agenda", exportar: "Exportar dados", hub: "HUB e publicações", catalogo: "Treinamentos (catálogo)", solucoes: "Soluções (catálogo)", traducoes: "Traduções (multi-idiomas)", politicas: "Políticas e Termo", unilts: "UniLTS (AVA, turmas e certificados)", financeiro: "Financeiro e BI (vendas, despesas e provisão social)", materiais: "Materiais da Biblioteca", notificacoes: "Notificações e e-mail", usuarios: "Usuários e acessos", seguranca: "Segurança e backup" };
  const USU = { admin: { usuario: "admin", nome: "Administrador", perfil: "admin", permissoes: Object.keys(ABAS) }, marketing: { usuario: "marketing", nome: "Marketing", perfil: "personalizado", permissoes: ["visao", "inteligencia", "leads", "lipp", "newsletter", "agenda", "exportar"] } };
  const ls = {
    get(k, p) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (e) { return p; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const slug = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "item";
  const idYt = u => { const m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || String(u || "").match(/^([\w-]{11})$/); return m ? m[1] : ""; };
  const listaHub = () => ls.get("l3_demo_hub", null) || (window.LTS_HUB || []).map((x, i) => ({ ...x, id: i + 1, publicado: true, criado: x.publicado_em }));
  const listaSol = () => ls.get("l3_demo_sol", null) || (window.LTS_SOLUCOES || []).map((x, i) => ({ ...x, ordem: (i + 1) * 10, ativo: true }));
  const gruposSol = () => ls.get("l3_demo_sol_grupos", null) || window.LTS_SOLUCOES_GRUPOS || {};
  const listaCat = () => ls.get("l3_demo_cat", null) || (window.LTS_TREINAMENTOS || []).map((x, i) => ({ ...x, ordem: (i + 1) * 10, ativo: true }));
  const listaPol = () => ls.get("l3_demo_pol", null) || (window.LTS_POLITICAS || []).map((x, i) => ({ ...x, corpo_html: x.protegido ? x.corpo : "", ordem: (i + 1) * 10, ativo: true }));
  let sessao = null;
  try { sessao = JSON.parse(sessionStorage.getItem("l3_demo_sessao") || "null"); } catch (e) {}

  async function sha(t) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("L3:" + t));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    }
    return "";
  }

  /* ---------- gerador de dados fictícios (sempre os mesmos) ---------- */
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function semente() {
    const r = rng(20261109), pick = a => a[Math.floor(r() * a.length)], pesado = a => { const t = a.reduce((s, x) => s + x[1], 0); let v = r() * t; for (const x of a) { v -= x[1]; if (v <= 0) return x[0]; } return a[0][0]; };
    const pad = n => String(n).padStart(2, "0");
    const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const cidades = [[["Jundiaí", "SP"], 18], [["Campo Limpo Paulista", "SP"], 14], [["São Paulo", "SP"], 22], [["Campinas", "SP"], 12], [["Várzea Paulista", "SP"], 7], [["Itupeva", "SP"], 6], [["Cajamar", "SP"], 6], [["Guarulhos", "SP"], 5], [["Sorocaba", "SP"], 4], [["Extrema", "MG"], 3], [["Curitiba", "PR"], 2], [["Rio de Janeiro", "RJ"], 2]];
    const paginas = [["index.html", 30], ["treinamentos.html", 26], ["solucoes.html", 12], ["a-lippmann.html", 10], ["conteudo.html", 9], ["fale-conosco.html", 6], ["trabalhe-conosco.html", 3]];
    const refs = [["", 34], ["www.google.com", 30], ["l.instagram.com", 14], ["www.linkedin.com", 13], ["m.facebook.com", 4], ["www.youtube.com", 3]];
    const disp = [["celular", 55], ["computador", 41], ["tablet", 4]];
    const trein = [["nr35-trabalho-altura", 16], ["nr11-movimentacao-cargas", 14], ["nr10-basico", 10], ["brigada-incendio", 10], ["nr33-espacos-confinados", 8], ["nr12-maquinas", 7], ["nr05-cipa", 6], ["liderancas", 5], ["nr20-inflamaveis", 4], ["integracao-ssma", 4], ["nr06-epi", 3], ["assedio", 3], ["nr18-construcao", 3]];
    const sols = [["pgr", 10], ["analise-riscos-nr12", 8], ["aet", 6], ["pae", 5], ["ltcat", 4], ["laudo-insalubridade", 3], ["simulados", 3], ["inventario-maquinas", 2]];
    const redes = [["instagram", 10], ["whatsapp", 16], ["linkedin", 7], ["youtube", 4], ["google", 2], ["email", 2]];
    const ev = [], agora = new Date();
    for (let dia = 89; dia >= 0; dia--) {
      const base = new Date(agora); base.setDate(agora.getDate() - dia);
      const fds = [0, 6].includes(base.getDay());
      const n = Math.round((fds ? 6 : 16) * (0.7 + r() * 0.6) * (1 + (89 - dia) / 140));
      for (let v = 0; v < n; v++) {
        const vis = "v" + Math.floor(r() * 1e9).toString(36), ses = "s" + Math.floor(r() * 1e9).toString(36);
        const [cid, uf] = pesado(cidades), dv = pesado(disp), ref = pesado(refs);
        const h = pesado([[7, 3], [8, 6], [9, 9], [10, 10], [11, 8], [12, 5], [13, 6], [14, 9], [15, 9], [16, 7], [17, 5], [18, 3], [19, 3], [20, 4], [21, 3], [22, 1]]);
        const t0 = new Date(base); t0.setHours(h, Math.floor(r() * 60), Math.floor(r() * 60));
        if (t0 > agora) continue;
        const npag = 1 + Math.floor(r() * 4);
        for (let p = 0; p < npag; p++) {
          const t = new Date(t0.getTime() + p * 70000), pag = p === 0 ? (ref.includes("google") && r() < .5 ? "treinamentos.html" : pesado(paginas)) : pesado(paginas);
          const T = iso(t);
          ev.push([T, "pageview", "", pag, vis, null, cid, uf, dv, p === 0 ? ref : "", ses]);
          ev.push([T, "tempo", "", pag, vis, 15 + Math.floor(r() * 150), cid, uf, dv, "", ses]);
          if (pag === "treinamentos.html" && r() < .55) {
            const tr = pesado(trein); ev.push([T, "ficha", tr, pag, vis, null, cid, uf, dv, "", ses]);
            if (r() < .22) ev.push([T, "whatsapp-proposta", tr, pag, vis, null, cid, uf, dv, "", ses]);
            if (r() < .15) ev.push([T, "download", "ficha-" + tr, pag, vis, null, cid, uf, dv, "", ses]);
            if (r() < .08) ev.push([T, "download", "portfolio-treinamentos", pag, vis, null, cid, uf, dv, "", ses]);
          }
          if (pag === "solucoes.html" && r() < .25) ev.push([T, "solucao", pesado(sols), pag, vis, null, cid, uf, dv, "", ses]);
          if (pag === "solucoes.html" && r() < .06) ev.push([T, "download", "portfolio-solucoes", pag, vis, null, cid, uf, dv, "", ses]);
          if (pag === "a-lippmann.html" && r() < .12) ev.push([T, "download", "apresentacao-institucional", pag, vis, null, cid, uf, dv, "", ses]);
          if (pag === "conteudo.html" && r() < .3) ev.push([T, "material", r() < .6 ? "exemplo-catalogo-treinamentos" : "exemplo-catalogo-solucoes", pag, vis, null, cid, uf, dv, "", ses]);
          if (r() < .1) ev.push([T, "clique", pesado(redes), pag, vis, null, cid, uf, dv, "", ses]);
        }
      }
    }
    const nomes = ["Carlos Andrade", "Fernanda Lopes", "Ricardo Matos", "Juliana Prado", "Marcos Vieira", "Patrícia Nunes", "André Campos", "Luciana Rocha", "Eduardo Lima", "Camila Torres", "Rafael Moreira", "Beatriz Alves", "Thiago Ribeiro", "Aline Freitas", "Gustavo Pires", "Renata Duarte", "Diego Fernandes", "Vanessa Costa", "Paulo Henrique Silva", "Mariana Teixeira", "Rodrigo Barros", "Simone Cardoso", "Felipe Araújo", "Tatiane Gomes", "Leandro Souza", "Priscila Martins", "Bruno Carvalho", "Daniela Reis", "Fábio Monteiro", "Elaine Batista"];
    const empresas = [["Metalúrgica Alfa (exemplo)", 6], ["Logística Horizonte (exemplo)", 5], ["Alimentos Serra Azul (exemplo)", 4], ["Construtora Pilar (exemplo)", 3], ["Química Vale Verde (exemplo)", 3], ["Frigorífico Tropeiro (exemplo)", 2], ["Embalagens Prisma (exemplo)", 2], ["Armazéns Rota 21 (exemplo)", 2], ["Plásticos Atlas (exemplo)", 1], ["Usinagem Precisa (exemplo)", 1]];
    const cargos = [["Técnico de Segurança do Trabalho", 10], ["Supervisor de Produção", 5], ["Analista de RH", 5], ["Engenheiro de Segurança", 3], ["Coordenador de Logística", 4], ["Gerente Industrial", 2], ["Comprador", 2], ["Diretor de Operações", 1]];
    const origens = [["LinkedIn", 9], ["Indicação", 8], ["Google", 7], ["Instagram", 6], ["Já sou cliente", 3], ["Evento ou palestra", 2]];
    const reg = []; let id = 1;
    const quando = maxDias => { const d = new Date(agora); d.setDate(d.getDate() - Math.floor(r() * maxDias)); d.setHours(8 + Math.floor(r() * 10), Math.floor(r() * 60)); return iso(d); };
    const email = (n, e) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0] + "@" + (e ? e.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(exemplo\)/, "").replace(/[^a-z]/g, "") + ".exemplo.com.br" : "exemplo.com.br");
    for (let i = 0; i < 34; i++) { const n = pick(nomes), e = pesado(empresas), [c, u] = pesado(cidades); reg.push({ id: id++, tipo: "lead", criado: quando(85), nome: n, empresa: e, cargo: pesado(cargos), cidade: c, uf: u, email: email(n, e), telefone: `(11) 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`, origem: pesado(origens), assunto: "Biblioteca Técnica", pagina: "conteudo.html", status: pick(["novo", "novo", "em atendimento", "proposta enviada", "convertido", "arquivado"]), notas: "" }); }
    for (let i = 0; i < 26; i++) { const n = pick(nomes); reg.push({ id: id++, tipo: "newsletter", criado: quando(88), nome: n, email: email(n, pick(["", "Metalúrgica Alfa", "Logística Horizonte"])), pagina: "a-lippmann.html", status: r() < .93 ? "ativo" : "cancelado" }); }
    const msgs = { "TREINAMENTOS": "Gostaria de um orçamento para turma in company de NR 35 para 15 colaboradores.", "SOLUÇÕES": "Precisamos atualizar o PGR e o inventário de riscos da unidade.", "SUGESTÕES DE MELHORIA": "Sugiro incluir turmas aos sábados.", "RECLAMAÇÕES": "O certificado demorou mais que o previsto.", "DENÚNCIAS": "Relato enviado de forma anônima (exemplo)." };
    for (let i = 0; i < 14; i++) { const a = pesado([["TREINAMENTOS", 7], ["SOLUÇÕES", 4], ["SUGESTÕES DE MELHORIA", 1], ["RECLAMAÇÕES", 1], ["DENÚNCIAS", 1]]); const an = a === "DENÚNCIAS"; const n = an ? "" : pick(nomes), e = pesado(empresas), [c, u] = pesado(cidades); reg.push({ id: id++, tipo: "contato", criado: quando(80), assunto: a, nome: n, empresa: an ? "" : e, cargo: an ? "" : pesado(cargos), email: an ? "" : email(n, e), telefone: an ? "" : `(11) 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`, cidade: an ? "" : c, uf: an ? "" : u, mensagem: msgs[a], pagina: "fale-conosco.html", status: pick(["novo", "em atendimento", "respondido", "proposta enviada"]) }); }
    const cargosT = C.cargosTrabalheConosco || ["Técnico de Segurança do Trabalho"];
    for (let i = 0; i < 11; i++) { const n = pick(nomes), [c, u] = pesado(cidades); reg.push({ id: id++, tipo: "candidato", criado: quando(70), nome: n, email: email(n), telefone: `(11) 9${Math.floor(1000 + r() * 8999)}-${Math.floor(1000 + r() * 8999)}`, cidade: c, uf: u, cargo_pretendido: pick(cargosT), linkedin: "", mensagem: "Experiência de 6 anos em indústria, com formação em NR 10, NR 33 e NR 35 (exemplo).", arquivo_nome: "curriculo.pdf", tem_arquivo: 1, pagina: "trabalhe-conosco.html", status: pick(["novo", "novo", "em análise", "banco de talentos"]) }); }
    const ag = [];
    const prox = (d, h) => { const x = new Date(agora); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return iso(x); };
    ag.push({ id: 1, titulo: "Reunião de proposta · Metalúrgica Alfa (exemplo)", tipo: "reuniao", inicio: prox(1, 10), fim: prox(1, 11), plataforma: "Microsoft Teams", link: "", participantes: "carlos@metalurgicaalfa.exemplo.com.br", organizador: "comercial@lippmannts.com", descricao: "Apresentação do programa de NR 35 e NR 11.", status: "agendado" });
    ag.push({ id: 2, titulo: "Entrevista · Instrutor de Aprendizagem Industrial (exemplo)", tipo: "entrevista", inicio: prox(3, 14), fim: prox(3, 15), plataforma: "Google Meet", link: "", participantes: "candidato@exemplo.com.br", organizador: "atendimento@lippmannts.com", descricao: "", status: "agendado" });
    ag.push({ id: 3, titulo: "Alinhamento de turma · Logística Horizonte (exemplo)", tipo: "treinamento", inicio: prox(6, 9), fim: prox(6, 10), plataforma: "Google Meet", link: "", participantes: "", organizador: "comercial@lippmannts.com", descricao: "", status: "agendado" });
    return { eventos: ev, registros: reg, agenda: ag };
  }

  function base() {
    let b = ls.get("l3_demo_base", null);
    if (!b || b.versao !== 4) { b = { versao: 4, ...semente(), extra: {}, usuarios: [{ id: 1, ...USU.admin, ativo: 1, ultimo_acesso: "" }, { id: 2, ...USU.marketing, ativo: 1, ultimo_acesso: "" }], config: { emails_notificacao: "atendimento@lippmannts.com, comercial@lippmannts.com, lippmannts@gmail.com", boas_vindas_assunto: "Bem-vindo(a) à Newsletter LIPPMANN", boas_vindas_texto: "Obrigado por se cadastrar na Newsletter LIPPMANN.\n\nA partir de agora você receberá conteúdos técnicos sobre Saúde, Segurança e Meio Ambiente, novidades sobre Normas Regulamentadoras e lançamentos de treinamentos e materiais.\n\nSegurança não é prioridade. Segurança é valor." }, emails: [], acessos: [] }; ls.set("l3_demo_base", b); }
    return b;
  }
  const salvar = b => ls.set("l3_demo_base", b);

  // formulários enviados no site durante o teste (layout.js grava em lts_demo_db)
  function doSite() {
    const s = ls.get("lts_demo_db", {});
    const mapa = d => ({ nome: d["Nome completo"] || d.Nome || "", email: d["E-mail"] || "", telefone: d["Celular / WhatsApp"] || d.Telefone || "", empresa: d.Empresa || "", cargo: d.Cargo || "", cidade: d.Cidade || "", uf: d.Estado || "", origem: d["Como conheceu a LIPPMANN"] || "", assunto: d.Assunto || d._material || "", mensagem: d.Mensagem || "", cargo_pretendido: d["Cargo pretendido"] || "", linkedin: d.LinkedIn || "", arquivo_nome: d.curriculo || "", tem_arquivo: d.curriculo ? 1 : 0, pagina: d._pagina || "" });
    const pad = n => String(n).padStart(2, "0");
    const iso = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    const regs = (s.registros || []).map(x => ({ id: x.id, tipo: x.tipo, criado: iso(x.criado), status: x.tipo === "newsletter" ? "ativo" : "novo", ...mapa(x.dados) }));
    const evs = (s.eventos || []).map(e => [iso(e.t), e.tipo, e.alvo || "", e.pagina || "", e.visitante || "", e.segundos ?? null, "Jundiaí", "SP", /mobi|android|iphone/i.test(navigator.userAgent) ? "celular" : "computador", e.ref || "", e.sessao || ""]);
    return { regs, evs };
  }

  const ok = (x = {}) => Promise.resolve({ ok: true, ...x });
  /* LIPP (assistente virtual): conversas guardadas neste navegador pelo widget do site; exemplos fictícios na primeira abertura */
  function lippDemo() {
    const d = ls.get("l3_demo_lipp", null) || {};
    if (!d.semeado) {
      const h = (dd, hh) => { const x = new Date(); x.setDate(x.getDate() - dd); x.setHours(hh, 12, 0, 0); return x.toISOString(); };
      const prox = () => { const x = new Date(); x.setDate(x.getDate() + ((8 - x.getDay()) % 7 || 7)); x.setUTCHours(13, 0, 0, 0); return x.toISOString(); };
      const ex = [
        { id: "demo-c1", criado: h(1, 10), pagina: "treinamentos.html", geo_cidade: "Campinas", geo_uf: "SP", temas: ["Trabalho em altura (NR 35)", "Preço / orçamento", "Agendamento de reunião"], modo: "base", status: "agendada", lead: true, agendou: true, lead_nome: "Mariana Exemplo", lead_email: "mariana@empresa-exemplo.com.br", lead_telefone: "(19) 90000-0000", lead_empresa: "Metalúrgica Exemplo", necessidade: "NR 35 para 25 colaboradores em Campinas, em junho.",
          msgs: [{ papel: "usuario", texto: "Preciso de treinamento de NR 35 para 25 pessoas", criado: h(1, 10) }, { papel: "lipp", modo: "base", texto: "Encontrei estas opções no nosso portfólio: NR 35 · Trabalho em Altura… Para indicar o formato ideal, me conte: quantos colaboradores, em qual cidade e para quando você precisa?", criado: h(1, 10) }, { papel: "usuario", texto: "Campinas, em junho. Quanto custa?", criado: h(1, 10) }, { papel: "lipp", modo: "base", texto: "Para treinamentos presenciais e in company, o investimento depende do número de participantes, da cidade e da carga horária. Quer agendar uma conversa rápida com um consultor?", criado: h(1, 10) }] },
        { id: "demo-c2", criado: h(3, 15), pagina: "solucoes.html", geo_cidade: "São Paulo", geo_uf: "SP", temas: ["PGR / GRO / inventário", "Laudos (LTCAT, insalubridade, periculosidade)"], modo: "base", status: "lead", lead: true, lead_nome: "Carlos Exemplo", lead_email: "carlos@exemplo.com.br", lead_empresa: "Logística Exemplo", necessidade: "Atualização do PGR e LTCAT de um centro de distribuição.",
          msgs: [{ papel: "usuario", texto: "Vocês fazem PGR e LTCAT?", criado: h(3, 15) }, { papel: "lipp", modo: "base", texto: "Sim! Elaboramos o PGR e laudos técnicos como LTCAT, insalubridade e periculosidade. Quer receber uma proposta?", criado: h(3, 15) }] },
        { id: "demo-c3", criado: h(5, 9), pagina: "unilts.html", temas: ["Cursos EaD UniLTS", "Certificado"], modo: "base", status: "aberta",
          msgs: [{ papel: "usuario", texto: "O curso on-line dá certificado?", criado: h(5, 9) }, { papel: "lipp", modo: "base", texto: "Os certificados da UniLTS têm QR Code e podem ser validados por qualquer pessoa em lippmannts.com/validar.html.", criado: h(5, 9) }] },
      ].map(c => ({ ...c, atualizado: c.criado, mensagens: c.msgs.length, idioma: "pt-BR" }));
      const ini = prox();
      d.conversas = [...(d.conversas || []), ...ex];
      d.agendamentos = [...(d.agendamentos || []), { id: 1, conversa_id: "demo-c1", nome: "Mariana Exemplo", email: "mariana@empresa-exemplo.com.br", telefone: "(19) 90000-0000", empresa: "Metalúrgica Exemplo", necessidade: "NR 35 para 25 colaboradores em Campinas.", inicio: ini, fim: new Date(new Date(ini).getTime() + 1800000).toISOString(), status: "solicitado", meet_url: null, criado: h(1, 10) }];
      d.semeado = true; ls.set("l3_demo_lipp", d);
    }
    return d;
  }

  const nao = (m, extra = {}) => Promise.resolve({ ok: false, mensagem: m, ...extra });

  window.L3_DEMO = {
    async call(acao, { corpo = {}, query = "", form } = {}) {
      await new Promise(r => setTimeout(r, 120));
      const b = base();
      if (acao === "login") {
        const u = String(corpo.usuario || "").toLowerCase();
        const okSenha = HASH[u] && (await sha(corpo.senha || "")) === HASH[u];
        b.acessos.unshift({ t: new Date().toISOString().replace("T", " ").slice(0, 19), usuario: u, ok: okSenha ? 1 : 0 }); salvar(b);
        if (!okSenha) return nao("Usuário ou senha incorretos.");
        sessao = USU[u]; try { sessionStorage.setItem("l3_demo_sessao", JSON.stringify(sessao)); } catch (e) {}
        return ok({ usuario: sessao, token: "demo", senha_padrao: false });
      }
      if (acao === "logout") { sessao = null; try { sessionStorage.removeItem("l3_demo_sessao"); } catch (e) {} return ok(); }
      if (acao === "sessao") return sessao ? ok({ usuario: sessao, token: "demo" }) : nao("");
      if (!sessao) return nao("Sessão expirada.");
      const adm = sessao.perfil === "admin";
      const exige = { config: ["notificacoes", "materiais"], config_salvar: ["notificacoes"], email_teste: ["notificacoes"], emails_log: ["seguranca"], usuarios: ["usuarios"], usuario_salvar: ["usuarios"], usuario_excluir: ["usuarios"], materiais: ["materiais"], material_salvar: ["materiais"], material_excluir: ["materiais"], agenda_salvar: ["agenda"], agenda_excluir: ["agenda"], agenda_convite: ["agenda"], hub_listar: ["hub"], hub_salvar: ["hub"], hub_excluir: ["hub"], catalogo_listar: ["catalogo"], catalogo_salvar: ["catalogo"], catalogo_excluir: ["catalogo"], solucoes_listar: ["solucoes"], solucoes_salvar: ["solucoes"], solucoes_excluir: ["solucoes"], solucoes_grupos: ["solucoes"], ouv_listar: ["denuncias"], ouv_detalhe: ["denuncias"], ouv_responder: ["denuncias"], lipp_resumo: ["lipp"], lipp_conversa: ["lipp"], lipp_agendamento_salvar: ["lipp"], i18n_listar: ["traducoes"], i18n_salvar: ["traducoes"], i18n_fontes: ["traducoes"], politicas_listar: ["politicas"], politicas_salvar: ["politicas"], politicas_excluir: ["politicas"] }[acao];
      const perms = adm ? Object.keys(ABAS) : (sessao.permissoes || []);
      if (/^fin_/.test(acao)) {   // Financeiro e BI: simulado por assets/js/uni-demo.js
        if (!perms.includes("financeiro")) return nao("Acesso negado (Unauthorized): seu usuário não tem permissão para «Financeiro e BI».");
        const r = window.UNI_DEMO && await window.UNI_DEMO.painel(acao, corpo || {}, Object.fromEntries(new URLSearchParams(query || "")));
        return r || nao("Ação indisponível na demonstração.");
      }
      if (/^uni_/.test(acao)) {   // UniLTS: simulado por assets/js/uni-demo.js
        if (!perms.includes("unilts")) return nao("Acesso negado (Unauthorized): seu usuário não tem permissão para «UniLTS».");
        if (acao === "uni_ajustar_numero" && !adm) return nao("Somente o superadministrador pode ajustar a numeração das turmas.");
        const r = window.UNI_DEMO && await window.UNI_DEMO.painel(acao, corpo || {}, Object.fromEntries(new URLSearchParams(query || "")));
        return r || nao("Ação indisponível na demonstração.");
      }
      if (exige && !exige.some(x => perms.includes(x))) return nao("Acesso negado (Unauthorized): seu usuário não tem permissão para esta aba.");

      switch (acao) {
        case "dados": {
          const s = doSite();
          const ext = b.extra || {};
          let regs = [...s.regs, ...b.registros].map(r => ({ ...r, ...(ext[r.id] || {}) })).filter(r => !(ext[r.id] && ext[r.id].excluido));
          if (!adm) regs = regs.filter(r => r.tipo !== "candidato" && !(r.tipo === "contato" && ["DENÚNCIAS", "RECLAMAÇÕES"].includes(r.assunto)));
          regs.sort((a, c) => String(c.criado).localeCompare(String(a.criado)));
          return ok({ eventos: [...b.eventos, ...s.evs].sort((a, c) => String(a[0]).localeCompare(String(c[0]))), registros: regs, agenda: b.agenda.slice().sort((a, c) => String(a.inicio).localeCompare(String(c.inicio))), contas_agenda: ["atendimento@lippmannts.com", "comercial@lippmannts.com"] });
        }
        case "registro_atualizar": b.extra[corpo.id] = { ...(b.extra[corpo.id] || {}), status: corpo.status, notas: corpo.notas }; salvar(b); return ok();
        case "registro_excluir": b.extra[corpo.id] = { excluido: true }; salvar(b); return ok();
        case "agenda_salvar": {
          const d = { ...corpo, inicio: String(corpo.inicio).replace("T", " ") + ":00", fim: String(corpo.fim).replace("T", " ") + ":00" };
          if (d.id) b.agenda = b.agenda.map(a => String(a.id) === String(d.id) ? { ...a, ...d } : a);
          else { d.id = Math.max(0, ...b.agenda.map(a => a.id)) + 1; b.agenda.push(d); }
          if (d.registro_id && d.tipo === "entrevista") b.extra[d.registro_id] = { ...(b.extra[d.registro_id] || {}), status: "entrevista agendada" };
          salvar(b); return ok({ id: d.id });
        }
        case "agenda_excluir": b.agenda = b.agenda.filter(a => String(a.id) !== String(corpo.id)); salvar(b); return ok();
        case "agenda_convite": {
          const a = b.agenda.find(x => String(x.id) === String(corpo.id));
          if (!a || !a.participantes) return nao("Inclua ao menos um participante (e-mail).");
          a.convite_enviado = new Date().toISOString(); b.emails.unshift({ t: new Date().toISOString().replace("T", " ").slice(0, 19), para: a.participantes, assunto: "Convite: " + a.titulo, ok: 1, erro: "" }); salvar(b);
          return ok({ mensagem: "Demonstração: no servidor, o convite (.ics) seria enviado para " + a.participantes + "." });
        }
        case "config": return ok({ config: b.config, smtp: { host: "", configurado: false, remetente: "atendimento@lippmannts.com" }, github: "https://github.com/SEU-USUARIO/lippmannts" });
        case "config_salvar": Object.assign(b.config, corpo); salvar(b); return ok();
        case "email_teste": return ok({ mensagem: "Demonstração: no servidor, um e-mail de teste seria enviado agora." });
        case "emails_log": return ok({ log: b.emails, acessos: b.acessos.slice(0, 100) });
        case "site_salvar": return ok({ mensagem: "Demonstração: no servidor, o arquivo assets/js/config.js seria atualizado." });
        case "usuarios": return ok({ abas: ABAS, usuarios: b.usuarios });
        case "usuario_excluir": {
          const alvo = b.usuarios.find(u => String(u.id) === String(corpo.id));
          if (alvo && alvo.usuario === sessao.usuario) return nao("Você não pode excluir o seu próprio usuário.");
          b.usuarios = b.usuarios.filter(u => String(u.id) !== String(corpo.id)); salvar(b); return ok();
        }
        case "usuario_salvar": {
          if (!/^[a-z0-9._-]{3,40}$/.test(String(corpo.usuario || ""))) return nao("Usuário: use de 3 a 40 letras minúsculas, números, ponto ou hífen.");
          if (!corpo.id && String(corpo.senha || "").length < 10) return nao("A senha deve ter ao menos 10 caracteres.");
          if (corpo.id) b.usuarios = b.usuarios.map(u => String(u.id) === String(corpo.id) ? { ...u, ...corpo, senha: undefined } : u);
          else b.usuarios.push({ id: Math.max(...b.usuarios.map(u => u.id)) + 1, usuario: corpo.usuario, nome: corpo.nome, email: corpo.email, perfil: corpo.perfil, permissoes: corpo.permissoes || [], ativo: corpo.ativo, ultimo_acesso: "" });
          salvar(b); return ok();
        }
        case "minha_senha": return String(corpo.nova || "").length < 10 ? nao("A nova senha deve ter ao menos 10 caracteres.") : ok({ mensagem: "Demonstração: no servidor, a senha seria alterada." });
        case "materiais": return ok({ materiais: ls.get("l3_demo_mat", window.LTS_CONTEUDOS || []) });
        case "material_salvar": {
          const lista = ls.get("l3_demo_mat", window.LTS_CONTEUDOS || []);
          const d = { ...(corpo || {}) }; delete d.pdf;
          d.id = d.id || d.titulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const i = lista.findIndex(m => m.id === d.id);
          if (i >= 0) lista[i] = { ...lista[i], ...d }; else lista.push({ ...d, arquivo: "" });
          ls.set("l3_demo_mat", lista); return ok({ materiais: lista });
        }
        case "material_excluir": { const lista = ls.get("l3_demo_mat", window.LTS_CONTEUDOS || []).filter(m => m.id !== corpo.id); ls.set("l3_demo_mat", lista); return ok({ materiais: lista }); }
        /* ---------- Site e conteúdo (gravado neste navegador; o site em modo demonstração lê daqui) ---------- */
        case "hub_listar": return ok({ itens: listaHub() });
        case "hub_salvar": {
          const l = listaHub(), d = { ...corpo, tags: String(corpo.tags || "").split(/[,\n]/).map(x => x.trim()).filter(Boolean), youtube: idYt(corpo.youtube) };
          if (d.id) { const i = l.findIndex(x => String(x.id) === String(d.id)); if (d.publicado && !l[i].publicado_em) d.publicado_em = new Date().toISOString(); l[i] = { ...l[i], ...d }; }
          else { d.id = Math.max(0, ...l.map(x => +x.id || 0)) + 1; d.slug = slug(d.titulo); d.criado = new Date().toISOString(); if (d.publicado) d.publicado_em = d.criado; l.unshift(d); }
          ls.set("l3_demo_hub", l); return ok({ id: d.id });
        }
        case "hub_excluir": ls.set("l3_demo_hub", listaHub().filter(x => String(x.id) !== String(corpo.id))); return ok();
        case "catalogo_listar": return ok({ treinamentos: listaCat() });
        case "catalogo_salvar": {
          const l = listaCat(), linhas = v => String(v || "").split("\n").map(x => x.trim()).filter(Boolean);
          const d = { ...corpo, id: corpo.id || slug(corpo.titulo), tags: String(corpo.tags || "").split(",").map(x => x.trim()).filter(Boolean), youtube: idYt(corpo.youtube), aprender: linhas(corpo.aprender), publico: linhas(corpo.publico), beneficios: linhas(corpo.beneficios), ordem: +corpo.ordem || 100, ativo: !!+corpo.ativo };
          const i = l.findIndex(x => x.id === d.id); if (i >= 0) l[i] = { ...l[i], ...d }; else l.push(d);
          ls.set("l3_demo_cat", l); return ok({ id: d.id });
        }
        case "catalogo_excluir": ls.set("l3_demo_cat", listaCat().filter(x => x.id !== corpo.id)); return ok();
        case "solucoes_listar": return ok({ solucoes: listaSol(), grupos: gruposSol() });
        case "solucoes_salvar": {
          if (!String(corpo.titulo || "").trim()) return nao("Informe o título da solução."); if (!String(corpo.texto || "").trim()) return nao("Escreva a descrição da solução.");
          const l = listaSol(), d = { ...corpo, id: corpo.id || slug(corpo.titulo), ordem: +corpo.ordem || 100, ativo: !!+corpo.ativo };
          const i = l.findIndex(x => x.id === d.id); if (i >= 0) l[i] = { ...l[i], ...d }; else l.push(d);
          l.sort((a, c) => a.ordem - c.ordem); ls.set("l3_demo_sol", l); return ok({ id: d.id });
        }
        case "solucoes_excluir": ls.set("l3_demo_sol", listaSol().filter(x => x.id !== corpo.id)); return ok();
        case "solucoes_grupos": { const g = {}; (corpo.grupos || []).forEach(x => { const k = x.id || slug(x.nome); if (k && x.nome) g[k] = x.nome; }); if (!Object.keys(g).length) return nao("Mantenha pelo menos um grupo."); ls.set("l3_demo_sol_grupos", g); return ok({ grupos: g }); }
        case "i18n_listar": { const t = ls.get("l3_demo_i18n", {})[query && new URLSearchParams(query).get("l") || ""] || {}; return ok({ textos: Object.entries(t).map(([pt, traducao]) => ({ pt, traducao, atualizado: null, atualizado_por: "admin" })) }); }
        case "i18n_salvar": {
          const tudo = ls.get("l3_demo_i18n", {}), l = corpo.idioma; if (!["pt-PT", "en-US", "en-GB", "es-ES"].includes(l)) return nao("Idioma inválido.");
          tudo[l] = tudo[l] || {}; const pt = String(corpo.pt || "").replace(/\s+/g, " ").trim(); if (!pt) return nao("Texto original vazio.");
          if (String(corpo.traducao || "").trim()) tudo[l][pt] = String(corpo.traducao).replace(/\s+/g, " ").trim(); else delete tudo[l][pt];
          ls.set("l3_demo_i18n", tudo); return ok();
        }
        case "i18n_fontes": return ok({ catalogo: listaCat(), solucoes: listaSol(), grupos: gruposSol(), hub: listaHub(), politicas: listaPol(), cursos: (window.UNI_DEMO && window.UNI_DEMO.cursosDemo ? window.UNI_DEMO.cursosDemo() : []) });
        case "ouv_listar": {
          const O = window.LTS_OUV_DEMO; if (!O) return ok({ protocolos: [] });
          if (!ls.get("l3_demo_ouv_semeado", false) && !O.listar().length) {   // exemplos fictícios na primeira abertura
            O.criar({ assunto: "SUGESTÕES DE MELHORIA", nome: "Paulo Exemplo", email: "paulo@exemplo.com.br", mensagem: "Sugiro disponibilizar o certificado também em inglês para colaboradores estrangeiros." });
            O.criar({ assunto: "RECLAMAÇÕES", nome: "Carla Exemplo", email: "carla@exemplo.com.br", mensagem: "O e-mail com a senha provisória foi para a caixa de spam." });
            O.criar({ assunto: "DENÚNCIAS", mensagem: "Relato anônimo de exemplo: instrutor sem EPI durante a aula prática." });
            const l = O.listar(); const rec = l.find(x => x.tipo === "reclamacao"); if (rec) O.responder(rec.id, "Olá, Carla! Ajustamos o remetente e o domínio para evitar o spam. Obrigado pelo aviso.", "respondido", true);
            ls.set("l3_demo_ouv_semeado", true);
          }
          return ok({ protocolos: O.listar() });
        }
        case "ouv_detalhe": { const p = window.LTS_OUV_DEMO && window.LTS_OUV_DEMO.detalhe(new URLSearchParams(query || "").get("id")); return p ? ok({ protocolo: p, historico: p.historico }) : nao("Protocolo não encontrado."); }
        case "ouv_responder": return window.LTS_OUV_DEMO ? window.LTS_OUV_DEMO.responder(corpo.id, corpo.texto, corpo.status, corpo.publico !== "0") : nao("Indisponível.");
        case "lipp_resumo": {
          const d = lippDemo(), dias = +new URLSearchParams(query || "").get("dias") || 30, desde = Date.now() - dias * 86400000;
          const cv = (d.conversas || []).filter(c => new Date(c.criado).getTime() >= desde);
          const temas = {}; cv.forEach(c => (c.temas || []).forEach(x => { temas[x] = (temas[x] || 0) + 1; }));
          const pg = {}; cv.forEach(c => { const m = (c.msgs || []).find(x => x.papel === "usuario"); if (m) { const k = m.texto.toLowerCase().slice(0, 90); pg[k] = pg[k] || { texto: m.texto, n: 0 }; pg[k].n++; } });
          const fh = v => new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
          return ok({ ia: false, google: false, dias, conversas: cv.map(c => ({ ...c, msgs: undefined, criado: fh(c.criado), atualizado: fh(c.atualizado) })), agendamentos: (d.agendamentos || []).map(a => ({ ...a, quando: new Date(a.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }), criado: fh(a.criado) })), temas: Object.entries(temas).sort((a, z) => z[1] - a[1]).slice(0, 15), perguntas: Object.values(pg).sort((a, z) => z.n - a.n).slice(0, 15) });
        }
        case "lipp_conversa": {
          const c = (lippDemo().conversas || []).find(x => x.id === new URLSearchParams(query || "").get("id")); if (!c) return nao("Conversa não encontrada.");
          const fh = v => new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
          return ok({ conversa: { ...c, criado: fh(c.criado) }, mensagens: (c.msgs || []).map(m => ({ ...m, criado: m.criado ? fh(m.criado) : "" })) });
        }
        case "lipp_agendamento_salvar": {
          const d = lippDemo(), a = (d.agendamentos || []).find(x => x.id == corpo.id); if (!a) return nao("Agendamento não encontrado.");
          if (corpo.meet_url && !/^https:\/\//.test(corpo.meet_url)) return nao("O link da reunião deve começar com https://");
          Object.assign(a, { status: corpo.status || a.status, meet_url: corpo.meet_url || null, observacao: corpo.observacao || null });
          ls.set("l3_demo_lipp", d); return ok({ mensagem: corpo.avisar ? "Agendamento atualizado. (Demonstração: no site oficial o e-mail de confirmação é enviado ao visitante.)" : "Agendamento atualizado." });
        }
        case "politicas_listar": return ok({ politicas: listaPol() });
        case "politicas_salvar": {
          const l = listaPol(), d = { ...corpo, id: corpo.id || slug(corpo.titulo), ordem: +corpo.ordem || 100, ativo: !!+corpo.ativo };
          const i = l.findIndex(x => x.id === d.id); if (i >= 0) l[i] = { ...l[i], ...d }; else l.push(d);
          l.sort((a, c) => a.ordem - c.ordem); ls.set("l3_demo_pol", l); return ok({ id: d.id });
        }
        case "politicas_excluir": ls.set("l3_demo_pol", listaPol().filter(x => x.id !== corpo.id)); return ok();
        case "arquivo_upload": return nao("Na demonstração os arquivos ficam no próprio navegador.");
        case "arquivos": return ok({ arquivos: ["index.html", "a-lippmann.html", "treinamentos.html", "solucoes.html", "conteudo.html", "fale-conosco.html", "trabalhe-conosco.html", "assets/css/style.css", "assets/js/config.js", "assets/js/layout.js", "assets/js/catalogo.js", "data/treinamentos.js", "data/solucoes.js", "data/conteudos.js"].map(c => ({ caminho: c })) });
        case "arquivo": {
          const caminho = decodeURIComponent((query.split("caminho=")[1] || ""));
          try { const r = await fetch("/" + caminho); return ok({ conteudo: r.ok ? await r.text() : "Arquivo indisponível na demonstração." }); }
          catch (e) { return ok({ conteudo: "Arquivo indisponível na demonstração." }); }
        }
      }
      return nao("Ação indisponível na demonstração.");
    }
  };
})();
