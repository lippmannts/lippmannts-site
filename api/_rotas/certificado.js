/* GET /api/certificado?c=CODIGO · validação pública de certificados UniLTS (QR Code)
   Mostra apenas o necessário para conferência; o CPF aparece mascarado (LGPD). */
const U = require("../_lib/util");
const N = require("../_lib/uni");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  try {
    const url = new URL(req.url, "http://x");
    const codigo = (req.query && req.query.c) || url.searchParams.get("c") || "";
    if (!(await U.limite(req, "cert", 60, 600))) return U.erro(res, "Muitas consultas. Aguarde alguns minutos.", 429);
    const d = await N.dadosCertificado(codigo, "mascarado");
    if (!d) return U.json(res, 404, { ok: false, mensagem: "Certificado não encontrado. Confira o código impresso no documento." });
    delete d.aluno_id;
    return U.ok(res, { certificado: d });
  } catch (e) {
    console.error("certificado:", e);
    return U.json(res, 500, { ok: false, mensagem: "Validação indisponível no momento." });
  }
};
