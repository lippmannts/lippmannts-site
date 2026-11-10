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
  const USU = { admin: { usuario: "admin", nome: "Administrador", perfil: "admin" }, marketing: { usuario: "marketing", nome: "Marketing", perfil: "marketing" } };
  const ls = {
    get(k, p) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (e) { return p; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
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
    if (!b || b.versao !== 3) { b = { versao: 3, ...semente(), extra: {}, usuarios: [{ id: 1, ...USU.admin, ativo: 1, ultimo_acesso: "" }, { id: 2, ...USU.marketing, ativo: 1, ultimo_acesso: "" }], config: { emails_notificacao: "atendimento@lippmannts.com, comercial@lippmannts.com, lippmannts@gmail.com", boas_vindas_assunto: "Bem-vindo(a) à Newsletter LIPPMANN", boas_vindas_texto: "Obrigado por se cadastrar na Newsletter LIPPMANN.\n\nA partir de agora você receberá conteúdos técnicos sobre Saúde, Segurança e Meio Ambiente, novidades sobre Normas Regulamentadoras e lançamentos de treinamentos e materiais.\n\nSegurança não é prioridade. Segurança é valor." }, emails: [], acessos: [] }; ls.set("l3_demo_base", b); }
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
      const somenteAdmin = ["config", "config_salvar", "email_teste", "emails_log", "site_salvar", "usuarios", "usuario_salvar", "materiais", "material_salvar", "material_excluir", "arquivos", "arquivo", "registro_excluir"];
      if (somenteAdmin.includes(acao) && !adm) return nao("Seu perfil não tem permissão para esta ação.");

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
        case "usuarios": return ok({ usuarios: b.usuarios });
        case "usuario_salvar": {
          if (!/^[a-z0-9._-]{3,40}$/.test(String(corpo.usuario || ""))) return nao("Usuário: use de 3 a 40 letras minúsculas, números, ponto ou hífen.");
          if (!corpo.id && String(corpo.senha || "").length < 10) return nao("A senha deve ter ao menos 10 caracteres.");
          if (corpo.id) b.usuarios = b.usuarios.map(u => String(u.id) === String(corpo.id) ? { ...u, ...corpo, senha: undefined } : u);
          else b.usuarios.push({ id: Math.max(...b.usuarios.map(u => u.id)) + 1, usuario: corpo.usuario, nome: corpo.nome, email: corpo.email, perfil: corpo.perfil, ativo: corpo.ativo, ultimo_acesso: "" });
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
