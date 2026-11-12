/* =====================================================================
   Agenda comercial · Google Calendar + Google Meet
   Variáveis da Vercel (passo a passo no LEIA-ME):
     GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN  (OAuth da conta comercial@lippmannts.com)
     GOOGLE_CALENDAR_ID (opcional; padrão "primary", a agenda principal da conta autorizada)
   Sem elas, os horários seguem a janela comercial (seg a sex, 9h às 17h) e cada pedido
   de reunião fica "a confirmar": a equipe recebe o pedido por e-mail e confirma o link do Meet.
   ===================================================================== */
const crypto = require("crypto");
const M = require("../../assets/js/lipp-motor");

const configurada = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
const calendario = () => process.env.GOOGLE_CALENDAR_ID || "primary";
let cache = null;

async function token() {
  if (cache && cache.expira > Date.now() + 60000) return cache.valor;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error("Google OAuth: " + (j.error_description || j.error || r.status));
  cache = { valor: j.access_token, expira: Date.now() + (j.expires_in || 3000) * 1000 };
  return cache.valor;
}
async function google(caminho, op = {}) {
  const r = await fetch("https://www.googleapis.com/calendar/v3" + caminho, { ...op, headers: { Authorization: "Bearer " + (await token()), "Content-Type": "application/json", ...(op.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Google Calendar: " + ((j.error && j.error.message) || r.status));
  return j;
}

/* horários livres: janela comercial menos os compromissos da agenda (freeBusy) e as reuniões já marcadas */
async function horariosLivres(marcados = []) {
  const agora = new Date(), ate = new Date(agora.getTime() + 16 * 86400000);
  let ocupados = marcados.map((m) => ({ inicio: m.inicio, fim: m.fim }));
  let fonte = "janela";
  if (configurada()) {
    const fb = await google("/freeBusy", { method: "POST", body: JSON.stringify({ timeMin: agora.toISOString(), timeMax: ate.toISOString(), timeZone: "America/Sao_Paulo", items: [{ id: calendario() }] }) });
    const cal = (fb.calendars || {})[calendario()] || Object.values(fb.calendars || {})[0] || {};
    ocupados = ocupados.concat((cal.busy || []).map((b) => ({ inicio: b.start, fim: b.end })));
    fonte = "google";
  }
  return { fonte, horarios: M.horariosComerciais(ocupados, { dias: 10, max: 60 }) };
}

/* cria o evento com link do Google Meet e convida o visitante (o Google envia o convite por e-mail) */
async function criarReuniao({ inicio, fim, nome, email, telefone, empresa, necessidade }) {
  if (!configurada()) return { status: "solicitado", meet: null, evento: null };
  const ev = await google(`/calendars/${encodeURIComponent(calendario())}/events?conferenceDataVersion=1&sendUpdates=all`, {
    method: "POST",
    body: JSON.stringify({
      summary: `LIPPMANN · Reunião com ${nome}${empresa ? " (" + empresa + ")" : ""}`,
      description: `Reunião agendada pelo LIPP, assistente virtual do site lippmannts.com.\n\nNome: ${nome}\nE-mail: ${email}\nTelefone: ${telefone || "—"}\nEmpresa: ${empresa || "—"}\nNecessidade: ${necessidade || "—"}`,
      start: { dateTime: inicio, timeZone: "America/Sao_Paulo" }, end: { dateTime: fim, timeZone: "America/Sao_Paulo" },
      attendees: [{ email, displayName: nome }],
      conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      reminders: { useDefault: true },
    }),
  });
  const meet = ev.hangoutLink || ((ev.conferenceData || {}).entryPoints || []).filter((e) => e.entryPointType === "video").map((e) => e.uri)[0] || null;
  return { status: "agendado", meet, evento: ev.id, link_evento: ev.htmlLink };
}

module.exports = { configurada, horariosLivres, criarReuniao };
