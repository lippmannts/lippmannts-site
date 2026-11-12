/* GET /api/cron · tarefas automáticas diárias (agendadas no vercel.json)
   - EaD: zera o progresso de quem estourou o prazo de conclusão (30 dias corridos por padrão)
   - revoga o acesso 12 meses após o encerramento da turma (reabilitação manual do superadmin)
   - expira pedidos PIX não pagos
   Protegido pela variável CRON_SECRET (a Vercel envia "Authorization: Bearer <CRON_SECRET>"). */
const { db, todas } = require("./_lib/supabase");
const U = require("./_lib/util");
const N = require("./_lib/uni");

module.exports = async (req, res) => {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.authorization !== `Bearer ${segredo}`) return U.erro(res, "Não autorizado.", 401);
  try {
    const turmas = await todas(() => db().from("uni_turmas").select("*"));
    const agora = new Date();
    const alvo = turmas.filter((t) => t.modalidade !== "presencial" || (N.revogarEm(t) && agora > N.revogarEm(t)));
    let resets = 0, revogados = 0, verificadas = 0;
    for (const t of alvo) {
      const ms = await todas(() => db().from("uni_matriculas").select("*").eq("turma_id", t.id).neq("status", "cancelado"));
      for (const m of ms) {
        const antes = { r: m.resets || 0, v: !!m.acesso_revogado };
        await N.aplicarRegras(m, t); verificadas++;
        if ((m.resets || 0) > antes.r) resets++;
        if (!antes.v && m.acesso_revogado) revogados++;
      }
    }
    // PIX não pago dentro da validade: pedido expirado
    const { data: exp } = await db().from("uni_pedidos").update({ status: "expirado", atualizado: agora.toISOString() }).eq("status", "pendente").eq("metodo", "pix").lt("pix_expira", agora.toISOString()).select("id");
    return U.ok(res, { verificadas, resets, revogados, pix_expirados: (exp || []).length, em: agora.toISOString() });
  } catch (e) {
    console.error("cron:", e);
    return U.json(res, 500, { ok: false, mensagem: String(e.message || e) });
  }
};
