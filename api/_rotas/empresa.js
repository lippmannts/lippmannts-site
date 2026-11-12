/* =====================================================================
   /api/empresa?acao=... · Área da Empresa (cliente PJ) · UniLTS
   ISOLAMENTO: toda consulta é filtrada pelo empresa_id do usuário logado
   (vem da sessão assinada, nunca do navegador).
   ===================================================================== */
const { db, todas } = require("../_lib/supabase");
const U = require("../_lib/util");
const S = require("../_lib/sessao");
const N = require("../_lib/uni");
const { criarPortal } = require("../_lib/portal");

const portal = criarPortal({ tabela: "uni_empresa_usuarios", cookie: "emp_sessao", tipo: "empresa", campos: "id, empresa_id, nome, email, trocar_senha, ativo" });
const CAMPOS = ["nome", "matricula", "rg", "cpf", "admissao", "aso_data", "aso_tipo", "apto_altura", "apto_confinado", "apto_eletricidade", "cargo", "unidade", "filial", "centro_custo", "area", "telefone", "email"];
const TIPOS_ASO = ["Admissional", "Periódico", "Retorno ao trabalho", "Mudança de risco ocupacional", "Demissional"];

const data = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 86400000)); return isNaN(d) ? undefined : d.toISOString().slice(0, 10); }   // data serial do Excel
  const s = String(v).trim(); let m;
  let a, me, di;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [di, me, a] = [m[1], m[2], m[3]];
  else if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) [a, me, di] = [m[1], m[2], m[3]];
  else return undefined;
  const iso = `${a}-${String(me).padStart(2, "0")}-${String(di).padStart(2, "0")}`, d = new Date(iso + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === iso && +a > 1900 && +a < 2100 ? iso : undefined;
};
const simNao = (v) => { const s = String(v ?? "").trim().toLowerCase(); if (!s) return null; if (["sim", "s", "x", "true", "1", "yes"].includes(s)) return true; if (["não", "nao", "n", "false", "0", "no"].includes(s)) return false; return undefined; };

async function empresaDoUsuario(u) {
  const { data: e } = await db().from("uni_empresas").select("*").eq("id", u.empresa_id).maybeSingle();
  return e && e.ativo ? e : null;
}
async function turmaDaEmpresa(eid, id) {
  const { data: t } = await db().from("uni_turmas").select("*").eq("id", Number(id) || 0).eq("empresa_id", eid).maybeSingle();
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
    if (await portal.rotasPublicas(req, res, acao, b, post, async (u) => { const e = await empresaDoUsuario(u); return e ? "" : "O acesso desta empresa está suspenso. Fale com a LIPPMANN."; })) return;
    const u = await portal.atual(req);
    if (!u) return U.json(res, 401, { ok: false, mensagem: "Sua sessão expirou. Entre novamente." });
    if (await portal.rotasLogadas(req, res, acao, b, post, u)) return;
    const emp = await empresaDoUsuario(u);
    if (!emp) return U.json(res, 403, { ok: false, mensagem: "O acesso desta empresa está suspenso. Fale com a LIPPMANN." });
    const EID = emp.id;

    switch (acao) {
      case "resumo": {
        const cols = await todas(() => db().from("uni_colaboradores").select("id, unidade, filial, area, centro_custo, cargo").eq("empresa_id", EID));
        const { data: turmas } = await db().from("uni_turmas").select("*").eq("empresa_id", EID).order("numero", { ascending: false });
        const { data: cursos } = await db().from("uni_cursos").select("id, titulo, nr, carga_horaria, validade_meses");
        const nomes = Object.fromEntries((cursos || []).map((c) => [c.id, c]));
        const tids = (turmas || []).map((t) => t.id);
        const ms = tids.length ? await todas(() => db().from("uni_matriculas").select("id, turma_id, status, concluido_em").in("turma_id", tids)) : [];
        const lista = (turmas || []).map((t) => { const x = ms.filter((m) => m.turma_id === t.id && m.status !== "cancelado"); return { id: t.id, codigo: t.codigo, curso: (nomes[t.curso_id] || {}).titulo || t.curso_id, modalidade: t.modalidade, inicio: t.inicio, fim: t.fim, status: t.status, prazo_dias: t.prazo_dias, total: x.length, aprovados: x.filter((m) => m.status === "aprovado").length }; });
        const uniq = (k) => [...new Set(cols.map((c) => c[k]).filter(Boolean))].sort((a, b2) => a.localeCompare(b2, "pt-BR"));
        return U.ok(res, { empresa: { razao_social: emp.razao_social, nome_fantasia: emp.nome_fantasia, cnpj: N.formatarCnpj(emp.cnpj) }, usuario: { nome: u.nome },
          totais: { colaboradores: cols.length, matriculas: ms.filter((m) => m.status !== "cancelado").length, aprovados: ms.filter((m) => m.status === "aprovado").length, em_andamento: ms.filter((m) => m.status === "em_andamento").length },
          turmas: lista, filtros: { unidade: uniq("unidade"), filial: uniq("filial"), area: uniq("area"), centro_custo: uniq("centro_custo"), cargo: uniq("cargo") }, tipos_aso: TIPOS_ASO });
      }
      case "colaboradores": {
        const cols = await todas(() => db().from("uni_colaboradores").select("*").eq("empresa_id", EID).order("nome"));
        const { data: turmas } = await db().from("uni_turmas").select("id, codigo, curso_id, modalidade").eq("empresa_id", EID);
        const { data: cursos } = await db().from("uni_cursos").select("id, titulo, nr, carga_horaria, validade_meses");
        const cmap = Object.fromEntries((cursos || []).map((c) => [c.id, c])), tmap = Object.fromEntries((turmas || []).map((t) => [t.id, t]));
        const cids = cols.map((c) => c.id);
        const ms = cids.length ? await todas(() => db().from("uni_matriculas").select("id, colaborador_id, turma_id, status, concluido_em, certificado, nota, aulas").in("colaborador_id", cids)) : [];
        return U.ok(res, { colaboradores: cols.map((c) => ({ ...c, cpf: N.formatarCpf(c.cpf), cursos: ms.filter((m) => m.colaborador_id === c.id && m.status !== "cancelado").map((m) => {
          const t = tmap[m.turma_id] || {}, cu = cmap[t.curso_id] || {};
          return { turma: t.codigo, curso: cu.titulo, nr: cu.nr, status: m.status, nota: m.nota, concluido_em: m.concluido_em, valido_ate: N.validadeAte(cu, m.concluido_em), certificado: m.certificado, progresso: cu.id ? N.progresso(cu, m.aulas).pct : 0 };
        }) })) });
      }
      case "importar": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const linhas = Array.isArray(b.linhas) ? b.linhas.slice(0, 3000) : [];
        if (!linhas.length) return U.erro(res, "A planilha está vazia.");
        const existentes = await todas(() => db().from("uni_colaboradores").select("id, cpf").eq("empresa_id", EID));
        const porCpf = Object.fromEntries(existentes.map((c) => [c.cpf, c.id]));
        const erros = []; let novos = 0, atualizados = 0; const vistos = new Set();
        for (let i = 0; i < linhas.length; i++) {
          const l = linhas[i] || {}, n = Number(l._linha) || i + 2, falhas = [];
          const reg = { empresa_id: EID, atualizado: new Date().toISOString() };
          reg.nome = U.limpar(l.nome, 160); if (reg.nome.split(/\s+/).length < 2) falhas.push("nome completo");
          reg.cpf = N.soDigitos(l.cpf); if (!N.cpfValido(reg.cpf)) falhas.push("CPF inválido"); else if (vistos.has(reg.cpf)) falhas.push("CPF repetido na planilha");
          for (const k of ["matricula", "rg", "cargo", "unidade", "filial", "centro_custo", "area", "telefone"]) reg[k] = U.limpar(l[k], 160) || null;
          reg.email = U.limpar(l.email, 160).toLowerCase() || null; if (reg.email && !U.emailValido(reg.email)) falhas.push("e-mail inválido");
          for (const k of ["admissao", "aso_data"]) { const d = data(l[k]); if (d === undefined) falhas.push(`${k === "admissao" ? "admissão" : "data do ASO"} (use DD/MM/AAAA)`); else reg[k] = d; }
          reg.aso_tipo = U.limpar(l.aso_tipo, 60) || null;
          if (reg.aso_tipo) { const t = TIPOS_ASO.find((x) => x.toLowerCase() === reg.aso_tipo.toLowerCase()); if (!t) falhas.push("tipo do ASO"); else reg.aso_tipo = t; }
          for (const k of ["apto_altura", "apto_confinado", "apto_eletricidade"]) { const v = simNao(l[k]); if (v === undefined) falhas.push(`${k.replace("apto_", "aptidão ")} (Sim/Não)`); else reg[k] = v; }
          if (falhas.length) { erros.push({ linha: n, nome: reg.nome || "", erro: falhas.join(", ") }); continue; }
          vistos.add(reg.cpf);
          const { error } = await db().from("uni_colaboradores").upsert(reg, { onConflict: "empresa_id,cpf" });
          if (error) { erros.push({ linha: n, nome: reg.nome, erro: "não foi possível gravar" }); continue; }
          porCpf[reg.cpf] ? atualizados++ : novos++;
          porCpf[reg.cpf] = porCpf[reg.cpf] || true;
        }
        return U.ok(res, { novos, atualizados, erros, mensagem: `${novos} colaborador(es) novo(s), ${atualizados} atualizado(s)${erros.length ? `, ${erros.length} linha(s) com erro` : ""}.` });
      }
      case "colaborador_excluir": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        await db().from("uni_colaboradores").delete().eq("id", Number(b.id)).eq("empresa_id", EID);
        return U.ok(res);
      }
      case "vincular": {
        if (!post) return U.erro(res, "Método não permitido.", 405);
        const t = await turmaDaEmpresa(EID, b.turma_id);
        if (!t) return U.erro(res, "Turma não encontrada para a sua empresa.");
        if (t.status !== "aberta") return U.erro(res, "A turma não está aberta para matrículas.");
        const { data: c } = await db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle();
        const ids = (Array.isArray(b.colaboradores) ? b.colaboradores : []).map(Number).filter(Boolean).slice(0, 500);
        if (!ids.length) return U.erro(res, "Selecione ao menos um colaborador.");
        const cols = await todas(() => db().from("uni_colaboradores").select("*").eq("empresa_id", EID).in("id", ids));
        const resultado = { matriculados: 0, ja: 0, sem_email: [], emails: 0 };
        for (const col of cols) {
          if (t.modalidade !== "presencial" && !col.email) { resultado.sem_email.push(col.nome); continue; }
          let aluno = null, senha = "";
          if (col.aluno_id) aluno = (await db().from("uni_alunos").select("*").eq("id", col.aluno_id).maybeSingle()).data;
          if (!aluno && col.email) aluno = (await db().from("uni_alunos").select("*").eq("email", col.email).maybeSingle()).data;
          if (!aluno) {
            if (col.email) senha = N.gerarSenha();
            const ins = await db().from("uni_alunos").insert({ nome: col.nome, cpf: col.cpf, email: col.email || null, telefone: col.telefone, empresa: emp.nome_fantasia || emp.razao_social, senha_hash: senha ? S.hashSenha(senha) : null, trocar_senha: true }).select("*").single();
            if (ins.error) throw ins.error; aluno = ins.data;
          } else if (aluno.trocar_senha && col.email && t.modalidade !== "presencial") { senha = N.gerarSenha(); await db().from("uni_alunos").update({ senha_hash: S.hashSenha(senha) }).eq("id", aluno.id); }
          if (col.aluno_id !== aluno.id) await db().from("uni_colaboradores").update({ aluno_id: aluno.id }).eq("id", col.id);
          const { data: ja } = await db().from("uni_matriculas").select("id, status").eq("aluno_id", aluno.id).eq("turma_id", t.id).maybeSingle();
          if (ja && ja.status !== "cancelado") { resultado.ja++; continue; }
          const prazo = t.modalidade !== "presencial" ? new Date(Date.now() + Number(t.prazo_dias || 30) * 86400000).toISOString() : null;
          if (ja) await db().from("uni_matriculas").update({ status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, colaborador_id: col.id, prazo_ate: prazo, resets: 0 }).eq("id", ja.id);
          else { const { error } = await db().from("uni_matriculas").insert({ aluno_id: aluno.id, turma_id: t.id, colaborador_id: col.id, prazo_ate: prazo }); if (error) throw error; }
          await N.registrar(aluno.id, null, "matricula_empresa", `${t.codigo} por ${u.email}`);
          resultado.matriculados++;
          if (t.modalidade !== "presencial" && aluno.email) { if (await N.emailAcesso(aluno, senha, c, t)) resultado.emails++; }
        }
        return U.ok(res, { ...resultado, mensagem: `${resultado.matriculados} colaborador(es) vinculado(s) à turma ${t.codigo}.${resultado.ja ? ` ${resultado.ja} já estava(m) matriculado(s).` : ""}${resultado.sem_email.length ? ` Sem e-mail (obrigatório para EaD): ${resultado.sem_email.join(", ")}.` : ""}` });
      }
      case "relatorio": {
        const t = await turmaDaEmpresa(EID, q("id"));
        if (!t) return U.erro(res, "Turma não encontrada para a sua empresa.", 404);
        const d = await N.dadosTurma(t.id, { logs: true, arquivos: true, certificados: true });
        return U.ok(res, { ...d, responsavel: u.nome });
      }
      case "certificado": {
        const d = await N.dadosCertificado(q("c"), "completo");
        if (!d) return U.erro(res, "Certificado não encontrado.", 404);
        const { data: m } = await db().from("uni_matriculas").select("turma_id, colaborador_id").eq("certificado", d.codigo).maybeSingle();
        const t = m ? await turmaDaEmpresa(EID, m.turma_id) : null;
        let meu = !!t;
        if (!meu && m && m.colaborador_id) { const { data: col } = await db().from("uni_colaboradores").select("id").eq("id", m.colaborador_id).eq("empresa_id", EID).maybeSingle(); meu = !!col; }
        if (!meu) return U.erro(res, "Certificado não encontrado.", 404);
        delete d.aluno_id; return U.ok(res, { certificado: d });
      }
      default: return U.erro(res, "Ação desconhecida.", 404);
    }
  } catch (e) {
    console.error("empresa:", acao, e);
    if (e && e.configuracao) return U.json(res, 500, { ok: false, mensagem: e.message });
    return U.json(res, 500, { ok: false, mensagem: "Erro no servidor. Tente novamente em instantes." });
  }
};
