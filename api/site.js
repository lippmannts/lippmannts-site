/* =====================================================================
   /api/site?modulo=... · APIs públicas do site reunidas numa só função
   catalogo · hub · politicas · materiais · i18n · avaliacoes · evento
   registrar · upload · protocolo · certificado · diagnostico
   (os endereços antigos /api/catalogo, /api/hub... continuam valendo pelo vercel.json)
   ===================================================================== */
const roteador = require("./_lib/roteador");
module.exports = roteador({
  catalogo: () => require("./_rotas/catalogo"),
  hub: () => require("./_rotas/hub"),
  politicas: () => require("./_rotas/politicas"),
  materiais: () => require("./_rotas/materiais"),
  i18n: () => require("./_rotas/i18n"),
  avaliacoes: () => require("./_rotas/avaliacoes"),
  evento: () => require("./_rotas/evento"),
  registrar: () => require("./_rotas/registrar"),
  upload: () => require("./_rotas/upload"),
  protocolo: () => require("./_rotas/protocolo"),
  certificado: () => require("./_rotas/certificado"),
  diagnostico: () => require("./_rotas/diagnostico"),
});
