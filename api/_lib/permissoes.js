/* L³ INTEGRA · matriz de acessos (RBAC)
   Cada chave corresponde a uma aba do painel. O superadministrador (perfil "admin")
   tem todas, sempre. Os demais usuários têm só as abas marcadas no painel. */
const ABAS = {
  visao: "Visão geral",
  inteligencia: "Inteligência comercial",
  leads: "Leads e contatos",
  denuncias: "Denúncias e reclamações",
  lipp: "LIPP · Assistente IA (conversas, leads e reuniões)",
  newsletter: "Newsletter",
  talentos: "Banco de talentos",
  agenda: "Agenda",
  exportar: "Exportar dados",
  hub: "HUB e publicações",
  catalogo: "Treinamentos (catálogo)",
  solucoes: "Soluções (catálogo)",
  traducoes: "Traduções (multi-idiomas)",
  politicas: "Políticas e Termo",
  unilts: "UniLTS (AVA, turmas e certificados)",
  financeiro: "Financeiro e BI (vendas, despesas e provisão social)",
  materiais: "Materiais da Biblioteca",
  notificacoes: "Notificações e e-mail",
  usuarios: "Usuários e acessos",
  seguranca: "Segurança e backup",
};
const PADRAO_MARKETING = ["visao", "inteligencia", "leads", "lipp", "newsletter", "agenda", "exportar"];

function permissoesDe(u) {
  if (!u) return [];
  if (u.perfil === "admin") return Object.keys(ABAS);
  let p = u.permissoes;
  if (typeof p === "string") { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!Array.isArray(p)) p = u.perfil === "marketing" ? PADRAO_MARKETING : [];
  return p.filter((x) => ABAS[x]);
}
const limparLista = (lista) => [...new Set((Array.isArray(lista) ? lista : []).filter((x) => ABAS[x]))];

/* aba responsável por cada tipo de registro */
function abaDoRegistro(r) {
  if (!r) return "leads";
  if (r.tipo === "candidato") return "talentos";
  if (r.tipo === "newsletter") return "newsletter";
  if (r.tipo === "contato" && ["DENÚNCIAS", "RECLAMAÇÕES"].includes(r.assunto)) return "denuncias";
  return "leads";
}

module.exports = { ABAS, PADRAO_MARKETING, permissoesDe, limparLista, abaDoRegistro };
