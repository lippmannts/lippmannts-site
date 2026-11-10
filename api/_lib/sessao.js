/* L³ INTEGRA · senhas e sessão do painel
   - Senhas: scrypt (nativo do Node), nunca guardadas em texto.
   - Sessão: cookie HttpOnly assinado com SESSAO_SEGREDO (variável da Vercel).
   - Proteção extra: toda alteração exige o cabeçalho X-L3-Token. */
const crypto = require("crypto");

function segredo() {
  const s = process.env.SESSAO_SEGREDO;
  if (!s || s.length < 24) throw new Error("Configure SESSAO_SEGREDO (texto aleatório com 32+ caracteres) nas variáveis da Vercel.");
  return s;
}

function hashSenha(senha) {
  const sal = crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(String(senha), sal, 64).toString("hex");
  return `scrypt$${sal}$${h}`;
}
function conferirSenha(senha, guardado) {
  const [alg, sal, h] = String(guardado || "").split("$");
  if (alg !== "scrypt" || !sal || !h) return false;
  const calc = crypto.scryptSync(String(senha), sal, 64);
  const ref = Buffer.from(h, "hex");
  return ref.length === calc.length && crypto.timingSafeEqual(ref, calc);
}

const b64 = (b) => Buffer.from(b).toString("base64url");
function assinar(dados, horas = 8) {
  const corpo = b64(JSON.stringify({ ...dados, exp: Date.now() + horas * 3600000 }));
  const sig = crypto.createHmac("sha256", segredo()).update(corpo).digest("base64url");
  return `${corpo}.${sig}`;
}
function verificar(token) {
  const [corpo, sig] = String(token || "").split(".");
  if (!corpo || !sig) return null;
  const esperado = crypto.createHmac("sha256", segredo()).update(corpo).digest("base64url");
  if (sig.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado))) return null;
  try { const d = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")); return d.exp > Date.now() ? d : null; } catch (e) { return null; }
}

function lerCookie(req, nome) {
  const c = String((req.headers || {}).cookie || "");
  const m = c.split(/;\s*/).find((p) => p.startsWith(nome + "="));
  return m ? decodeURIComponent(m.slice(nome.length + 1)) : "";
}
function gravarCookie(res, nome, valor, maxIdade) {
  const seguro = process.env.VERCEL ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${nome}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxIdade}${seguro}`);
}

module.exports = { hashSenha, conferirSenha, assinar, verificar, lerCookie, gravarCookie };
