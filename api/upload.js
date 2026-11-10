/* =====================================================================
   POST /api/upload · gera um endereço temporário para o navegador enviar
   o currículo DIRETO para o Supabase Storage (bucket privado "curriculos").
   Assim o arquivo não passa pela Vercel (que limita envios a 4,5 MB).
   ===================================================================== */
const crypto = require("crypto");
const { db, BUCKET_CURRICULOS } = require("./_lib/supabase");
const U = require("./_lib/util");

const MAX_MB = 5;

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "POST")) return;
  try {
    const b = await U.corpo(req);
    const nome = U.limpar(b.nome, 200);
    const tamanho = Number(b.tamanho || 0);
    const ext = (nome.split(".").pop() || "").toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) return U.erro(res, "Formato não aceito. Envie PDF, DOC ou DOCX.");
    if (!tamanho || tamanho > MAX_MB * 1024 * 1024) return U.erro(res, `O currículo deve ter no máximo ${MAX_MB} MB.`);
    if (!(await U.limite(req, "upload", 6, 600))) return U.erro(res, "Muitos envios em pouco tempo. Aguarde alguns minutos.", 429);
    const agora = new Date();
    const caminho = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await db().storage.from(BUCKET_CURRICULOS).createSignedUploadUrl(caminho);
    if (error) throw error;
    return U.ok(res, { caminho, url: data.signedUrl, apikey: process.env.SUPABASE_ANON_KEY || "" });
  } catch (e) {
    console.error("upload:", e);
    return U.erro(res, "Não foi possível preparar o envio do arquivo. Tente novamente.", 500);
  }
};
