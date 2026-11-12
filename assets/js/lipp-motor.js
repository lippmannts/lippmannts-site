/* =====================================================================
   LIPP · motor de conhecimento do assistente virtual da LIPPMANN
   Usado em dois lugares:
   - no servidor (/api/lipp): monta a base de conhecimento enviada à IA e responde
     sozinho quando a IA não está configurada ou fica indisponível;
   - no navegador, no modo demonstração (sem servidor).
   ===================================================================== */
(function (raiz) {
  "use strict";
  const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const CONTATO = { whatsapp: "(11) 94013-8792", whatsappLink: "https://wa.me/5511940138792", email: "comercial@lippmannts.com", atendimento: "atendimento@lippmannts.com", site: "https://lippmannts.com" };

  /* sinônimos que ajudam a ligar a pergunta do visitante ao portfólio */
  const SINONIMOS = {
    "nr35": ["altura", "andaime", "telhado", "queda", "cinto", "talabarte", "nr 35"],
    "nr33": ["confinado", "tanque", "silo", "vigia", "pet", "nr 33"],
    "nr10": ["eletric", "eletrica", "energia", "sep", "choque", "nr 10", "painel eletrico"],
    "nr11": ["empilhadeira", "ponte rolante", "munck", "talha", "paleteira", "transpaleteira", "carga", "plataforma elevatoria", "pemt", "tesoura", "nr 11"],
    "nr12": ["maquina", "equipamento", "prensa", "nr 12"],
    "nr13": ["caldeira", "vaso de pressao", "nr 13"],
    "nr05": ["cipa", "nr 05", "nr 5", "comissao interna"],
    "nr06": ["epi", "protecao individual", "nr 06", "nr 6"],
    "nr17": ["ergonomia", "postura", "aet", "aep", "nr 17"],
    "nr18": ["construcao", "obra", "canteiro", "nr 18"],
    "nr20": ["inflamavel", "inflamaveis", "combustivel", "posto", "nr 20"],
    "nr26": ["sinalizacao", "cores", "ghs", "fds", "nr 26"],
    "brigada": ["incendio", "brigada", "extintor", "bombeiro", "abandono", "evacuacao"],
    "assedio": ["assedio", "violencia", "lei 14.457", "denuncia"],
    "lideranca": ["lider", "lideranca", "supervisor", "gestor", "cultura de seguranca"],
    "integracao": ["integracao", "nr 01", "nr01", "admissional", "novos colaboradores", "gro", "pgr"],
    "indicadores": ["indicador", "kpi", "dashboard", "gestao de ssma"],
  };
  const TEMAS = [
    ["Trabalho em altura (NR 35)", /altura|nr ?35|andaime|telhado/],
    ["Espaço confinado (NR 33)", /confinad|nr ?33|vigia/],
    ["Eletricidade (NR 10)", /eletric|nr ?10|\bsep\b/],
    ["Movimentação de cargas (NR 11)", /empilhadeira|ponte rolante|munck|nr ?11|paleteira|pemt|plataforma/],
    ["Máquinas (NR 12)", /maquina|nr ?12|prensa/],
    ["CIPA (NR 05)", /cipa|nr ?0?5\b/],
    ["Brigada e incêndio", /brigada|incendio|extintor|evacua/],
    ["EPI (NR 06)", /\bepi\b|nr ?0?6\b/],
    ["Ergonomia (NR 17)", /ergonom|nr ?17|\baet\b/],
    ["Construção civil (NR 18)", /constru|obra|nr ?18/],
    ["Inflamáveis (NR 20)", /inflama|combust|nr ?20/],
    ["Assédio", /assedio/],
    ["Liderança e cultura", /lider|cultura/],
    ["PGR / GRO / inventário", /\bpgr\b|\bgro\b|inventario/],
    ["Laudos (LTCAT, insalubridade, periculosidade)", /laudo|ltcat|insalubr|periculos/],
    ["Plano de emergência / simulados", /\bpae\b|simulado|emergencia/],
    ["Meio ambiente", /ambiental|meio ambiente|residuo/],
    ["Cursos EaD UniLTS", /ead|online|on-line|distancia|unilts|ava\b/],
    ["Preço / orçamento", /preco|valor|quanto|orcamento|custa|proposta/],
    ["Certificado", /certificad|validar|qr ?code/],
    ["Reembolso / cancelamento", /reembols|cancel|estorno|arrependimento/],
    ["Agendamento de reunião", /reuniao|agendar|marcar|meet|consultor|conversar/],
  ];
  function temas(texto) { const t = semAcento(texto); return TEMAS.filter(([, re]) => re.test(t)).map(([n]) => n); }

  /* base de conhecimento a partir dos dados do site */
  function montarBase(fontes) {
    const tr = (fontes.treinamentos || []).filter((t) => t.ativo !== false).map((t) => ({ id: t.id, titulo: t.titulo, nr: t.nr || "", resumo: t.resumo || "", carga: t.carga_horaria || "", modalidade: t.modalidade || "", publico: (t.publico || []).slice(0, 4), tags: t.tags || [], categoria: t.categoria }));
    const sol = (fontes.solucoes || []).filter((s) => s.ativo !== false).map((s) => ({ id: s.id, titulo: s.titulo, texto: s.texto || "" }));
    const cursos = (fontes.cursos || []).filter((c) => c.ativo !== false && !c.interno).map((c) => ({ id: c.id, titulo: c.titulo, nr: c.nr || "", carga: Number(c.carga_horaria) || 0, preco: Number(c.preco) || 0, venda: !!c.venda_online }));
    return { treinamentos: tr, solucoes: sol, cursos, contato: CONTATO };
  }

  /* texto compacto da base, para a IA */
  function baseComoTexto(kb) {
    const brl = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
    return [
      "EMPRESA: LIPPMANN Treinamentos e Soluções (LTS), Jundiaí/SP, CNPJ 53.000.126/0001-22. Manifesto: \"Segurança não é prioridade. Segurança é valor.\" Atua com treinamentos normativos (NRs), desenvolvimento humano e soluções técnicas em SSMA (Saúde, Segurança e Meio Ambiente), presencial, on-line ao vivo e in company, com metodologia ativa e instrutores com experiência de campo. 10% do lucro líquido vão para ações sociais (Termo de Compromisso Social).",
      `CONTATO: WhatsApp ${CONTATO.whatsapp} · comercial: ${CONTATO.email} · atendimento: ${CONTATO.atendimento} · site ${CONTATO.site}`,
      "TREINAMENTOS (página lippmannts.com/treinamentos.html#ID):",
      ...kb.treinamentos.map((t) => `- [${t.id}] ${t.titulo}${t.nr ? ` (${t.nr})` : ""} · carga: ${t.carga || "conforme norma"} · ${t.modalidade || ""} · ${t.resumo}`),
      "SOLUÇÕES TÉCNICAS (lippmannts.com/solucoes.html#ID):",
      ...kb.solucoes.map((s) => `- [${s.id}] ${s.titulo}: ${s.texto}`),
      "UNILTS (EaD, compra on-line em lippmannts.com/unilts.html, PIX ou cartão em até 12x, certificado com QR Code, reembolso em 7 dias por pedido formal):",
      ...(kb.cursos.length ? kb.cursos.map((c) => `- ${c.titulo} · ${c.carga} h${c.venda && c.preco ? ` · ${brl(c.preco)}` : " · consulte"}`) : ["- (catálogo EaD em atualização)"]),
      "PREÇOS: para turmas presenciais e in company NÃO existe tabela pública: o valor depende de número de participantes, local, carga horária e equipamentos; o consultor envia proposta personalizada. Só informe preços dos cursos EaD listados acima.",
      "ÁREAS: Área do Aluno (lippmannts.com/unilts), Área da Empresa (/empresa), Painel do Parceiro (/parceiro), Validar certificado (/validar.html), Consultar compra (/pedido.html), Ouvidoria com protocolo (/fale-conosco.html e /protocolo.html), Central de Ajuda (/ajuda.html).",
    ].join("\n");
  }

  function pontuar(texto, alvo, extras) {
    const t = semAcento(texto), palavras = t.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    const a = semAcento(alvo);
    let p = 0;
    palavras.forEach((w) => { if (a.includes(w)) p += w.length > 4 ? 2 : new RegExp("\\b" + w + "\\b").test(a) ? 3 : 1; });
    (extras || []).forEach((e) => { if (t.includes(semAcento(e))) p += 4; });
    return p;
  }
  function chaveDe(t) {
    const nr = String(t.nr || "").match(/NR\s*0?(\d+)/i);
    if (nr) return "nr" + String(nr[1]).padStart(2, "0");
    if (/brigada/i.test(t.titulo)) return "brigada"; if (/assedio|assédio/i.test(t.titulo)) return "assedio"; if (/lideran/i.test(t.titulo)) return "lideranca"; if (/integra/i.test(t.titulo)) return "integracao"; if (/indicador|gest/i.test(t.titulo)) return "indicadores";
    return "";
  }

  /* resposta sem IA (base de conhecimento + regras) */
  function responder(texto, kb, ctx = {}) {
    const t = semAcento(texto).trim(), brl = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
    const sugestoes = ["Agendar reunião com um consultor", "Ver cursos on-line (UniLTS)", "Falar no WhatsApp"];
    if (!t) return { texto: "Pode me contar o que você precisa?", sugestoes };
    if (/^(oi|ola|bom dia|boa tarde|boa noite|hello|hi|hola|e ai)\b/.test(t) && t.length < 25)
      return { texto: "Olá! Eu sou o LIPP, assistente virtual da LIPPMANN. Posso ajudar a escolher o treinamento ou a solução de SSMA ideal para a sua empresa, tirar dúvidas sobre os cursos on-line e agendar uma reunião pelo Google Meet com um consultor. Qual é a sua necessidade hoje?", sugestoes: ["Preciso de treinamento de NR", "Preciso de PGR ou laudos", ...sugestoes.slice(0, 2)] };
    if (/(reuniao|agendar|agenda|marcar|meet|videochamada|consultor|especialista|falar com (alguem|uma pessoa|vendedor)|ligacao)/.test(t))
      return { texto: "Perfeito! Vou agendar uma conversa de 30 minutos pelo Google Meet com um consultor da LIPPMANN (segunda a sexta, das 9h às 17h). Escolha um horário e informe seus dados.", acao: "agendar", sugestoes: [] };
    if (/(horario|funcionamento|atendem|abre|fecha|expediente)/.test(t) && !/(reuniao|agendar|marcar)/.test(t))
      return { texto: `Nosso atendimento comercial funciona de segunda a sexta, das 9h às 17h (horário de Brasília). Eu, o LIPP, fico disponível aqui no site 24 horas e posso agendar uma reunião pelo Google Meet com um consultor dentro desse horário. Pelo WhatsApp ${CONTATO.whatsapp} a equipe responde no horário comercial.`, sugestoes };
    if (/(whatsapp|telefone|ligar|contato|e-?mail|endereco)/.test(t))
      return { texto: `Você pode falar com a nossa equipe pelo WhatsApp ${CONTATO.whatsapp} (${CONTATO.whatsappLink}) ou pelo e-mail ${CONTATO.email}. Se preferir, eu agendo uma reunião pelo Google Meet agora mesmo.`, sugestoes };
    if (/(reembols|cancel|estorno|arrependimento|devolu)/.test(t))
      return { texto: "Nas compras on-line da UniLTS você tem 7 dias de direito de arrependimento, com reembolso integral. O cancelamento é feito por pedido formal do titular para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792, informando código da compra, nome completo, CPF, e-mail e forma de pagamento. Acompanhe a compra em lippmannts.com/pedido.html. Após o estorno, o acesso é bloqueado e o certificado, se emitido, é revogado.", sugestoes };
    if (/(certificad|validar|qr ?code|autentic)/.test(t))
      return { texto: "Os certificados da UniLTS têm QR Code e podem ser validados por qualquer pessoa em lippmannts.com/validar.html, com o CPF do titular mascarado (LGPD). Nos treinamentos presenciais, o certificado é emitido após a aprovação nas avaliações teórica e prática.", sugestoes };
    if (/(ead|online|on-line|distancia|unilts|curso gravado|comprar curso)/.test(t) || (/(preco|valor|quanto|custa)/.test(t) && /(curso|online|ead)/.test(t))) {
      const cs = kb.cursos.filter((c) => c.venda && c.preco);
      return { texto: cs.length ? `Na UniLTS, nosso ambiente EaD, você compra on-line com PIX ou cartão em até 12x e recebe o acesso na hora:\n${cs.map((c) => `• ${c.titulo} · ${c.carga} h · ${brl(c.preco)}`).join("\n")}\nVeja em lippmannts.com/unilts.html. Para turmas da sua empresa, preparamos proposta personalizada.` : "Os cursos EaD da UniLTS estão em lippmannts.com/unilts.html. Para turmas da sua empresa, preparamos proposta personalizada.", sugestoes };
    }
    if (/(preco|valor|quanto|orcamento|custa|proposta|cotacao)/.test(t))
      return { texto: "Para treinamentos presenciais e in company, o investimento depende do número de participantes, da cidade, da carga horária e dos equipamentos necessários. Por isso enviamos uma proposta personalizada, normalmente em até 1 dia útil. Quer agendar uma conversa rápida com um consultor ou prefere deixar seus dados para receber a proposta?", sugestoes: ["Agendar reunião com um consultor", "Falar no WhatsApp"], acao: "lead" };
    // portfólio
    const tr = kb.treinamentos.map((x) => ({ x, p: pontuar(t, `${x.titulo} ${x.nr} ${x.resumo} ${(x.tags || []).join(" ")}`, SINONIMOS[chaveDe(x)]) })).filter((y) => y.p >= 3).sort((a, b) => b.p - a.p).slice(0, 3);
    const so = kb.solucoes.map((x) => ({ x, p: pontuar(t, `${x.titulo} ${x.texto}`) })).filter((y) => y.p >= 3).sort((a, b) => b.p - a.p).slice(0, 2);
    if (tr.length || so.length) {
      const linhas = [
        ...tr.map(({ x }) => `• ${x.titulo}${x.carga && !/conforme/i.test(x.carga) ? ` · ${x.carga}` : ""}: ${x.resumo} (lippmannts.com/treinamentos.html#${x.id})`),
        ...so.map(({ x }) => `• ${x.titulo}: ${x.texto} (lippmannts.com/solucoes.html#${x.id})`),
      ];
      return { texto: `Encontrei estas opções no nosso portfólio:\n${linhas.join("\n")}\nPara indicar o formato ideal, me conte: quantos colaboradores, em qual cidade e para quando você precisa?`, sugestoes: ["Agendar reunião com um consultor", "Quero receber uma proposta"], acao: "lead" };
    }
    if (/(lgpd|dados pessoais|privacidade)/.test(t)) return { texto: "Tratamos os dados conforme a LGPD. A Política de Privacidade está em lippmannts.com/politica-de-privacidade.html.", sugestoes };
    if (/(denuncia|reclama|ouvidoria|protocolo)/.test(t)) return { texto: "Denúncias, reclamações e sugestões são registradas pelo Fale Conosco (lippmannts.com/fale-conosco.html) e geram um protocolo para você acompanhar as respostas em lippmannts.com/protocolo.html. Denúncias podem ser anônimas.", sugestoes };
    if (/(trabalhe|vaga|curriculo|emprego)/.test(t)) return { texto: "Envie seu currículo em lippmannts.com/trabalhe-conosco.html, sem precisar criar login. Ele fica no nosso banco de talentos.", sugestoes };
    return { texto: "Não tenho certeza se entendi. Posso ajudar com treinamentos de NR, soluções técnicas (PGR, laudos, AET, planos de emergência), cursos on-line da UniLTS ou agendar uma reunião com um consultor. Pode me contar um pouco mais sobre a sua necessidade?", sugestoes };
  }

  /* horários comerciais livres (segunda a sexta, 9h às 17h, horário de Brasília, reuniões de 30 min) */
  function horariosComerciais(ocupados = [], op = {}) {
    const dias = op.dias || 10, dur = (op.duracao || 30) * 60000, agora = op.agora ? new Date(op.agora) : new Date(), antecedencia = (op.antecedenciaHoras || 2) * 3600000;
    const saida = [];
    const BRT = -3; // Brasil sem horário de verão desde 2019
    const hojeBRT = new Date(agora.getTime() + BRT * 3600000);
    for (let d = 0; saida.length < (op.max || 40) && d < dias + 6; d++) {
      const base = new Date(Date.UTC(hojeBRT.getUTCFullYear(), hojeBRT.getUTCMonth(), hojeBRT.getUTCDate() + d));
      const dow = base.getUTCDay(); if (dow === 0 || dow === 6) continue;
      for (let min = 9 * 60; min + 30 <= 17 * 60; min += 30) {
        const ini = new Date(base.getTime() + (min - BRT * 60) * 60000), fim = new Date(ini.getTime() + dur);
        if (ini.getTime() < agora.getTime() + antecedencia) continue;
        if (ocupados.some((o) => new Date(o.inicio) < fim && new Date(o.fim) > ini)) continue;
        saida.push({ inicio: ini.toISOString(), fim: fim.toISOString() });
      }
    }
    return saida;
  }

  const API = { montarBase, baseComoTexto, responder, temas, horariosComerciais, semAcento, CONTATO };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else raiz.LIPP_MOTOR = API;
})(typeof window !== "undefined" ? window : globalThis);
