/* =====================================================================
   /api/uni?acao=... · Área do Aluno UniLTS (AVA EaD)
   Sessão própria do aluno (cookie uni_sessao), separada do L³ INTEGRA.
   Toda alteração exige o cabeçalho X-UniLTS: 1 (proteção contra envio de outros sites).
   ===================================================================== */
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");
const S = require("./_lib/sessao");
const N = require("./_lib/uni");

const COOKIE = "uni_sessao";
const HORAS = 12;

async function alunoAtual(req) {
  const s = S.verificar(S.lerCookie(req, COOKIE));
  if (!s || !s.aid) return null;
  const { data } = await db().from("uni_alunos").select("id, nome, email, cpf, trocar_senha, ativo").eq("id", s.aid).maybeSingle();
  return data && data.ativo ? data : null;
}
async function carregarMatricula(aluno, id) {
  const { data: m } = await db().from("uni_matriculas").select("*").eq("id", Number(id) || 0).eq("aluno_id", aluno.id).maybeSingle();
  if (!m || m.status === "cancelado") return null;
  const { data: t } = await db().from("uni_turmas").select("*").eq("id", m.turma_id).maybeSingle();
  if (t) await N.aplicarRegras(m, t);
  if (m.acesso_revogado) return null;
  const { data: c } = t ? await db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle() : { data: null };
  return t && c ? { m, t, c } : null;
}
function resumoMatricula(m, t, c) {
  const p = N.progresso(c, m.aulas);
  const usadas = N.tentativasValidas(m).length;
  return {
    id: m.id, status: m.status, nota: m.nota, prazo_ate: t.modalidade === "ead" ? m.prazo_ate : null, dias_restantes: t.modalidade === "ead" && m.status === "em_andamento" ? N.diasRestantes(m) : null, resets: m.resets || 0, nota_teorica: m.nota_teorica, nota_pratica: m.nota_pratica, certificado: m.certificado, concluido_em: m.concluido_em, aulas: m.aulas || {},
    tentativas: N.tentativasValidas(m).map((x) => ({ n: x.n, nota: x.nota, acertos: x.acertos, total: x.total, t: x.t })),
    tentativas_restantes: Math.max(0, Number(c.tentativas_max || 3) - usadas), progresso: p,
    turma: { codigo: t.codigo, inicio: t.inicio, fim: t.fim, status: t.status, modalidade: t.modalidade || "ead", prazo_dias: t.prazo_dias || 30 },
    curso: { id: c.id, titulo: c.titulo, nr: c.nr, carga_horaria: Number(c.carga_horaria), imagem: c.imagem, resumo: c.resumo, nota_corte: Number(c.nota_corte), tentativas_max: Number(c.tentativas_max) },
  };
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const acao = U.limpar((req.query && req.query.acao) || url.searchParams.get("acao"), 40);
  const q = (k) => (req.query && req.query[k]) || url.searchParams.get(k) || "";
  const post = req.method === "POST";
  try {
    /* ---------- público ---------- */
    if (acao === "cursos") {
      const { data, error } = await db().from("uni_cursos").select("id, titulo, nr, carga_horaria, resumo, imagem, modalidade, preco, venda_online, interno").eq("ativo", true).order("titulo");
      if (error) throw error;
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
      return U.ok(res, { cursos: (data || []).filter((c) => !c.interno).map(({ interno, ...c }) => c) });
    }
    if (post && req.headers["x-unilts"] !== "1") return U.erro(res, "Requisição inválida.", 403);
    const b = post ? await U.corpo(req) : {};

    if (acao === "login") {
      if (!post) return U.erro(res, "Método não permitido.", 405);
      if (!(await U.limite(req, "uni-login", 8, 900))) return U.erro(res, "Muitas tentativas. Aguarde 15 minutos.", 429);
      const email = U.limpar(b.email, 160).toLowerCase(), senha = String(b.senha || "");
      const { data: a } = await db().from("uni_alunos").select("*").eq("email", email).maybeSingle();
      if (!a || !a.ativo || !S.conferirSenha(senha.trim(), a.senha_hash)) { await new Promise((r) => setTimeout(r, 400)); return U.erro(res, "E-mail ou senha incorretos.", 401); }
      // acesso revogado 12 meses após o encerramento de todas as turmas (reabilitação pelo superadmin)
      const { data: mats } = await db().from("uni_matriculas").select("*").eq("aluno_id", a.id);
      const ativas = [];
      for (const m of (mats || []).filter((x) => x.status !== "cancelado")) { const { data: t } = await db().from("uni_turmas").select("*").eq("id", m.turma_id).maybeSingle(); await N.aplicarRegras(m, t); if (!m.acesso_revogado) ativas.push(m); }
      const validas = (mats || []).filter((x) => x.status !== "cancelado");
      if ((mats || []).length && !validas.length) { await N.registrar(a.id, null, "login_bloqueado", "sem matrículas ativas"); return U.erro(res, (mats || []).some((x) => x.pedido_id) ? "Acesso bloqueado: a compra deste curso foi cancelada pelo usuário (reembolso). As aulas, apostilas e avaliações não estão mais disponíveis e o certificado, se emitido, foi revogado. Dúvidas: WhatsApp (11) 94013-8792." : "Você não tem matrículas ativas na UniLTS (o curso foi cancelado). Dúvidas: WhatsApp (11) 94013-8792.", 403); }
      if (validas.length && !ativas.length) { await N.registrar(a.id, null, "login_bloqueado", "acesso revogado"); return U.erro(res, "Seu acesso à UniLTS expirou (12 meses após o encerramento da turma). Para reabilitá-lo, fale com a LIPPMANN pelo WhatsApp (11) 94013-8792.", 403); }
      S.gravarCookie(res, COOKIE, S.assinar({ aid: a.id }, HORAS), HORAS * 3600);
      await db().from("uni_alunos").update({ ultimo_acesso: new Date().toISOString() }).eq("id", a.id);
      await N.registrar(a.id, null, "login");
      return U.ok(res, { aluno: { nome: a.nome, email: a.email, cpf: N.mascararCpf(a.cpf), trocar_senha: !!a.trocar_senha } });
    }
    if (acao === "logout") { const s1 = S.verificar(S.lerCookie(req, COOKIE)); if (s1 && s1.aid) await N.registrar(s1.aid, null, "logout"); S.gravarCookie(res, COOKIE, "", 0); return U.ok(res); }
    if (acao === "esqueci") {
      if (!post) return U.erro(res, "Método não permitido.", 405);
      if (!(await U.limite(req, "uni-esqueci", 4, 3600))) return U.erro(res, "Muitas solicitações. Tente novamente mais tarde.", 429);
      const email = U.limpar(b.email, 160).toLowerCase();
      const { data: a } = await db().from("uni_alunos").select("*").eq("email", email).maybeSingle();
      if (a && a.ativo) {
        const senha = N.gerarSenha();
        await db().from("uni_alunos").update({ senha_hash: S.hashSenha(senha), trocar_senha: true }).eq("id", a.id);
        await N.emailAcesso(a, senha, null, null);
        await N.registrar(a.id, null, "senha_redefinida");
      }
      return U.ok(res, { mensagem: "Se o e-mail estiver cadastrado, você receberá uma nova senha provisória em instantes." });
    }

    /* ---------- área logada ---------- */
    const aluno = await alunoAtual(req);
    if (!aluno) return U.json(res, 401, { ok: false, mensagem: "Sua sessão expirou. Entre novamente." });
    if (acao === "sessao") return U.ok(res, { aluno: { nome: aluno.nome, email: aluno.email, cpf: N.mascararCpf(aluno.cpf), trocar_senha: !!aluno.trocar_senha } });

    if (acao === "trocar_senha") {
      if (!post) return U.erro(res, "Método não permitido.", 405);
      const { data: a } = await db().from("uni_alunos").select("senha_hash").eq("id", aluno.id).maybeSingle();
      if (!S.conferirSenha(String(b.atual || "").trim(), a.senha_hash)) return U.erro(res, "A senha atual não confere.");
      const fraca = N.senhaForte(b.nova); if (fraca) return U.erro(res, fraca);
      if (String(b.nova) === String(b.atual).trim()) return U.erro(res, "A nova senha deve ser diferente da provisória.");
      await db().from("uni_alunos").update({ senha_hash: S.hashSenha(b.nova), trocar_senha: false }).eq("id", aluno.id);
      await N.registrar(aluno.id, null, "senha_alterada");
      return U.ok(res, { mensagem: "Senha alterada com sucesso." });
    }
    if (aluno.trocar_senha) return U.json(res, 403, { ok: false, trocar_senha: true, mensagem: "Troque a senha provisória para continuar." });

    switch (acao) {
      case "painel": {
        const { data: ms } = await db().from("uni_matriculas").select("*").eq("aluno_id", aluno.id).order("criado", { ascending: false });
        const lista = [];
        for (const m of (ms || []).filter((x) => x.status !== "cancelado")) {
          const r = await carregarMatricula(aluno, m.id);
          if (r) lista.push(resumoMatricula(r.m, r.t, r.c));
        }
        return U.ok(res, { matriculas: lista });
      }
      case "curso": {
        const r = await carregarMatricula(aluno, q("m"));
        if (!r) return U.erro(res, "Matrícula não encontrada.", 404);
        const { m, t, c } = r, base = resumoMatricula(m, t, c);
        if (t.modalidade === "presencial") return U.ok(res, { ...base, conteudo: { plano_ensino: c.plano_ensino, mapa_mental: c.mapa_mental, conteudo_programatico: c.conteudo_programatico, modulos: [], modalidade: "Presencial", norma: c.norma, instrutor_nome: t.instrutor_nome || c.instrutor_nome }, avaliacao: null });
        const liberada = base.progresso.feitas === base.progresso.total && base.progresso.total > 0 && m.status === "em_andamento" && base.tentativas_restantes > 0 && !(t.modalidade === "hibrido" && m.nota_teorica !== null && m.nota_teorica !== undefined);
        await N.registrar(aluno.id, m.id, "acesso_curso");
        return U.ok(res, { ...base, conteudo: { plano_ensino: c.plano_ensino, mapa_mental: c.mapa_mental, conteudo_programatico: c.conteudo_programatico, modulos: c.modulos, modalidade: c.modalidade, norma: c.norma, instrutor_nome: t.instrutor_nome || c.instrutor_nome },
          avaliacao: liberada ? N.semGabarito(c) : null });
      }
      case "aula": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const r = await carregarMatricula(aluno, b.m);
        if (!r) return U.erro(res, "Matrícula não encontrada.", 404);
        if (r.t.modalidade === "presencial") return U.erro(res, "Turma presencial: as notas são lançadas pelo instrutor.");
        const id = U.limpar(b.aula, 40);
        if (!N.todasAulas(r.c).includes(id)) return U.erro(res, "Aula não encontrada.");
        const aulas = { ...(r.m.aulas || {}) };
        if (!aulas[id]) { aulas[id] = new Date().toISOString(); await db().from("uni_matriculas").update({ aulas }).eq("id", r.m.id); await N.registrar(aluno.id, r.m.id, "aula_concluida", id); }
        return U.ok(res, { aulas, progresso: N.progresso(r.c, aulas) });
      }
      case "avaliacao": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const r = await carregarMatricula(aluno, b.m);
        if (!r) return U.erro(res, "Matrícula não encontrada.", 404);
        const { m, t, c } = r;
        if (t.modalidade === "presencial") return U.erro(res, "Turma presencial: as notas são lançadas pelo instrutor.");
        if (t.modalidade === "hibrido" && m.nota_teorica !== null && m.nota_teorica !== undefined && Number(m.nota_teorica) >= Number(c.nota_corte || 7)) return U.erro(res, "Parte teórica já aprovada. Aguarde a avaliação prática presencial.");
        if (m.status !== "em_andamento") return U.erro(res, m.status === "aprovado" ? "Você já foi aprovado neste curso." : "Não há tentativas disponíveis. Fale com a coordenação.");
        const p = N.progresso(c, m.aulas);
        if (p.feitas < p.total) return U.erro(res, "Conclua todas as aulas para liberar a avaliação.");
        const usadas = N.tentativasValidas(m).length, max = Number(c.tentativas_max || 3);
        if (usadas >= max) return U.erro(res, "Você já utilizou todas as tentativas.");
        const respostas = Array.isArray(b.respostas) ? b.respostas : [];
        if (respostas.length !== (c.avaliacao || []).length || respostas.some((x) => x === null || x === undefined || x === "")) return U.erro(res, "Responda todas as questões antes de enviar.");
        const res1 = N.corrigir(c, respostas);
        const tentativa = { n: (m.tentativas || []).length + 1, ...res1, t: new Date().toISOString() };
        const aprovado = res1.nota >= Number(c.nota_corte || 7);
        const restantes = max - usadas - 1;
        const upd = { tentativas: [...(m.tentativas || []), tentativa], nota: Math.max(Number(m.nota || 0), res1.nota) };
        if (aprovado && t.modalidade === "hibrido") { upd.nota_teorica = res1.nota; upd.status = "aprovado_teoria"; }   // híbrido: falta a prática presencial
        else if (aprovado) { upd.status = "aprovado"; upd.concluido_em = tentativa.t; upd.certificado = await N.novoCodigoCertificado(t); upd.nota = res1.nota; }
        else if (restantes <= 0) upd.status = "reprovado";
        const hibridoOk = upd.status === "aprovado_teoria"; if (hibridoOk) delete upd.status;
        await db().from("uni_matriculas").update(upd).eq("id", m.id);
        if (hibridoOk) { await N.registrar(aluno.id, m.id, "avaliacao", `tentativa ${tentativa.n}: nota ${res1.nota.toFixed(2)} (teórica aprovada)`); return U.ok(res, { nota: res1.nota, acertos: res1.acertos, total: res1.total, aprovado: true, aguardando_pratica: true, restantes: Math.max(0, restantes), certificado: null, nota_corte: Number(c.nota_corte || 7) }); }
        await N.registrar(aluno.id, m.id, "avaliacao", `tentativa ${tentativa.n}: nota ${res1.nota.toFixed(2)}`);
        return U.ok(res, { nota: res1.nota, acertos: res1.acertos, total: res1.total, aprovado, restantes: Math.max(0, restantes), certificado: upd.certificado || null, nota_corte: Number(c.nota_corte || 7) });
      }
      case "pedidos": {
        const { data } = await db().from("uni_pedidos").select("*").or(`aluno_id.eq.${aluno.id},email.eq.${aluno.email}`).order("criado", { ascending: false });
        const { data: cs } = await db().from("uni_cursos").select("id, titulo");
        const nomes = Object.fromEntries((cs || []).map((c) => [c.id, c.titulo]));
        return U.ok(res, { pedidos: (data || []).filter((p) => p.status !== "pendente" || p.metodo === "pix").map((p) => ({ codigo: p.codigo, curso: nomes[p.curso_id] || p.curso_id, valor: Number(p.valor), metodo: p.metodo, status: p.status, criado: p.criado, pago_em: p.pago_em, estornado_em: p.estornado_em,
          reembolso_ate: p.pago_em ? new Date(new Date(p.pago_em).getTime() + N.GARANTIA_DIAS * 86400000).toISOString() : null, reembolsavel: p.status === "aprovado" && N.dentroDaGarantia(p) })) });
      }
      case "reembolso": return U.erro(res, "Para cancelar, envie o pedido formal para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792 com: código da compra, nome completo, CPF, e-mail e forma de pagamento.", 403);
      case "certificado": {
        const d = await N.dadosCertificado(q("c"), "completo");
        if (!d || d.aluno_id !== aluno.id) return U.erro(res, "Certificado não encontrado.", 404);
        return U.ok(res, { certificado: { ...d, aluno_id: undefined } });
      }
      default: return U.erro(res, "Ação desconhecida.", 404);
    }
  } catch (e) {
    console.error("uni:", acao, e);
    if (e && e.configuracao) return U.json(res, 500, { ok: false, mensagem: e.message });
    return U.json(res, 500, { ok: false, mensagem: "Erro no servidor. Tente novamente em instantes." });
  }
};
