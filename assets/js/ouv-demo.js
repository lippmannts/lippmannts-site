/* Ouvidoria · simulação no modo demonstração (guarda os protocolos neste navegador) */
(function () {
  const CH = "l3_demo_ouv", TIPOS = { "DENÚNCIAS": "denuncia", "RECLAMAÇÕES": "reclamacao", "SUGESTÕES DE MELHORIA": "sugestao" };
  const ROT = { denuncia: "Denúncia", reclamacao: "Reclamação", sugestao: "Sugestão de melhoria" }, ST = { recebido: "Recebido", em_analise: "Em análise", respondido: "Respondido", concluido: "Concluído" };
  const ler = () => { try { return JSON.parse(localStorage.getItem(CH) || "null") || { seq: 1, itens: [] }; } catch (e) { return { seq: 1, itens: [] }; } };
  const gravar = d => { try { localStorage.setItem(CH, JSON.stringify(d)); } catch (e) {} };
  const AL = "23456789ABCDEFGHJKMNPQRSTUVWXYZ", agora = () => new Date().toISOString();
  const publico = p => ({ protocolo: p.protocolo, tipo: ROT[p.tipo], status: p.status, status_rotulo: ST[p.status], criado: p.criado, atualizado: p.atualizado, mensagem: p.mensagem, anonimo: p.anonimo, historico: p.msgs.filter(m => m.publico).map(m => ({ autor: m.autor, texto: m.texto, status: m.status_novo, criado: m.criado })) });
  window.LTS_OUV_DEMO = {
    TIPOS, ROT, ST,
    criar(r) {
      const tipo = TIPOS[r.assunto]; if (!tipo) return null;
      const d = ler(), protocolo = `OUV-${new Date().getFullYear()}-${Array.from({ length: 6 }, () => AL[Math.floor(Math.random() * AL.length)]).join("")}`, chave = String(Math.floor(Math.random() * 1e6)).padStart(6, "0");
      d.itens.unshift({ id: d.seq++, protocolo, chave, tipo, nome: r.nome || "", email: r.email || "", telefone: r.telefone || "", anonimo: tipo === "denuncia" && !r.nome && !r.email, mensagem: r.mensagem || "", status: "recebido", criado: agora(), atualizado: agora(), msgs: [{ autor: "sistema", texto: `${ROT[tipo]} registrada. Protocolo ${protocolo}.`, publico: true, status_novo: "recebido", criado: agora() }] });
      gravar(d); return { protocolo, chave };
    },
    consultar(protocolo, chave, complemento) {
      const d = ler(), p = d.itens.find(x => x.protocolo === String(protocolo || "").trim().toUpperCase() && x.chave === String(chave || "").trim());
      if (!p) return { ok: false, mensagem: "Protocolo não encontrado ou código de acesso incorreto." };
      if (complemento !== undefined) {
        if (String(complemento).trim().length < 5) return { ok: false, mensagem: "Escreva a informação complementar." };
        if (p.status === "concluido") return { ok: false, mensagem: "Este protocolo já foi concluído. Se precisar, abra um novo pelo Fale Conosco." };
        p.msgs.push({ autor: "solicitante", texto: String(complemento).trim(), publico: true, criado: agora() }); p.atualizado = agora(); if (p.status === "respondido") p.status = "em_analise"; gravar(d);
      }
      return { ok: true, protocolo: publico(p) };
    },
    listar() { return ler().itens.map(p => ({ id: p.id, protocolo: p.protocolo, tipo: p.tipo, nome: p.nome, email: p.email, telefone: p.telefone, anonimo: p.anonimo, mensagem: p.mensagem, status: p.status, criado: p.criado, atualizado: p.atualizado, mensagens: p.msgs.length })); },
    detalhe(id) { const p = ler().itens.find(x => x.id === +id); return p ? { ...p, chave: undefined, historico: p.msgs.map(m => ({ ...m, por: m.por || "" })) } : null; },
    responder(id, texto, status, publicoMsg) {
      const d = ler(), p = d.itens.find(x => x.id === +id); if (!p) return { ok: false, mensagem: "Protocolo não encontrado." };
      if (!String(texto || "").trim() && status === p.status) return { ok: false, mensagem: "Escreva a resposta ou altere a situação." };
      p.msgs.push({ autor: "lippmann", texto: String(texto || "").trim() || `Situação alterada para: ${ST[status]}.`, publico: publicoMsg !== false, status_novo: status !== p.status ? status : null, por: "admin", criado: agora() });
      p.status = status || p.status; p.atualizado = agora(); gravar(d);
      return { ok: true, mensagem: `Resposta registrada.${p.email && publicoMsg !== false ? ` Demonstração: no servidor, ${p.email} seria avisado por e-mail.` : ""}` };
    },
  };
})();
