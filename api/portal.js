/* =====================================================================
   /api/portal?modulo=empresa|parceiro&acao=... · Área da Empresa e Painel do Parceiro (UniLTS)
   (os endereços antigos /api/empresa e /api/parceiro continuam valendo pelo vercel.json)
   ===================================================================== */
const roteador = require("./_lib/roteador");
module.exports = roteador({
  empresa: () => require("./_rotas/empresa"),
  parceiro: () => require("./_rotas/parceiro"),
});
