/* =====================================================================
   /api/pagamento?acao=... · Checkout UniLTS (pessoa física) com Mercado Pago
   config · curso · criar (PIX dinâmico ou cartão) · status · reembolso (7 dias) · webhook
   ===================================================================== */
const crypto = require("crypto");
const { db } = require("./_lib/supabase");
const U = require("./_lib/util");
const N = require("./_lib/uni");
const MP = require("./_lib/mercadopago");

const chave = (codigo) => crypto.createHmac("sha256", process.env.SESSAO_SEGREDO || "lts").update("pedido:" + codigo).digest("hex").slice(0, 24);
const confere = (codigo, k) => { try { return crypto.timingSafeEqual(Buffer.from(chave(codigo)), Buffer.from(String(k || ""))); } catch (e) { return false; } };
const novoCodigo = () => `PED-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const publico = (p) => ({ codigo: p.codigo, status: p.status, metodo: p.metodo, valor: Number(p.valor), parcelas: p.parcelas, cartao_final: p.cartao_final, pix_copia_cola: p.status === "pendente" ? p.pix_copia_cola : null, pix_qr_base64: p.status === "pendente" ? p.pix_qr_base64 : null, pix_expira: p.pix_expira, pago_em: p.pago_em, estornado_em: p.estornado_em, ambiente: p.ambiente, email: p.email, mp_detalhe: p.mp_detalhe,
  reembolso_ate: p.pago_em ? new Date(new Date(p.pago_em).getTime() + N.GARANTIA_DIAS * 86400000).toISOString() : null, reembolsavel: p.status === "aprovado" && N.dentroDaGarantia(p) });

/* aplica o retorno do Mercado Pago ao pedido */
async function aplicar(pedido, pg) {
  const novo = MP.STATUS[pg.status] || "pendente";
  const upd = { mp_id: String(pg.id), mp_status: pg.status, mp_detalhe: pg.status_detail || null, taxa: MP.taxaDe(pg), atualizado: new Date().toISOString() };
  if (pg.card && pg.card.last_four_digits) upd.cartao_final = pg.card.last_four_digits;
  if (pg.payment_method_id && pedido.metodo === "cartao") upd.bandeira = pg.payment_method_id;
  const td = pg.point_of_interaction && pg.point_of_interaction.transaction_data;
  if (td) { upd.pix_copia_cola = td.qr_code || null; upd.pix_qr_base64 = td.qr_code_base64 || null; }
  if (pg.date_of_expiration) upd.pix_expira = pg.date_of_expiration;
  if (novo === "aprovado" && pedido.status !== "aprovado") { upd.status = "aprovado"; upd.pago_em = pg.date_approved || new Date().toISOString(); }
  else if (novo === "estornado" && pedido.status !== "estornado") { await N.bloquearPedido({ ...pedido, ...upd }, pg.status === "charged_back" ? "contestação (chargeback)" : "estorno no Mercado Pago", "mercadopago"); upd.status = "estornado"; }
  else if (["recusado", "cancelado"].includes(novo) && pedido.status === "pendente") upd.status = novo;
  await db().from("uni_pedidos").update(upd).eq("id", pedido.id);
  const atual = { ...pedido, ...upd };
  if (upd.status === "aprovado") {
    const lib = await N.liberarPedido(atual);
    await N.emailPedido(atual, `UniLTS · pagamento aprovado · ${atual.codigo}`, `<p>Recebemos o pagamento de <b>R$ ${Number(atual.valor).toFixed(2).replace(".", ",")}</b> (${atual.metodo === "pix" ? "PIX" : "cartão de crédito"}). O acesso ao curso foi enviado em outro e-mail.</p><p><b>Código de rastreio da compra: ${U.esc(atual.codigo)}</b> · acompanhe em <a href="${U.URL_OFICIAL}/pedido.html?c=${encodeURIComponent(atual.codigo)}">${U.URL_OFICIAL}/pedido.html</a></p><p style="font-size:13px;color:#49505C">Direito de arrependimento: reembolso integral em até ${N.GARANTIA_DIAS} dias. Para cancelar, envie o pedido formal para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792 com: código da compra, nome completo, CPF, e-mail e forma de pagamento. Após o estorno, o acesso é bloqueado e o certificado, se emitido, é revogado. Política de Reembolso e Cancelamento: ${U.URL_OFICIAL}/a-lippmann.html#politicas</p>`);
    return { ...atual, ...lib };
  }
  return atual;
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const acao = U.limpar((req.query && req.query.acao) || url.searchParams.get("acao"), 40);
  const q = (k) => (req.query && req.query[k]) || url.searchParams.get(k) || "";
  const post = req.method === "POST";
  try {
    /* ---------- notificação do Mercado Pago ---------- */
    if (acao === "webhook") {
      const b = post ? await U.corpo(req) : {};
      const id = (b.data && b.data.id) || q("data.id") || q("id");
      const tipo = b.type || b.topic || q("type") || q("topic");
      if (!id || (tipo && !/payment/.test(tipo))) return U.ok(res, { ignorado: true });
      if (MP.ambiente() === "simulacao") return U.ok(res, { ignorado: true });
      if (!MP.webhookValido(req, id)) return U.erro(res, "Assinatura inválida.", 401);
      const pg = await MP.consultar(id);
      let { data: p } = await db().from("uni_pedidos").select("*").eq("mp_id", String(pg.id)).maybeSingle();
      if (!p && pg.external_reference) p = (await db().from("uni_pedidos").select("*").eq("codigo", pg.external_reference).maybeSingle()).data;
      if (!p) return U.ok(res, { ignorado: true });
      await aplicar(p, pg);
      return U.ok(res);
    }
    if (acao === "config") return U.ok(res, { ambiente: MP.ambiente(), public_key: MP.chavePublica(), garantia_dias: N.GARANTIA_DIAS });
    if (acao === "curso") {
      const { data: c } = await db().from("uni_cursos").select("id, titulo, nr, carga_horaria, resumo, imagem, modalidade, preco, venda_online, ativo, conteudo_programatico").eq("id", U.limpar(q("id"), 80)).maybeSingle();
      if (!c || !c.ativo || !c.venda_online || !(Number(c.preco) > 0)) return U.erro(res, "Curso indisponível para compra on-line.", 404);
      return U.ok(res, { curso: { ...c, preco: Number(c.preco) }, ambiente: MP.ambiente(), public_key: MP.chavePublica(), garantia_dias: N.GARANTIA_DIAS });
    }
    if (post && req.headers["x-unilts"] !== "1") return U.erro(res, "Requisição inválida.", 403);
    const b = post ? await U.corpo(req) : {};

    if (acao === "criar") {
      if (!post) return U.erro(res, "Método não permitido.", 405);
      if (!(await U.limite(req, "pagamento", 10, 3600))) return U.erro(res, "Muitas tentativas de pagamento. Aguarde alguns minutos.", 429);
      const { data: c } = await db().from("uni_cursos").select("*").eq("id", U.limpar(b.curso_id, 80)).maybeSingle();
      if (!c || !c.ativo || !c.venda_online || !(Number(c.preco) > 0)) return U.erro(res, "Curso indisponível para compra on-line.");
      const nome = U.limpar(b.nome, 160), email = U.limpar(b.email, 160).toLowerCase(), cpf = N.soDigitos(b.cpf), telefone = U.limpar(b.telefone, 30);
      if (nome.split(/\s+/).length < 2) return U.erro(res, "Informe o nome completo (é o nome que sai no certificado).");
      if (!N.cpfValido(cpf)) return U.erro(res, "CPF inválido.");
      if (!U.emailValido(email)) return U.erro(res, "E-mail inválido.");
      if (!b.aceite) return U.erro(res, "É preciso aceitar os termos de compra.");
      const metodo = b.metodo === "cartao" ? "cartao" : "pix";
      const amb = MP.ambiente();
      if (metodo === "cartao" && amb !== "simulacao" && !(b.cartao && b.cartao.token)) return U.erro(res, "Dados do cartão incompletos.");
      const pedido = { codigo: novoCodigo(), curso_id: c.id, nome, cpf, email, telefone, valor: Number(c.preco), metodo, status: "pendente", taxa: 0, parcelas: metodo === "cartao" ? Math.min(12, Math.max(1, Number(b.cartao && b.cartao.installments) || 1)) : 1, ambiente: amb, ip_hash: U.ipHash ? U.ipHash(req) : null };
      const ins = await db().from("uni_pedidos").insert(pedido).select("*").single();
      if (ins.error) throw ins.error;
      let p = ins.data;
      if (amb === "simulacao") {
        // sem credenciais do Mercado Pago: simulação local (nada é cobrado)
        if (metodo === "pix") {
          const cc = `00020126580014BR.GOV.BCB.PIX0136SIMULACAO-${p.codigo}5204000053039865406${Number(p.valor).toFixed(2)}5802BR5925LIPPMANN TREINAMENTOS6009SAO PAULO62070503***6304ABCD`;
          await db().from("uni_pedidos").update({ pix_copia_cola: cc, pix_expira: new Date(Date.now() + 30 * 60000).toISOString(), mp_status: "pending", mp_detalhe: "simulacao" }).eq("id", p.id);
          p = { ...p, pix_copia_cola: cc, pix_expira: new Date(Date.now() + 30 * 60000).toISOString() };
        } else {
          const titular = String((b.cartao && b.cartao.titular) || "").trim().toUpperCase();
          const fim = String((b.cartao && b.cartao.numero) || "").replace(/\D/g, "").slice(-4);
          p = await aplicar({ ...p }, { id: `SIM-${p.codigo}`, status: titular === "OTHE" ? "rejected" : "approved", status_detail: titular === "OTHE" ? "cc_rejected_other_reason" : "accredited", card: { last_four_digits: fim }, payment_method_id: "simulacao", fee_details: [{ amount: Math.round(Number(p.valor) * 0.0499 * 100) / 100 }] });
        }
      } else {
        try {
          const pg = await MP.criarPagamento({ ...p, curso_titulo: c.titulo }, b.cartao || {}, `${U.URL_OFICIAL}/api/pagamento?acao=webhook`);
          p = await aplicar(p, pg);
        } catch (e) {
          await db().from("uni_pedidos").update({ status: "recusado", mp_detalhe: String(e.message).slice(0, 300), atualizado: new Date().toISOString() }).eq("id", p.id);
          return U.erro(res, `Pagamento não processado: ${e.message}`);
        }
      }
      const { data: final } = await db().from("uni_pedidos").select("*").eq("id", p.id).maybeSingle();
      return U.ok(res, { pedido: publico(final), chave: chave(final.codigo) });
    }
    if (acao === "status") {
      const codigo = U.limpar(q("codigo") || b.codigo, 40);
      if (!confere(codigo, q("chave") || b.chave)) return U.erro(res, "Pedido não encontrado.", 404);
      let { data: p } = await db().from("uni_pedidos").select("*").eq("codigo", codigo).maybeSingle();
      if (!p) return U.erro(res, "Pedido não encontrado.", 404);
      if (p.status === "pendente" && p.mp_id && MP.ambiente() !== "simulacao" && Date.now() - new Date(p.atualizado || p.criado).getTime() > 4000) {
        try { p = await aplicar(p, await MP.consultar(p.mp_id)); } catch (e) {}
      }
      if (p.status === "pendente" && p.pix_expira && new Date(p.pix_expira) < new Date()) { await db().from("uni_pedidos").update({ status: "expirado" }).eq("id", p.id); p.status = "expirado"; }
      return U.ok(res, { pedido: publico(p) });
    }
    if (acao === "consultar") {   // rastreio público: código da compra + e-mail usado na compra
      if (!post) return U.erro(res, "Método não permitido.", 405);
      if (!(await U.limite(req, "pedido-consulta", 20, 600))) return U.erro(res, "Muitas consultas. Aguarde alguns minutos.", 429);
      const codigo = U.limpar(b.codigo, 40).toUpperCase(), email = U.limpar(b.email, 160).toLowerCase();
      const { data: p } = await db().from("uni_pedidos").select("*").eq("codigo", codigo).maybeSingle();
      if (!p || String(p.email || "").toLowerCase() !== email) return U.erro(res, "Compra não encontrada. Confira o código e o e-mail usado na compra.", 404);
      const { data: c } = await db().from("uni_cursos").select("titulo").eq("id", p.curso_id).maybeSingle();
      return U.ok(res, { pedido: { ...publico(p), pix_copia_cola: null, pix_qr_base64: null, curso: c ? c.titulo : p.curso_id, nome: p.nome, cpf: N.mascararCpf(p.cpf), criado: p.criado, estorno_motivo: p.status === "estornado" ? p.estorno_motivo : null } });
    }
    if (acao === "reembolso") {   // cancelamento só por pedido formal (proteção contra solicitações indevidas)
      return U.erro(res, "Para cancelar, envie o pedido formal para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792 com: código da compra, nome completo, CPF, e-mail e forma de pagamento.", 403);
    }
    return U.erro(res, "Ação desconhecida.", 404);
  } catch (e) {
    console.error("pagamento:", acao, e);
    if (e && e.configuracao) return U.json(res, 500, { ok: false, mensagem: e.message });
    return U.json(res, 500, { ok: false, mensagem: "Erro no servidor. Tente novamente em instantes." });
  }
};

/* reembolso: pelo cliente só dentro dos 7 dias; pela LIPPMANN a qualquer momento */
async function reembolsar(p, motivo, por, forcar) {
  if (!p) return { ok: false, mensagem: "Pedido não encontrado." };
  if (p.status !== "aprovado") return { ok: false, mensagem: "Somente pedidos aprovados podem ser reembolsados." };
  if (!forcar && !N.dentroDaGarantia(p)) return { ok: false, mensagem: `O prazo de ${N.GARANTIA_DIAS} dias para reembolso terminou. Fale com a LIPPMANN pelo WhatsApp (11) 94013-8792.` };
  if (MP.ambiente() !== "simulacao" && p.mp_id && !String(p.mp_id).startsWith("SIM-")) {
    try { await MP.estornar(p.mp_id, p.codigo); } catch (e) { return { ok: false, mensagem: `O Mercado Pago não confirmou o estorno: ${e.message}` }; }
  }
  await N.bloquearPedido(p, motivo, por);
  await N.emailPedido(p, `UniLTS · reembolso confirmado · ${p.codigo}`, `<p>O reembolso de <b>R$ ${Number(p.valor).toFixed(2).replace(".", ",")}</b> foi solicitado ao Mercado Pago${p.metodo === "cartao" ? " e aparece na fatura do cartão conforme o prazo do banco emissor" : " e retorna para a conta de origem do PIX"}.</p><p>O acesso ao curso foi encerrado e o certificado, se emitido, foi cancelado.</p>`);
  return { ok: true, mensagem: "Reembolso confirmado. O acesso ao curso foi encerrado e o certificado, se emitido, foi cancelado." };
}
module.exports.reembolsar = reembolsar;
module.exports.aplicar = aplicar;
