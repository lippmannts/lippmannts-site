/* POST /api/protocolo · consulta pública da Ouvidoria (protocolo + código de acesso)
   acao: "consultar" | "complementar" (o solicitante acrescenta informações) */
const U = require("../_lib/util");
const O = require("../_lib/ouvidoria");
const E = require("../_lib/email");
const { db } = require("../_lib/supabase");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "POST")) return;
  try {
    if (!(await U.limite(req, "protocolo", 30, 600))) return U.erro(res, "Muitas consultas. Aguarde alguns minutos.", 429);
    const b = await U.corpo(req);
    const p = await O.buscar(b.protocolo, b.chave);
    if (!p) return U.erro(res, "Protocolo não encontrado ou código de acesso incorreto.", 404);
    if (b.acao === "complementar") {
      const texto = U.limpar(b.texto, 3000);
      if (texto.length < 5) return U.erro(res, "Escreva a informação complementar.");
      if (p.status === "concluido") return U.erro(res, "Este protocolo já foi concluído. Se precisar, abra um novo pelo Fale Conosco.");
      await db().from("ouv_mensagens").insert({ protocolo_id: p.id, autor: "solicitante", texto, publico: true });
      await db().from("ouv_protocolos").update({ atualizado: new Date().toISOString(), status: p.status === "respondido" ? "em_analise" : p.status }).eq("id", p.id);
      await E.enviar(await E.emailsEquipe(), `[L³ INTEGRA] Ouvidoria · complemento no protocolo ${p.protocolo}`, E.layout(`Complemento · ${p.protocolo}`, `${E.tabela({ "Tipo": O.ROTULO_TIPO[p.tipo], "Protocolo": p.protocolo, "Complemento": texto })}${E.botao("Abrir o L³ INTEGRA", U.URL_OFICIAL + "/integra/#ouvidoria")}`)).catch(() => {});
    }
    const atual = b.acao === "complementar" ? (await db().from("ouv_protocolos").select("*").eq("id", p.id).single()).data : p;
    return U.ok(res, { protocolo: {
      protocolo: atual.protocolo, tipo: O.ROTULO_TIPO[atual.tipo], status: atual.status, status_rotulo: O.STATUS[atual.status],
      criado: atual.criado, atualizado: atual.atualizado, mensagem: atual.mensagem, anonimo: atual.anonimo,
      historico: (await O.linhaDoTempo(atual.id, true)).map((m) => ({ autor: m.autor, texto: m.texto, status: m.status_novo, criado: m.criado })),
    } });
  } catch (e) {
    console.error("protocolo:", e);
    return U.erro(res, "Consulta indisponível no momento.", 500);
  }
};
