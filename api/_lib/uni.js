/* UniLTS · regras compartilhadas (senhas provisórias, CPF, progresso, notas e certificados) */
const crypto = require("crypto");
const { db } = require("./supabase");
const U = require("./util");
const E = require("./email");

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
function gerarSenha(tam = 10) {
  while (true) {
    const b = crypto.randomBytes(tam);
    const s = [...b].map((x) => ALFABETO[x % ALFABETO.length]).join("");
    if (/[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s)) return s;
  }
}
function senhaForte(s) {
  s = String(s || "");
  if (s.length < 8) return "A nova senha deve ter ao menos 8 caracteres.";
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return "A nova senha deve misturar letras e números.";
  return "";
}
const soDigitos = (v) => String(v || "").replace(/\D/g, "");
function cpfValido(cpf) {
  const c = soDigitos(cpf);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}
const formatarCpf = (cpf) => { const c = soDigitos(cpf); return c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : String(cpf || ""); };
const mascararCpf = (cpf) => { const c = soDigitos(cpf); return c.length === 11 ? `${c.slice(0, 3)}.***.***-**` : ""; };

function todasAulas(curso) {
  return (curso.modulos || []).flatMap((m) => (m.aulas || []).map((a) => a.id)).filter(Boolean);
}
function progresso(curso, aulas) {
  const ids = todasAulas(curso), feitas = ids.filter((id) => aulas && aulas[id]).length;
  return { total: ids.length, feitas, pct: ids.length ? Math.round((feitas / ids.length) * 100) : 0 };
}
const tentativasValidas = (m) => (m.tentativas || []).filter((t) => !t.descartada);

/* corrige a avaliação: nota de 0 a 10 com duas casas decimais */
function corrigir(curso, respostas) {
  const qs = curso.avaliacao || [];
  let acertos = 0;
  qs.forEach((q, i) => { if (Number(respostas[i]) === Number(q.correta)) acertos++; });
  const nota = qs.length ? Math.round((acertos / qs.length) * 1000) / 100 : 0;
  return { acertos, total: qs.length, nota };
}
/* perguntas sem o gabarito (é o que o aluno recebe) */
const semGabarito = (curso) => (curso.avaliacao || []).map((q) => ({ pergunta: q.pergunta, alternativas: q.alternativas }));

function validadeAte(curso, concluido) {
  if (!concluido || !Number(curso.validade_meses)) return null;
  const d = new Date(concluido); d.setMonth(d.getMonth() + Number(curso.validade_meses));
  return d.toISOString();
}
async function novoCodigoCertificado(turma) {
  const { count } = await db().from("uni_matriculas").select("id", { count: "exact", head: true }).eq("turma_id", turma.id).eq("status", "aprovado");
  const sufixo = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `${turma.codigo}-${String((count || 0) + 1).padStart(3, "0")}-${sufixo}`;
}

/* Dados do certificado. cpf: "completo" | "mascarado" */
async function dadosCertificado(codigo, cpf = "mascarado") {
  const c = U.limpar(codigo, 60).toUpperCase();
  if (!c) return null;
  const { data: m } = await db().from("uni_matriculas").select("*").eq("certificado", c).maybeSingle();
  if (!m) return null;
  const [{ data: a }, { data: t }] = await Promise.all([
    db().from("uni_alunos").select("id, nome, cpf, email").eq("id", m.aluno_id).maybeSingle(),
    db().from("uni_turmas").select("*").eq("id", m.turma_id).maybeSingle(),
  ]);
  if (!a || !t) return null;
  const { data: cu } = await db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle();
  if (!cu) return null;
  const ate = validadeAte(cu, m.concluido_em);
  let status = m.status !== "aprovado" ? "cancelado" : ate && new Date(ate) < new Date() ? "vencido" : "valido";
  let revogacao = null;
  if (m.status === "cancelado" && m.pedido_id) {   // compra estornada/cancelada: certificado revogado
    const { data: p } = await db().from("uni_pedidos").select("codigo, status, estornado_em").eq("id", m.pedido_id).maybeSingle();
    if (p && ["estornado", "cancelado"].includes(p.status)) { status = "revogado"; revogacao = { em: p.estornado_em, motivo: "Cancelamento da compra (reembolso)" }; }
  }
  return {
    codigo: m.certificado, status, revogacao, aluno_id: a.id,
    nome: a.nome, cpf: cpf === "completo" ? formatarCpf(a.cpf) : mascararCpf(a.cpf),
    curso: cu.titulo, nr: cu.nr, norma: cu.norma, modalidade: t.modalidade === "presencial" ? "Presencial" : t.modalidade === "hibrido" ? "Híbrida (Blended Learning)" : cu.modalidade, carga_horaria: Number(cu.carga_horaria),
    conteudo_programatico: cu.conteudo_programatico || [],
    instrutor_nome: t.instrutor_nome || cu.instrutor_nome, instrutor_qualificacao: cu.instrutor_qualificacao, instrutor_assinatura: cu.instrutor_assinatura,
    rt_nome: cu.rt_nome, rt_qualificacao: cu.rt_qualificacao, rt_assinatura: cu.rt_assinatura,
    turma: t.codigo, inicio: t.inicio, local: t.local, nota: m.nota, concluido_em: m.concluido_em, valido_ate: ate,
    emissor: "LIPPMANN TREINAMENTOS E SOLUÇÕES LTDA · CNPJ 53.000.126/0001-22",
    url_validacao: `${U.URL_OFICIAL}/validar.html?c=${encodeURIComponent(m.certificado)}`,
  };
}

async function registrar(aluno_id, matricula_id, acao, detalhe = "") {
  try { await db().from("uni_registros").insert({ aluno_id, matricula_id, acao, detalhe: String(detalhe).slice(0, 300) }); } catch (e) {}
}

/* e-mail com acesso ao AVA (senha provisória opcional) */
async function emailAcesso(aluno, senha, curso, turma) {
  const url = `${U.URL_OFICIAL}/unilts/`;
  const html = E.layout("Bem-vindo(a) à UniLTS", `
    <p>Olá, <b>${U.esc(aluno.nome.split(" ")[0])}</b>! Sua matrícula na <b>UniLTS</b>, o ambiente de ensino a distância da LIPPMANN, está confirmada.</p>
    ${E.tabela({ "Curso": curso ? curso.titulo : "", "Turma": turma ? turma.codigo : "", "Carga horária": curso ? `${Number(curso.carga_horaria)} horas` : "", "Endereço de acesso": url, "Login (e-mail)": aluno.email, "Senha provisória": senha || "" })}
    ${senha ? `<p style="font-size:13px;color:#49505C">Por segurança e em conformidade com a LGPD, a senha provisória deve ser trocada no primeiro acesso. Não compartilhe sua senha.</p>` : `<p style="font-size:13px;color:#49505C">Use a senha que você já cadastrou. Esqueceu? Clique em "Esqueci minha senha" na tela de acesso.</p>`}
    ${E.botao("Acessar a UniLTS", url)}
    <p style="font-size:13px;color:#49505C">Dúvidas: WhatsApp (11) 94013-8792 ou atendimento@lippmannts.com.</p>`);
  return E.enviar(aluno.email, `UniLTS · ${senha ? "Seu acesso e senha provisória" : "Nova matrícula"}${curso ? " · " + curso.titulo : ""}`, html);
}


/* ---------- Fase 4: prazos e expiração ---------- */
const DIA = 86400000;
const fimDaTurma = (t) => t.encerrada_em ? new Date(t.encerrada_em) : (t.fim ? new Date(t.fim + "T23:59:59-03:00") : null);
function revogarEm(t) { const f = fimDaTurma(t); if (!f) return null; const d = new Date(f); d.setMonth(d.getMonth() + 12); return d; }
/* Aplica as regras automáticas a uma matrícula (usado no acesso do aluno e no cron diário).
   1) EaD: 30 dias corridos (prazo_dias da turma) para concluir; estourou, o progresso volta a 0% e um novo prazo começa.
   2) 12 meses após o encerramento da turma, o acesso é revogado (reabilitação manual do superadmin). */
async function aplicarRegras(m, t) {
  if (!m || !t || m.status === "cancelado") return m;
  const agora = new Date(), upd = {};
  if (!m.acesso_revogado) {
    const rv = revogarEm(t);
    if (rv && agora > rv && !m.reabilitado_por) { upd.acesso_revogado = agora.toISOString(); await registrar(m.aluno_id, m.id, "acesso_revogado", "12 meses após o encerramento da turma " + t.codigo); }
  }
  if (t.modalidade === "ead" && m.status === "em_andamento" && !upd.acesso_revogado) {
    const dias = Number(t.prazo_dias || 30);
    if (!m.prazo_ate) upd.prazo_ate = new Date(Math.max(agora.getTime(), new Date(m.criado || agora).getTime()) + dias * DIA).toISOString();
    else if (agora > new Date(m.prazo_ate)) {
      Object.assign(upd, { aulas: {}, tentativas: (m.tentativas || []).map((x) => ({ ...x, descartada: true, motivo: "prazo" })), nota: null, resets: Number(m.resets || 0) + 1, prazo_ate: new Date(agora.getTime() + dias * DIA).toISOString() });
      await registrar(m.aluno_id, m.id, "prazo_expirado_reset", `prazo de ${dias} dias encerrado em ${m.prazo_ate}; progresso zerado`);
    }
  }
  if (Object.keys(upd).length) { await db().from("uni_matriculas").update(upd).eq("id", m.id); Object.assign(m, upd); }
  return m;
}
const diasRestantes = (m) => m.prazo_ate ? Math.max(0, Math.ceil((new Date(m.prazo_ate) - Date.now()) / DIA)) : null;
const cnpjValido = (v) => { const c = soDigitos(v); if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false; const calc = (n) => { const p = n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2]; const s = p.reduce((a, w, i) => a + Number(c[i]) * w, 0) % 11; return s < 2 ? 0 : 11 - s; }; return calc(12) === Number(c[12]) && calc(13) === Number(c[13]); };
const formatarCnpj = (v) => { const c = soDigitos(v); return c.length === 14 ? `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}` : String(v || ""); };

/* e-mail de acesso para empresa e parceiro */
async function emailPortal(tipo, pessoa, senha, extra) {
  const url = `${U.URL_OFICIAL}/${tipo === "empresa" ? "empresa" : "parceiro"}/`;
  const nomeArea = tipo === "empresa" ? "Área da Empresa" : "Painel do Parceiro";
  const html = E.layout(`Seu acesso à ${nomeArea} UniLTS`, `
    <p>Olá, <b>${U.esc(String(pessoa.nome || "").split(" ")[0])}</b>! Seu acesso à <b>${nomeArea}</b> da LIPPMANN foi ${senha ? "criado" : "atualizado"}.</p>
    ${E.tabela({ "Empresa": extra || "", "Endereço de acesso": url, "Login (e-mail)": pessoa.email, "Senha provisória": senha || "" })}
    <p style="font-size:13px;color:#49505C">Por segurança e em conformidade com a LGPD, a senha provisória deve ser trocada no primeiro acesso.</p>
    ${E.botao("Acessar", url)}`);
  return E.enviar(pessoa.email, `UniLTS · ${nomeArea} · acesso`, html);
}

/* ---------- Fase 4: dados completos da turma (painel, parceiro, empresa e relatório FR-DOC-18) ---------- */
const DOCUMENTOS = { "FR-DOC-02": "FR-DOC-02 · Lista de Presença", "FR-DOC-04": "FR-DOC-04 · Avaliação de Reação", "FR-DOC-09": "FR-DOC-09 · Avaliação Prática", "FR-DOC-11": "FR-DOC-11 · Avaliação Teórica", "TERMO-IMAGEM": "Termos de autorização de uso de imagem", "CREDENCIAL": "Credencial do instrutor (MTE/CREA)" };
const FOTOS = { "1-selfie": "1. Selfie com o Grupo", "2-teorico": "2. Exercício Teórico", "3-pratico": "3. Exercício Prático", "4-final": "4. Foto Final com a Turma" };
const RESOLUCAO_MINIMA = 1280;
async function urlsArquivos(lista) {
  const { BUCKET_EVIDENCIAS } = require("./supabase");
  const saida = [];
  for (const a of lista) {
    let url = "";
    try { const { data } = await db().storage.from(BUCKET_EVIDENCIAS).createSignedUrl(a.caminho, 3600); url = data && data.signedUrl || ""; } catch (e) {}
    saida.push({ ...a, url });
  }
  return saida;
}
async function dadosTurma(id, op = {}) {
  const { todas } = require("./supabase");
  const { data: t } = await db().from("uni_turmas").select("*").eq("id", Number(id)).maybeSingle();
  if (!t) return null;
  const [{ data: c }, emp, par] = await Promise.all([
    db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle(),
    t.empresa_id ? db().from("uni_empresas").select("id, razao_social, nome_fantasia, cnpj").eq("id", t.empresa_id).maybeSingle() : { data: null },
    t.parceiro_id ? db().from("uni_parceiros").select("id, nome, qualificacao, registro, email").eq("id", t.parceiro_id).maybeSingle() : { data: null },
  ]);
  const ms = await todas(() => db().from("uni_matriculas").select("*").eq("turma_id", t.id).order("criado"));
  for (const m of ms) await aplicarRegras(m, t);
  const ids = [...new Set(ms.map((m) => m.aluno_id))];
  const al = ids.length ? await todas(() => db().from("uni_alunos").select("id, nome, cpf, email, telefone, empresa, trocar_senha, ultimo_acesso").in("id", ids)) : [];
  const porId = Object.fromEntries(al.map((a) => [a.id, a]));
  const mids = ms.map((m) => m.id);
  const regs = op.logs && mids.length ? await todas(() => db().from("uni_registros").select("aluno_id, matricula_id, acao, detalhe, t").in("aluno_id", ids).order("t")) : [];
  const max = Number((c && c.tentativas_max) || 3);
  const matriculas = ms.map((m) => {
    const a = porId[m.aluno_id] || {};
    const meus = regs.filter((r) => r.aluno_id === m.aluno_id && (!r.matricula_id || r.matricula_id === m.id) && new Date(r.t) >= new Date(m.criado));
    return {
      id: m.id, status: m.status, nota: m.nota, nota_teorica: m.nota_teorica, nota_pratica: m.nota_pratica, certificado: m.certificado, concluido_em: m.concluido_em, criado: m.criado,
      presenca_entrada: m.presenca_entrada, presenca_saida: m.presenca_saida, prazo_ate: m.prazo_ate, dias_restantes: t.modalidade === "ead" && m.status === "em_andamento" ? diasRestantes(m) : null,
      resets: m.resets || 0, acesso_revogado: m.acesso_revogado, reabilitado_por: m.reabilitado_por,
      tentativas: tentativasValidas(m).length, tentativas_max: max, progresso: c ? progresso(c, m.aulas) : { pct: 0, feitas: 0, total: 0 },
      historico_tentativas: (m.tentativas || []).map((x) => ({ n: x.n, nota: x.nota, t: x.t, descartada: !!x.descartada, motivo: x.motivo || "" })),
      aulas: op.logs ? m.aulas || {} : undefined,
      logs: op.logs ? meus.map((r) => ({ acao: r.acao, detalhe: r.detalhe, t: r.t })) : undefined,
      aluno: { id: a.id, nome: a.nome, cpf: op.cpfMascarado ? mascararCpf(a.cpf) : formatarCpf(a.cpf), email: a.email, telefone: a.telefone, empresa: a.empresa, primeiro_acesso_pendente: !!a.trocar_senha, ultimo_acesso: a.ultimo_acesso },
    };
  });
  let arquivos = [];
  if (op.arquivos) { const { data } = await db().from("uni_turma_arquivos").select("*").eq("turma_id", t.id).order("criado"); arquivos = await urlsArquivos(data || []); }
  let certificados = [];
  if (op.certificados) for (const m of ms.filter((x) => x.status === "aprovado" && x.certificado)) { const d = await dadosCertificado(m.certificado, op.cpfMascarado ? "mascarado" : "completo"); if (d) { delete d.aluno_id; certificados.push(d); } }
  return { turma: t, curso: c, empresa: emp.data ? { ...emp.data, cnpj: formatarCnpj(emp.data.cnpj) } : null, parceiro: par.data, matriculas, arquivos, certificados, documentos: DOCUMENTOS, fotos: FOTOS, emissao: new Date().toISOString() };
}
/* conclusão de turma presencial/híbrida: aprova quem tem as duas notas acima do corte */
async function concluirPresencial(t, c, por) {
  const { todas } = require("./supabase");
  const corte = Number(c.nota_corte || 7);
  const ms = (await todas(() => db().from("uni_matriculas").select("*").eq("turma_id", t.id))).filter((m) => m.status !== "cancelado");
  let aprovados = 0;
  for (const m of ms) {
    if (m.status === "aprovado") { aprovados++; continue; }
    const te = m.nota_teorica === null || m.nota_teorica === undefined ? null : Number(m.nota_teorica), pr = m.nota_pratica === null || m.nota_pratica === undefined ? null : Number(m.nota_pratica);
    const upd = { nota: te !== null && pr !== null ? Math.round(((te + pr) / 2) * 100) / 100 : null };
    if (te !== null && pr !== null && te >= corte && pr >= corte) { upd.status = "aprovado"; upd.concluido_em = new Date(Math.min(Date.now(), new Date((t.fim || new Date().toISOString().slice(0, 10)) + "T12:00:00-03:00").getTime())).toISOString(); upd.certificado = await novoCodigoCertificado(t); aprovados++; }
    else upd.status = "reprovado";
    await db().from("uni_matriculas").update(upd).eq("id", m.id);
    await registrar(m.aluno_id, m.id, "resultado_presencial", `teórica ${te ?? "—"} · prática ${pr ?? "—"} · ${upd.status} (por ${por})`);
  }
  return { aprovados, total: ms.length };
}

/* ---------- Fase 5: pedidos pagos (B2C) ---------- */
const GARANTIA_DIAS = 7;   // direito de arrependimento (CDC, art. 49)
/* pagamento aprovado: cria o aluno (se preciso), matricula numa turma B2C aberta do curso e envia o acesso */
/* ---------- Fase 7: trilha obrigatória do instrutor parceiro ---------- */
const TRILHA_ID = "trilha-instrutor-parceiro";
async function trilhaDoParceiro(p) {
  if (p.trilha_dispensada) return { status: "dispensada" };
  const { data: a } = await db().from("uni_alunos").select("id").eq("email", p.email).maybeSingle();
  let mat = null;
  if (a) {
    const { data: ts } = await db().from("uni_turmas").select("id").eq("curso_id", TRILHA_ID);
    const ids = (ts || []).map((t) => t.id);
    if (ids.length) { const { data: ms } = await db().from("uni_matriculas").select("*").eq("aluno_id", a.id).in("turma_id", ids); mat = (ms || []).sort((x, y) => (y.status === "aprovado") - (x.status === "aprovado"))[0] || null; }
  }
  if (mat && mat.status === "aprovado") {
    if (!p.trilha_aprovada_em) await db().from("uni_parceiros").update({ trilha_aprovada_em: mat.concluido_em || new Date().toISOString(), aluno_id: a.id }).eq("id", p.id);
    return { status: "aprovada", matricula_id: mat.id, nota: mat.nota, certificado: mat.certificado, em: mat.concluido_em };
  }
  if (p.trilha_aprovada_em) return { status: "aprovada", em: p.trilha_aprovada_em };
  if (mat && mat.status !== "cancelado") { const { data: t } = await db().from("uni_turmas").select("*").eq("id", mat.turma_id).maybeSingle(); const { data: c } = await db().from("uni_cursos").select("modulos").eq("id", TRILHA_ID).maybeSingle(); return { status: "em_andamento", matricula_id: mat.id, progresso: progresso(c || {}, mat.aulas || {}) }; }
  return { status: "pendente" };
}
const trilhaLiberada = async (p) => ["aprovada", "dispensada"].includes((await trilhaDoParceiro(p)).status);
/* cria (ou reaproveita) o acesso de aluno do parceiro, com a mesma senha do Painel do Parceiro, e matricula na trilha */
async function trilhaIniciar(p) {
  const { data: c } = await db().from("uni_cursos").select("*").eq("id", TRILHA_ID).maybeSingle();
  if (!c || c.ativo === false) throw Object.assign(new Error("A trilha do instrutor ainda não foi cadastrada. Rode o supabase/schema.sql."), { publico: true });
  let { data: t } = await db().from("uni_turmas").select("*").eq("curso_id", TRILHA_ID).eq("status", "aberta").order("numero", { ascending: false }).limit(1).maybeSingle();
  if (!t) {
    const r = await db().rpc("uni_criar_turma2", { p_curso: TRILHA_ID, p_tipo: "b2c", p_inicio: new Date().toISOString().slice(0, 10), p_fim: null, p_local: "", p_instrutor: null, p_obs: "Trilha interna obrigatória dos instrutores parceiros (turma contínua)", p_modalidade: "ead", p_empresa: null, p_parceiro: null, p_prazo: 90 });
    if (r.error) throw r.error; t = Array.isArray(r.data) ? r.data[0] : r.data;
  }
  let { data: a } = await db().from("uni_alunos").select("*").eq("email", p.email).maybeSingle();
  if (!a) { const ins = await db().from("uni_alunos").insert({ nome: p.nome, cpf: p.cpf, email: p.email, telefone: p.telefone, senha_hash: p.senha_hash, trocar_senha: false }).select("*").single(); if (ins.error) throw ins.error; a = ins.data; }
  let { data: m } = await db().from("uni_matriculas").select("*").eq("aluno_id", a.id).eq("turma_id", t.id).maybeSingle();
  if (!m) { const ins = await db().from("uni_matriculas").insert({ aluno_id: a.id, turma_id: t.id, prazo_ate: new Date(Date.now() + 90 * DIA).toISOString() }).select("*").single(); if (ins.error) throw ins.error; m = ins.data; await registrar(a.id, m.id, "trilha_iniciada", `parceiro ${p.email}`); }
  await db().from("uni_parceiros").update({ aluno_id: a.id }).eq("id", p.id);
  return { aluno: a, matricula: m };
}

async function liberarPedido(pedido) {
  const { data: atual } = await db().from("uni_pedidos").select("*").eq("id", pedido.id).maybeSingle();
  if (!atual || atual.matricula_id) return atual;
  const { data: c } = await db().from("uni_cursos").select("*").eq("id", atual.curso_id).maybeSingle();
  let { data: t } = await db().from("uni_turmas").select("*").eq("curso_id", atual.curso_id).eq("tipo", "b2c").eq("modalidade", "ead").eq("status", "aberta").order("numero", { ascending: false }).limit(1).maybeSingle();
  if (!t) {
    const hoje = new Date().toISOString().slice(0, 10);
    const r = await db().rpc("uni_criar_turma2", { p_curso: atual.curso_id, p_tipo: "b2c", p_inicio: hoje, p_fim: null, p_local: "", p_instrutor: null, p_obs: "Turma contínua de vendas on-line (criada automaticamente)", p_modalidade: "ead", p_empresa: null, p_parceiro: null, p_prazo: 30 });
    if (r.error) throw r.error; t = Array.isArray(r.data) ? r.data[0] : r.data;
  }
  let { data: a } = await db().from("uni_alunos").select("*").eq("email", atual.email).maybeSingle();
  let senha = "";
  const S = require("./sessao");
  if (!a) { senha = gerarSenha(); const ins = await db().from("uni_alunos").insert({ nome: atual.nome, cpf: atual.cpf, email: atual.email, telefone: atual.telefone, senha_hash: S.hashSenha(senha), trocar_senha: true }).select("*").single(); if (ins.error) throw ins.error; a = ins.data; }
  else if (a.trocar_senha) { senha = gerarSenha(); await db().from("uni_alunos").update({ senha_hash: S.hashSenha(senha), ativo: true }).eq("id", a.id); }
  const prazo = new Date(Date.now() + Number(t.prazo_dias || 30) * DIA).toISOString();
  const { data: ja } = await db().from("uni_matriculas").select("*").eq("aluno_id", a.id).eq("turma_id", t.id).maybeSingle();
  let mid;
  if (ja) { await db().from("uni_matriculas").update({ status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, prazo_ate: prazo, resets: 0, pedido_id: atual.id, acesso_revogado: null }).eq("id", ja.id); mid = ja.id; }
  else { const ins = await db().from("uni_matriculas").insert({ aluno_id: a.id, turma_id: t.id, prazo_ate: prazo, pedido_id: atual.id }).select("id").single(); if (ins.error) throw ins.error; mid = ins.data.id; }
  await db().from("uni_pedidos").update({ aluno_id: a.id, matricula_id: mid, atualizado: new Date().toISOString() }).eq("id", atual.id);
  await registrar(a.id, mid, "pagamento_aprovado", `${atual.codigo} · ${atual.metodo} · R$ ${Number(atual.valor).toFixed(2)}`);
  await emailAcesso(a, senha, c, t);
  return { ...atual, aluno_id: a.id, matricula_id: mid };
}
/* estorno ou chargeback: bloqueia o acesso e invalida o certificado (a validação pública passa a mostrar "cancelado") */
async function bloquearPedido(pedido, motivo, por) {
  const agora = new Date().toISOString();
  await db().from("uni_pedidos").update({ status: "estornado", estornado_em: agora, estorno_motivo: motivo || null, estorno_por: por || null, atualizado: agora }).eq("id", pedido.id);
  if (pedido.matricula_id) {
    await db().from("uni_matriculas").update({ status: "cancelado" }).eq("id", pedido.matricula_id);
    await registrar(pedido.aluno_id, pedido.matricula_id, "estorno_bloqueio", `${pedido.codigo}: acesso bloqueado e certificado invalidado (${motivo || "estorno"})`);
  }
}
const dentroDaGarantia = (p) => p.pago_em && Date.now() - new Date(p.pago_em).getTime() <= GARANTIA_DIAS * DIA;
async function emailPedido(pedido, assunto, corpoHtml) { try { await E.enviar(pedido.email, assunto, E.layout(assunto, corpoHtml)); } catch (e) {} }

module.exports = { TRILHA_ID, trilhaDoParceiro, trilhaLiberada, trilhaIniciar, liberarPedido, bloquearPedido, dentroDaGarantia, emailPedido, GARANTIA_DIAS, dadosTurma, concluirPresencial, urlsArquivos, DOCUMENTOS, FOTOS, RESOLUCAO_MINIMA, aplicarRegras, diasRestantes, revogarEm, cnpjValido, formatarCnpj, emailPortal, gerarSenha, senhaForte, soDigitos, cpfValido, formatarCpf, mascararCpf, todasAulas, progresso, tentativasValidas, corrigir, semGabarito, validadeAte, novoCodigoCertificado, dadosCertificado, registrar, emailAcesso };
