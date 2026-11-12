/* UniLTS · integração com o Mercado Pago (API de pagamentos v1)
   Variáveis na Vercel:
     MP_ACCESS_TOKEN ..... chave secreta (TEST-... = sandbox; APP_USR-... = produção)
     MP_PUBLIC_KEY ....... chave pública (vai para o navegador, usada para tokenizar o cartão)
     MP_WEBHOOK_SECRET ... assinatura secreta das notificações (Suas integrações › Webhooks)
   Sem MP_ACCESS_TOKEN o sistema funciona em "simulação": nada é cobrado e a aprovação é feita no L³ INTEGRA. */
const crypto = require("crypto");
const API = "https://api.mercadopago.com";

const token = () => String(process.env.MP_ACCESS_TOKEN || "").trim();
const chavePublica = () => String(process.env.MP_PUBLIC_KEY || "").trim();
function ambiente() { const t = token(); return !t ? "simulacao" : /^TEST-/i.test(t) ? "sandbox" : "producao"; }

async function chamar(metodo, caminho, corpo, idem) {
  const h = { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" };
  if (idem) h["X-Idempotency-Key"] = idem;
  const r = await fetch(API + caminho, { method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j && (j.message || (j.cause && j.cause[0] && j.cause[0].description))) || `Mercado Pago respondeu ${r.status}`); e.mp = j; e.status = r.status; throw e; }
  return j;
}
const taxaDe = (p) => (p.fee_details || []).reduce((s, f) => s + Number(f.amount || 0), 0);
const STATUS = { approved: "aprovado", authorized: "pendente", pending: "pendente", in_process: "pendente", in_mediation: "pendente", rejected: "recusado", cancelled: "cancelado", refunded: "estornado", charged_back: "estornado" };

/* cria o pagamento (PIX dinâmico ou cartão tokenizado no navegador) */
async function criarPagamento(pedido, cartao, urlNotificacao) {
  const [primeiro, ...resto] = String(pedido.nome).trim().split(/\s+/);
  const base = {
    transaction_amount: Number(pedido.valor), description: `UniLTS · ${pedido.curso_titulo}`.slice(0, 250),
    external_reference: pedido.codigo, statement_descriptor: "LIPPMANN UNILTS",
    notification_url: urlNotificacao,
    payer: { email: pedido.email, first_name: primeiro, last_name: resto.join(" ") || primeiro, identification: { type: "CPF", number: pedido.cpf } },
    additional_info: { items: [{ id: pedido.curso_id, title: pedido.curso_titulo.slice(0, 250), quantity: 1, unit_price: Number(pedido.valor), category_id: "learnings" }] },
  };
  if (pedido.metodo === "pix") {
    const expira = new Date(Date.now() + 30 * 60000);
    return chamar("POST", "/v1/payments", { ...base, payment_method_id: "pix", date_of_expiration: expira.toISOString().replace("Z", "-00:00") }, `${pedido.codigo}-pix`);
  }
  return chamar("POST", "/v1/payments", { ...base, token: cartao.token, payment_method_id: cartao.payment_method_id, issuer_id: cartao.issuer_id || undefined, installments: Number(cartao.installments) || 1, binary_mode: true }, `${pedido.codigo}-cartao`);
}
const consultar = (id) => chamar("GET", `/v1/payments/${encodeURIComponent(id)}`);
const estornar = (id, codigo) => chamar("POST", `/v1/payments/${encodeURIComponent(id)}/refunds`, {}, `${codigo}-estorno`);

/* confere a assinatura x-signature das notificações (quando MP_WEBHOOK_SECRET existe) */
function webhookValido(req, dataId) {
  const segredo = String(process.env.MP_WEBHOOK_SECRET || "").trim();
  if (!segredo) return true;
  const sig = String(req.headers["x-signature"] || ""), reqId = String(req.headers["x-request-id"] || "");
  const partes = Object.fromEntries(sig.split(",").map((x) => x.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${partes.ts};`;
  const calc = crypto.createHmac("sha256", segredo).update(manifesto).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(partes.v1)); } catch (e) { return false; }
}

module.exports = { ambiente, chavePublica, criarPagamento, consultar, estornar, webhookValido, taxaDe, STATUS };
