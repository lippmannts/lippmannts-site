/* L³ INTEGRA · utilidades comuns das funções da Vercel
   (pastas e arquivos que começam com "_" não viram endereços públicos) */
const crypto = require("crypto");
const { db } = require("./supabase");

/* ---------- respostas ---------- */
function json(res, status, dados) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(dados));
}
const ok = (res, dados = {}) => json(res, 200, { ok: true, ...dados });
const erro = (res, mensagem, status = 400) => json(res, status, { ok: false, mensagem });

/* Lê o corpo da requisição em JSON (a Vercel normalmente já entrega pronto) */
async function corpo(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let texto = typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!texto && typeof req.on === "function" && !req.body) {
    texto = await new Promise((resolve) => {
      let d = ""; req.on("data", (c) => { d += c; if (d.length > 300000) req.destroy(); }); req.on("end", () => resolve(d)); req.on("error", () => resolve(""));
    });
  }
  try { return JSON.parse(texto || "{}"); } catch (e) { return {}; }
}

/* ---------- texto ---------- */
function limpar(v, max = 500) {
  if (typeof v !== "string") v = v === undefined || v === null ? "" : String(v);
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ""));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- visitante: IP anônimo, cidade (cabeçalhos da Vercel), dispositivo ---------- */
function ip(req) {
  const h = req.headers || {};
  return String(h["x-real-ip"] || (h["x-forwarded-for"] || "").split(",")[0] || "0.0.0.0").trim();
}
function ipHash(req) {
  return crypto.createHash("sha256").update((process.env.SESSAO_SEGREDO || "lts") + ip(req)).digest("hex").slice(0, 24);
}
function geo(req) {
  const h = req.headers || {};
  const dec = (v) => { try { return decodeURIComponent(v || ""); } catch (e) { return v || ""; } };
  return {
    cidade: limpar(dec(h["x-vercel-ip-city"]), 80),
    uf: limpar(h["x-vercel-ip-country-region"], 10),
    pais: limpar(h["x-vercel-ip-country"], 4),
  };
}
function dispositivo(req) {
  const ua = String((req.headers || {})["user-agent"] || "").toLowerCase();
  if (/bot|crawl|spider|slurp|facebookexternalhit|preview|vercel-screenshot/.test(ua)) return "robo";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "celular";
  return "computador";
}

/* ---------- limite de envios (anti-spam), guardado no Supabase ---------- */
async function limite(req, chave, max, segundos) {
  const k = chave + ":" + ipHash(req);
  const desde = new Date(Date.now() - segundos * 1000).toISOString();
  const { count } = await db().from("limites").select("id", { count: "exact", head: true }).eq("chave", k).gte("t", desde);
  if ((count || 0) >= max) return false;
  await db().from("limites").insert({ chave: k });
  // limpeza ocasional de registros antigos
  if (Math.random() < 0.02) await db().from("limites").delete().lt("t", new Date(Date.now() - 86400000).toISOString());
  return true;
}

function apenasMetodo(req, res, metodo) {
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return false; }
  if (req.method !== metodo) { erro(res, "Método não permitido.", 405); return false; }
  return true;
}

module.exports = { json, ok, erro, corpo, limpar, emailValido, esc, ip, ipHash, geo, dispositivo, limite, apenasMetodo };
