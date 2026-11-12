/* UniLTS · login dos portais (Empresa e Parceiro/Instrutor)
   Mesma regra do aluno: senha provisória aleatória por e-mail e troca obrigatória no primeiro acesso.
   Cada portal tem cookie próprio; toda alteração exige o cabeçalho X-UniLTS: 1. */
const { db } = require("./supabase");
const U = require("./util");
const S = require("./sessao");
const N = require("./uni");

function criarPortal({ tabela, cookie, tipo, horas = 10, campos = "id, nome, email, trocar_senha, ativo" }) {
  async function atual(req) {
    const s = S.verificar(S.lerCookie(req, cookie));
    if (!s || !s.id) return null;
    const { data } = await db().from(tabela).select(campos).eq("id", s.id).maybeSingle();
    return data && data.ativo ? data : null;
  }
  /* trata login, logout, sessão, troca e esqueci; devolve true se respondeu */
  async function rotasPublicas(req, res, acao, b, post, extraSessao) {
    if (acao === "login") {
      if (!post) { U.erro(res, "Método não permitido.", 405); return true; }
      if (!(await U.limite(req, tipo + "-login", 8, 900))) { U.erro(res, "Muitas tentativas. Aguarde 15 minutos.", 429); return true; }
      const email = U.limpar(b.email, 160).toLowerCase();
      const { data: u } = await db().from(tabela).select("*").eq("email", email).maybeSingle();
      if (!u || !u.ativo || !S.conferirSenha(String(b.senha || "").trim(), u.senha_hash)) { await new Promise((r) => setTimeout(r, 400)); U.erro(res, "E-mail ou senha incorretos.", 401); return true; }
      if (extraSessao) { const bloqueio = await extraSessao(u); if (bloqueio) { U.erro(res, bloqueio, 403); return true; } }
      S.gravarCookie(res, cookie, S.assinar({ id: u.id }, horas), horas * 3600);
      await db().from(tabela).update({ ultimo_acesso: new Date().toISOString() }).eq("id", u.id);
      U.ok(res, { usuario: { nome: u.nome, email: u.email, trocar_senha: !!u.trocar_senha } }); return true;
    }
    if (acao === "logout") { S.gravarCookie(res, cookie, "", 0); U.ok(res); return true; }
    if (acao === "esqueci") {
      if (!post) { U.erro(res, "Método não permitido.", 405); return true; }
      if (!(await U.limite(req, tipo + "-esqueci", 4, 3600))) { U.erro(res, "Muitas solicitações. Tente mais tarde.", 429); return true; }
      const email = U.limpar(b.email, 160).toLowerCase();
      const { data: u } = await db().from(tabela).select("*").eq("email", email).maybeSingle();
      if (u && u.ativo) { const senha = N.gerarSenha(); await db().from(tabela).update({ senha_hash: S.hashSenha(senha), trocar_senha: true }).eq("id", u.id); await N.emailPortal(tipo, u, senha, ""); }
      U.ok(res, { mensagem: "Se o e-mail estiver cadastrado, você receberá uma nova senha provisória em instantes." }); return true;
    }
    return false;
  }
  async function rotasLogadas(req, res, acao, b, post, u) {
    if (acao === "sessao") { U.ok(res, { usuario: { nome: u.nome, email: u.email, trocar_senha: !!u.trocar_senha } }); return true; }
    if (acao === "trocar_senha") {
      if (!post) { U.erro(res, "Método não permitido.", 405); return true; }
      const { data: x } = await db().from(tabela).select("senha_hash").eq("id", u.id).maybeSingle();
      if (!S.conferirSenha(String(b.atual || "").trim(), x.senha_hash)) { U.erro(res, "A senha atual não confere."); return true; }
      const fraca = N.senhaForte(b.nova); if (fraca) { U.erro(res, fraca); return true; }
      if (String(b.nova) === String(b.atual).trim()) { U.erro(res, "A nova senha deve ser diferente da provisória."); return true; }
      await db().from(tabela).update({ senha_hash: S.hashSenha(b.nova), trocar_senha: false }).eq("id", u.id);
      U.ok(res, { mensagem: "Senha alterada com sucesso." }); return true;
    }
    if (u.trocar_senha) { U.json(res, 403, { ok: false, trocar_senha: true, mensagem: "Troque a senha provisória para continuar." }); return true; }
    return false;
  }
  return { atual, rotasPublicas, rotasLogadas };
}

module.exports = { criarPortal };
