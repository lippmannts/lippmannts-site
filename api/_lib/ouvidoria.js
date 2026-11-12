/* Ouvidoria rastreável: protocolos de Denúncias, Reclamações e Sugestões de Melhoria */
const crypto = require("crypto");
const { db } = require("./supabase");
const U = require("./util");
const E = require("./email");

const TIPOS = { "DENÚNCIAS": "denuncia", "RECLAMAÇÕES": "reclamacao", "SUGESTÕES DE MELHORIA": "sugestao" };
const ROTULO_TIPO = { denuncia: "Denúncia", reclamacao: "Reclamação", sugestao: "Sugestão de melhoria" };
const STATUS = { recebido: "Recebido", em_analise: "Em análise", respondido: "Respondido", concluido: "Concluído" };
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const novoProtocolo = () => `OUV-${new Date().getFullYear()}-${Array.from(crypto.randomBytes(6), (b) => ALFABETO[b % ALFABETO.length]).join("")}`;
const novaChave = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");
const hashChave = (protocolo, chave) => crypto.createHash("sha256").update(`${protocolo}:${String(chave).trim()}:${process.env.SESSAO_SEGREDO || "lts"}`).digest("hex");
const normProtocolo = (p) => U.limpar(p, 30).toUpperCase().replace(/\s+/g, "");
const urlConsulta = (protocolo) => `${U.URL_OFICIAL}/protocolo.html?p=${encodeURIComponent(protocolo)}`;

async function criar(registroId, r) {
  const tipo = TIPOS[r.assunto]; if (!tipo) return null;
  for (let i = 0; i < 4; i++) {
    const protocolo = novoProtocolo(), chave = novaChave();
    const { data, error } = await db().from("ouv_protocolos").insert({
      protocolo, chave_hash: hashChave(protocolo, chave), registro_id: registroId || null, tipo,
      nome: r.nome || null, email: r.email || null, telefone: r.telefone || null, anonimo: tipo === "denuncia" && !r.nome && !r.email, mensagem: r.mensagem,
    }).select("id").single();
    if (error) { if (String(error.code) === "23505") continue; throw error; }
    await db().from("ouv_mensagens").insert({ protocolo_id: data.id, autor: "sistema", texto: `${ROTULO_TIPO[tipo]} registrada. Protocolo ${protocolo}.`, publico: true, status_novo: "recebido" });
    if (r.email) {
      await E.enviar(r.email, `Protocolo ${protocolo} · Ouvidoria LIPPMANN`, E.layout(`Protocolo ${protocolo}`, `
        <p style="margin:0 0 14px">Olá${r.nome ? ", " + U.esc(r.nome.split(" ")[0]) : ""}! Recebemos a sua <b>${ROTULO_TIPO[tipo].toLowerCase()}</b>. Guarde os dados abaixo para acompanhar o andamento:</p>
        ${E.tabela({ "Protocolo": protocolo, "Código de acesso": chave, "Situação": "Recebido", "Consulta": urlConsulta(protocolo) })}
        <p style="font-size:13px;color:#49505C">Você receberá um e-mail a cada atualização. O código de acesso é pessoal: não o compartilhe.</p>
        ${E.botao("Consultar protocolo", urlConsulta(protocolo))}`), { replyTo: "atendimento@lippmannts.com" }).catch(() => {});
    }
    return { protocolo, chave, tipo };
  }
  throw new Error("Não foi possível gerar o protocolo.");
}

async function buscar(protocolo, chave) {
  const p = normProtocolo(protocolo);
  if (!/^OUV-\d{4}-[A-Z0-9]{6}$/.test(p) || !/^\d{6}$/.test(String(chave || "").trim())) return null;
  const { data } = await db().from("ouv_protocolos").select("*").eq("protocolo", p).maybeSingle();
  if (!data) return null;
  const a = Buffer.from(data.chave_hash), b = Buffer.from(hashChave(p, chave));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? data : null;
}

async function linhaDoTempo(id, soPublicas) {
  let q = db().from("ouv_mensagens").select("id, autor, texto, publico, status_novo, por, criado").eq("protocolo_id", id).order("criado");
  if (soPublicas) q = q.eq("publico", true);
  const { data } = await q;
  return data || [];
}

async function avisarAtualizacao(p, texto, status) {
  if (!p.email) return;
  await E.enviar(p.email, `Atualização do protocolo ${p.protocolo} · ${STATUS[status] || status}`, E.layout(`Protocolo ${p.protocolo}`, `
    <p style="margin:0 0 14px">Olá${p.nome ? ", " + U.esc(p.nome.split(" ")[0]) : ""}! O seu protocolo na Ouvidoria LIPPMANN foi atualizado.</p>
    ${E.tabela({ "Protocolo": p.protocolo, "Situação": STATUS[status] || status, "Resposta": texto || "" })}
    <p style="font-size:13px;color:#49505C">Para ver o histórico completo, use o código de acesso enviado no primeiro e-mail.</p>
    ${E.botao("Consultar protocolo", urlConsulta(p.protocolo))}`), { replyTo: "atendimento@lippmannts.com" }).catch(() => {});
}

module.exports = { TIPOS, ROTULO_TIPO, STATUS, criar, buscar, linhaDoTempo, avisarAtualizacao, normProtocolo, urlConsulta };
