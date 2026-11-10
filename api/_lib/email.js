/* L³ INTEGRA · envio de e-mails (Nodemailer via SMTP do domínio) */
const nodemailer = require("nodemailer");
const { db, configGet } = require("./supabase");
const { esc } = require("./util");

const EQUIPE_PADRAO = "atendimento@lippmannts.com, comercial@lippmannts.com, lippmannts@gmail.com";

function transporte() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const seg = (process.env.SMTP_SECURE || "ssl").toLowerCase();
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || (seg === "tls" ? 587 : 465)),
    secure: seg === "ssl",
    requireTLS: seg === "tls",
    ignoreTLS: seg === "nenhuma",
    auth: process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10000,
  });
}
const remetente = () => process.env.SMTP_REMETENTE || process.env.SMTP_USER || "atendimento@lippmannts.com";

async function emailsEquipe() {
  const txt = await configGet("emails_notificacao", EQUIPE_PADRAO);
  return String(txt).split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
}

/** op: { replyTo, cc, anexos: [{filename, content|path}], ics, responderComo } */
async function enviar(para, assunto, html, op = {}) {
  const lista = [].concat(para || []).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
  if (!lista.length) return false;
  let okEnvio = false, falha = "";
  const t = transporte();
  if (!t) falha = "SMTP não configurado (variáveis SMTP_* na Vercel).";
  else {
    try {
      const msg = {
        from: { name: "LIPPMANN Treinamentos e Soluções", address: remetente() },
        to: lista, cc: op.cc, subject: assunto, html,
        text: html.replace(/<br\s*\/?>|<\/p>|<\/tr>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
        replyTo: op.replyTo || (op.responderComo && op.responderComo !== remetente() ? op.responderComo : undefined),
        attachments: op.anexos || [],
      };
      if (op.ics) msg.icalEvent = { method: "REQUEST", filename: "convite.ics", content: op.ics };
      await t.sendMail(msg);
      okEnvio = true;
    } catch (e) { falha = String(e && e.message || e); }
  }
  try { await db().from("emails_log").insert({ para: lista.join(", "), assunto, ok: okEnvio, erro: falha.slice(0, 500) }); } catch (e) {}
  return okEnvio;
}

function layout(titulo, conteudo) {
  const url = process.env.URL_SITE || "https://www.lippmannts.com";
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4F6FA;font-family:Arial,Helvetica,sans-serif;color:#1B2433">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:24px 0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden">
    <tr><td style="background:#0A3490;padding:22px 28px">
      <div style="font-size:22px;letter-spacing:6px;font-weight:bold;color:#ffffff">LIPPMANN</div>
      <div style="font-size:10px;letter-spacing:3px;color:#9DB8F2">TREINAMENTOS E SOLUÇÕES</div>
    </td></tr>
    <tr><td style="padding:28px"><h1 style="margin:0 0 16px;font-size:20px;color:#003376">${esc(titulo)}</h1>${conteudo}</td></tr>
    <tr><td style="background:#003376;padding:18px 28px;color:#D6DFF2;font-size:12px;line-height:1.6">
      <b style="color:#ffffff">Segurança não é prioridade. Segurança é valor.</b><br>
      WhatsApp (11) 94013-8792 · comercial@lippmannts.com · <a href="${esc(url)}" style="color:#ffffff">www.lippmannts.com</a>
    </td></tr>
  </table></td></tr></table></body></html>`;
}
function tabela(linhas) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">' +
    Object.entries(linhas).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #DFE0E2;width:38%;color:#49505C;font-weight:bold;vertical-align:top">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #DFE0E2;vertical-align:top">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("") + "</table>";
}
const botao = (texto, url, cor = "#1F55C9") => `<p style="margin:22px 0 4px"><a href="${esc(url)}" style="display:inline-block;background:${cor};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:6px">${esc(texto)}</a></p>`;

module.exports = { enviar, emailsEquipe, layout, tabela, botao, remetente, smtpConfigurado: () => !!process.env.SMTP_HOST };
