/* =====================================================================
   /api/parceiro?acao=... · Painel do Parceiro / Instrutor · UniLTS
   Turmas presenciais e híbridas: participantes, notas teórica e prática,
   entrada/saída, documentos legais e evidências fotográficas (4 legendas fixas).
   O parceiro só enxerga as turmas em que é o instrutor responsável.
   ===================================================================== */
const { db, todas, BUCKET_EVIDENCIAS } = require("../_lib/supabase");
const U = require("../_lib/util");
const S = require("../_lib/sessao");
const N = require("../_lib/uni");
const K = require("../_lib/conteudo");
const { criarPortal } = require("../_lib/portal");

const portal = criarPortal({ tabela: "uni_parceiros", cookie: "par_sessao", tipo: "parceiro", campos: "id, nome, email, cpf, telefone, qualificacao, registro, trocar_senha, ativo, senha_hash, aluno_id, trilha_aprovada_em, trilha_dispensada" });
const TRAVA = "Conclua a Trilha de Capacitação do Instrutor Parceiro (curso obrigatório na UniLTS) para criar e concluir turmas.";
const nota = (v) => { if (v === null || v === undefined || v === "") return null; const n = Number(String(v).replace(",", ".")); return isNaN(n) || n < 0 || n > 10 ? undefined : Math.round(n * 100) / 100; };
const dataHora = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? undefined : d.toISOString(); };

async function minhaTurma(pid, id) {
  const { data: t } = await db().from("uni_turmas").select("*").eq("id", Number(id) || 0).eq("parceiro_id", pid).maybeSingle();
  return t;
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const acao = U.limpar((req.query && req.query.acao) || url.searchParams.get("acao"), 40);
  const q = (k) => (req.query && req.query[k]) || url.searchParams.get(k) || "";
  const post = req.method === "POST";
  try {
    if (post && req.headers["x-unilts"] !== "1") return U.erro(res, "Requisição inválida.", 403);
    const b = post ? await U.corpo(req) : {};
    if (await portal.rotasPublicas(req, res, acao, b, post)) return;
    const p = await portal.atual(req);
    if (!p) return U.json(res, 401, { ok: false, mensagem: "Sua sessão expirou. Entre novamente." });
    if (await portal.rotasLogadas(req, res, acao, b, post, p)) return;
    const PID = p.id, quem = `parceiro:${p.email}`;

    switch (acao) {
      case "resumo": {
        const { data: turmas } = await db().from("uni_turmas").select("*").eq("parceiro_id", PID).order("numero", { ascending: false });
        const { data: cursos } = await db().from("uni_cursos").select("id, titulo, nr, carga_horaria, nota_corte").eq("ativo", true).order("titulo");
        const nomes = Object.fromEntries((cursos || []).map((c) => [c.id, c.titulo]));
        const tids = (turmas || []).map((t) => t.id);
        const ms = tids.length ? await todas(() => db().from("uni_matriculas").select("turma_id, status").in("turma_id", tids)) : [];
        const arq = tids.length ? await todas(() => db().from("uni_turma_arquivos").select("turma_id, categoria, tipo").in("turma_id", tids)) : [];
        const emps = [...new Set((turmas || []).map((t) => t.empresa_id).filter(Boolean))];
        const { data: es } = emps.length ? await db().from("uni_empresas").select("id, razao_social, nome_fantasia").in("id", emps) : { data: [] };
        const en = Object.fromEntries((es || []).map((e) => [e.id, e.nome_fantasia || e.razao_social]));
        const trilha = await N.trilhaDoParceiro(p);
        return U.ok(res, { parceiro: { nome: p.nome, qualificacao: p.qualificacao, registro: p.registro }, trilha, cursos: (cursos || []).filter((c) => c.id !== N.TRILHA_ID), documentos: N.DOCUMENTOS, fotos: N.FOTOS,
          turmas: (turmas || []).map((t) => { const x = ms.filter((m) => m.turma_id === t.id && m.status !== "cancelado"), a = arq.filter((y) => y.turma_id === t.id);
            return { ...t, curso: nomes[t.curso_id] || t.curso_id, empresa: en[t.empresa_id] || "", participantes: x.length, aprovados: x.filter((m) => m.status === "aprovado").length,
              fotos_ok: Object.keys(N.FOTOS).filter((k) => a.some((y) => y.categoria === "foto" && y.tipo === k)).length, docs_ok: Object.keys(N.DOCUMENTOS).filter((k) => a.some((y) => y.categoria === "documento" && y.tipo === k)).length }; }) });
      }
      case "turma": {
        const t = await minhaTurma(PID, q("id"));
        if (!t) return U.erro(res, "Turma não encontrada.", 404);
        const d = await N.dadosTurma(t.id, { arquivos: true, logs: true, certificados: true });
        let colaboradores = [];
        if (t.empresa_id) colaboradores = await todas(() => db().from("uni_colaboradores").select("id, nome, cpf, cargo, unidade").eq("empresa_id", t.empresa_id).order("nome"));
        return U.ok(res, { ...d, responsavel: p.nome, colaboradores: colaboradores.map((c) => ({ ...c, cpf: N.mascararCpf(c.cpf) })) });
      }
      case "relatorio": {
        const t = await minhaTurma(PID, q("id"));
        if (!t) return U.erro(res, "Turma não encontrada.", 404);
        return U.ok(res, { ...(await N.dadosTurma(t.id, { arquivos: true, logs: true, certificados: true })), responsavel: p.nome });
      }
      case "trilha_iniciar": {   // entra no AVA com a mesma senha, já matriculado na trilha
        if (!post) return U.erro(res, "Método não permitido.", 405);
        try {
          const { aluno, matricula } = await N.trilhaIniciar(p);
          S.gravarCookie(res, "uni_sessao", S.assinar({ aid: aluno.id }, 8), 8 * 3600);
          return U.ok(res, { url: `/unilts/#c/${matricula.id}` });
        } catch (e) { if (e.publico) return U.erro(res, e.message); throw e; }
      }
      case "turma_salvar": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        if (!b.id && !(await N.trilhaLiberada(p))) return U.erro(res, TRAVA, 403);
        const dt = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : null);
        if (b.id) {
          const t = await minhaTurma(PID, b.id); if (!t) return U.erro(res, "Turma não encontrada.");
          if (t.concluida_parceiro) return U.erro(res, "Turma já concluída. Para alterar, fale com a LIPPMANN.");
          await db().from("uni_turmas").update({ inicio: dt(b.inicio), fim: dt(b.fim), local: U.limpar(b.local, 200), observacoes: U.limpar(b.observacoes, 2000) }).eq("id", t.id);
          return U.ok(res, { id: t.id });
        }
        const { data: c } = await db().from("uni_cursos").select("id").eq("id", U.limpar(b.curso_id, 80)).eq("ativo", true).maybeSingle();
        if (!c) return U.erro(res, "Escolha o curso.");
        if (!dt(b.inicio)) return U.erro(res, "Informe a data de realização.");
        if (!U.limpar(b.local, 200)) return U.erro(res, "Informe o local do treinamento.");
        const mod = b.modalidade === "hibrido" ? "hibrido" : "presencial";
        const { data, error } = await db().rpc("uni_criar_turma2", { p_curso: c.id, p_tipo: "b2b", p_inicio: dt(b.inicio), p_fim: dt(b.fim) || dt(b.inicio), p_local: U.limpar(b.local, 200), p_instrutor: p.nome, p_obs: U.limpar(b.observacoes, 2000) || null, p_modalidade: mod, p_empresa: null, p_parceiro: PID, p_prazo: 30 });
        if (error) throw error;
        const t = Array.isArray(data) ? data[0] : data;
        return U.ok(res, { id: t.id, codigo: t.codigo });
      }
      case "participante_adicionar": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const t = await minhaTurma(PID, b.turma_id); if (!t) return U.erro(res, "Turma não encontrada.");
        if (t.concluida_parceiro || t.status !== "aberta") return U.erro(res, "Turma encerrada.");
        let col = null;
        if (b.colaborador_id && t.empresa_id) col = (await db().from("uni_colaboradores").select("*").eq("id", Number(b.colaborador_id)).eq("empresa_id", t.empresa_id).maybeSingle()).data;
        const nome = col ? col.nome : U.limpar(b.nome, 160), cpf = col ? col.cpf : N.soDigitos(b.cpf);
        const email = col ? col.email : (U.limpar(b.email, 160).toLowerCase() || null);
        if (nome.split(/\s+/).length < 2) return U.erro(res, "Informe o nome completo (sai no certificado).");
        if (!N.cpfValido(cpf)) return U.erro(res, "CPF inválido.");
        if (email && !U.emailValido(email)) return U.erro(res, "E-mail inválido.");
        let aluno = col && col.aluno_id ? (await db().from("uni_alunos").select("*").eq("id", col.aluno_id).maybeSingle()).data : null;
        if (!aluno && email) aluno = (await db().from("uni_alunos").select("*").eq("email", email).maybeSingle()).data;
        if (!aluno) { const ins = await db().from("uni_alunos").insert({ nome, cpf, email, empresa: U.limpar(b.empresa, 160) || null, trocar_senha: true }).select("*").single(); if (ins.error) throw ins.error; aluno = ins.data; }
        if (col && col.aluno_id !== aluno.id) await db().from("uni_colaboradores").update({ aluno_id: aluno.id }).eq("id", col.id);
        const { data: ja } = await db().from("uni_matriculas").select("id, status").eq("aluno_id", aluno.id).eq("turma_id", t.id).maybeSingle();
        if (ja && ja.status !== "cancelado") return U.erro(res, "Participante já está nesta turma.");
        if (ja) await db().from("uni_matriculas").update({ status: "em_andamento", colaborador_id: col ? col.id : null }).eq("id", ja.id);
        else { const { error } = await db().from("uni_matriculas").insert({ aluno_id: aluno.id, turma_id: t.id, colaborador_id: col ? col.id : null, prazo_ate: t.modalidade === "hibrido" ? new Date(Date.now() + Number(t.prazo_dias || 30) * 86400000).toISOString() : null }); if (error) throw error; }
        await N.registrar(aluno.id, null, "matricula_presencial", `${t.codigo} por ${quem}`);
        return U.ok(res, { mensagem: `${nome} adicionado(a) à turma.` });
      }
      case "participante_remover": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const { data: m } = await db().from("uni_matriculas").select("id, turma_id, status").eq("id", Number(b.id)).maybeSingle();
        const t = m ? await minhaTurma(PID, m.turma_id) : null;
        if (!t || t.concluida_parceiro) return U.erro(res, "Não é possível remover.");
        await db().from("uni_matriculas").update({ status: "cancelado" }).eq("id", m.id);
        return U.ok(res);
      }
      case "notas_salvar": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const t = await minhaTurma(PID, b.turma_id); if (!t) return U.erro(res, "Turma não encontrada.");
        if (t.concluida_parceiro) return U.erro(res, "Turma já concluída.");
        const lista = Array.isArray(b.notas) ? b.notas : [];
        const erros = [];
        for (const x of lista) {
          const { data: m } = await db().from("uni_matriculas").select("id, aluno_id, turma_id").eq("id", Number(x.id)).eq("turma_id", t.id).maybeSingle();
          if (!m) continue;
          const upd = {}, pr = nota(x.nota_pratica), te = nota(x.nota_teorica), en = dataHora(x.entrada), sa = dataHora(x.saida);
          if (pr === undefined || te === undefined) { erros.push("Notas devem estar entre 0 e 10."); continue; }
          if (en === undefined || sa === undefined) { erros.push("Data/hora de entrada ou saída inválida."); continue; }
          if (en && sa && new Date(sa) <= new Date(en)) { erros.push("A saída deve ser depois da entrada."); continue; }
          upd.nota_pratica = pr; if (t.modalidade === "presencial") upd.nota_teorica = te;
          upd.presenca_entrada = en; upd.presenca_saida = sa;
          await db().from("uni_matriculas").update(upd).eq("id", m.id);
          await N.registrar(m.aluno_id, m.id, "notas_presenca", `teórica ${upd.nota_teorica ?? "(EaD)"} · prática ${pr ?? "—"} · entrada ${en || "—"} · saída ${sa || "—"} (${quem})`);
        }
        return erros.length ? U.erro(res, [...new Set(erros)].join(" ")) : U.ok(res, { mensagem: "Notas e presença salvas." });
      }
      case "upload_url": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const t = await minhaTurma(PID, b.turma_id); if (!t) return U.erro(res, "Turma não encontrada.");
        if (t.concluida_parceiro) return U.erro(res, "Turma já concluída.");
        const cat = b.categoria === "foto" ? "foto" : "documento", tipo = U.limpar(b.tipo, 40);
        if (cat === "foto" && !N.FOTOS[tipo]) return U.erro(res, "Tipo de foto inválido.");
        if (cat === "documento" && !N.DOCUMENTOS[tipo]) return U.erro(res, "Tipo de documento inválido.");
        const ext = (String(b.nome || "").split(".").pop() || "").toLowerCase();
        const permitidas = cat === "foto" ? ["jpg", "jpeg", "png", "webp"] : ["pdf", "jpg", "jpeg", "png"];
        if (!permitidas.includes(ext)) return U.erro(res, cat === "foto" ? "Envie a foto em JPG, PNG ou WEBP." : "Envie o documento em PDF, JPG ou PNG.");
        if (Number(b.tamanho) > 50 * 1024 * 1024) return U.erro(res, "Arquivo acima de 50 MB.");
        if (cat === "foto" && Math.max(Number(b.largura) || 0, Number(b.altura) || 0) < N.RESOLUCAO_MINIMA) return U.erro(res, `A foto precisa estar em resolução total (mínimo ${N.RESOLUCAO_MINIMA} px no lado maior). Envie o arquivo original da câmera, sem compressão de aplicativos de mensagem.`);
        const caminho = `turmas/${t.codigo}/${cat}/${tipo}-${Date.now().toString(36)}.${ext === "jpeg" ? "jpg" : ext}`;
        const { data, error } = await db().storage.from(BUCKET_EVIDENCIAS).createSignedUploadUrl(caminho);
        if (error) throw error;
        const { credenciais } = require("../_lib/supabase");
        return U.ok(res, { url: data.signedUrl, caminho, apikey: credenciais().publica });
      }
      case "arquivo_registrar": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const t = await minhaTurma(PID, b.turma_id); if (!t) return U.erro(res, "Turma não encontrada.");
        const cat = b.categoria === "foto" ? "foto" : "documento", tipo = U.limpar(b.tipo, 40), caminho = U.limpar(b.caminho, 300);
        if (!caminho.startsWith(`turmas/${t.codigo}/${cat}/${tipo}-`)) return U.erro(res, "Arquivo inválido.");
        const legenda = U.limpar(b.legenda, 300);
        if (cat === "foto" && legenda.length < 10) return U.erro(res, "Descreva a foto na legenda (mínimo de 10 caracteres).");
        const pasta = caminho.split("/").slice(0, -1).join("/"), nomeArq = caminho.split("/").pop();
        const { data: lst } = await db().storage.from(BUCKET_EVIDENCIAS).list(pasta, { search: nomeArq });
        if (!(lst || []).some((x) => x.name === nomeArq)) return U.erro(res, "O arquivo não chegou ao servidor. Tente enviar de novo.");
        if (cat === "foto") { const { data: ant } = await db().from("uni_turma_arquivos").select("id, caminho").eq("turma_id", t.id).eq("categoria", "foto").eq("tipo", tipo); for (const a of ant || []) { await db().storage.from(BUCKET_EVIDENCIAS).remove([a.caminho]); await db().from("uni_turma_arquivos").delete().eq("id", a.id); } }
        const titulo = cat === "foto" ? N.FOTOS[tipo] : N.DOCUMENTOS[tipo];
        const { error } = await db().from("uni_turma_arquivos").insert({ turma_id: t.id, categoria: cat, tipo, legenda: cat === "foto" ? `${titulo} · ${legenda}` : (legenda || titulo), caminho, nome_original: U.limpar(b.nome, 200), largura: Number(b.largura) || null, altura: Number(b.altura) || null, bytes: Number(b.tamanho) || null, enviado_por: quem });
        if (error) throw error;
        return U.ok(res, { mensagem: `${titulo} enviado.` });
      }
      case "arquivo_excluir": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const { data: a } = await db().from("uni_turma_arquivos").select("*").eq("id", Number(b.id)).maybeSingle();
        const t = a ? await minhaTurma(PID, a.turma_id) : null;
        if (!t || t.concluida_parceiro) return U.erro(res, "Não é possível excluir.");
        await db().storage.from(BUCKET_EVIDENCIAS).remove([a.caminho]);
        await db().from("uni_turma_arquivos").delete().eq("id", a.id);
        return U.ok(res);
      }
      case "concluir": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        if (!(await N.trilhaLiberada(p))) return U.erro(res, TRAVA, 403);
        const t = await minhaTurma(PID, b.turma_id); if (!t) return U.erro(res, "Turma não encontrada.");
        if (t.concluida_parceiro) return U.erro(res, "Turma já concluída.");
        const { data: c } = await db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle();
        const { data: arq } = await db().from("uni_turma_arquivos").select("categoria, tipo").eq("turma_id", t.id);
        const faltaF = Object.keys(N.FOTOS).filter((k) => !(arq || []).some((a) => a.categoria === "foto" && a.tipo === k)).map((k) => N.FOTOS[k]);
        const faltaD = Object.keys(N.DOCUMENTOS).filter((k) => !(arq || []).some((a) => a.categoria === "documento" && a.tipo === k)).map((k) => N.DOCUMENTOS[k]);
        if (faltaF.length || faltaD.length) return U.erro(res, `Para concluir, envie: ${[...faltaD, ...faltaF].join("; ")}.`);
        const ms = (await todas(() => db().from("uni_matriculas").select("*").eq("turma_id", t.id))).filter((m) => m.status !== "cancelado");
        if (!ms.length) return U.erro(res, "Adicione os participantes da turma.");
        const sem = ms.filter((m) => m.nota_pratica === null || (t.modalidade === "presencial" && m.nota_teorica === null) || !m.presenca_entrada || !m.presenca_saida);
        if (sem.length) return U.erro(res, `Lance notas, entrada e saída de todos os participantes (${sem.length} pendente(s)).`);
        const r = await N.concluirPresencial(t, c, quem);
        const agora = new Date().toISOString();
        await db().from("uni_turmas").update({ concluida_parceiro: agora, status: "encerrada", encerrada_em: agora }).eq("id", t.id);
        return U.ok(res, { mensagem: `Turma concluída: ${r.aprovados} de ${r.total} aprovado(s). Certificados emitidos automaticamente.` });
      }
      case "certificado": {
        const d = await N.dadosCertificado(q("c"), "completo");
        if (!d) return U.erro(res, "Certificado não encontrado.", 404);
        const { data: m } = await db().from("uni_matriculas").select("turma_id").eq("certificado", d.codigo).maybeSingle();
        if (!m || !(await minhaTurma(PID, m.turma_id))) return U.erro(res, "Certificado não encontrado.", 404);
        delete d.aluno_id; return U.ok(res, { certificado: d });
      }
      default: return U.erro(res, "Ação desconhecida.", 404);
    }
  } catch (e) {
    console.error("parceiro:", acao, e);
    if (e && e.configuracao) return U.json(res, 500, { ok: false, mensagem: e.message });
    return U.json(res, 500, { ok: false, mensagem: "Erro no servidor. Tente novamente em instantes." });
  }
};
