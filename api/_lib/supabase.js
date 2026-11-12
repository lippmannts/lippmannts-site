/* L³ INTEGRA · conexão com o Supabase (somente no servidor)
   A chave secreta (service_role / secret key) fica APENAS nas variáveis de
   ambiente da Vercel. Nunca coloque essa chave em arquivos do site ou no GitHub.

   Nomes de variáveis aceitos (o primeiro encontrado é usado):
   URL ........ SUPABASE_URL · NEXT_PUBLIC_SUPABASE_URL
   SECRETA .... SUPABASE_SERVICE_ROLE_KEY · SUPABASE_SECRET_KEY · SUPABASE_SERVICE_KEY
   PÚBLICA .... SUPABASE_ANON_KEY · SUPABASE_PUBLISHABLE_KEY · NEXT_PUBLIC_SUPABASE_ANON_KEY · NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   (a integração oficial Supabase ↔ Vercel cria esses nomes automaticamente) */
const { createClient } = require("@supabase/supabase-js");

const primeira = (...nomes) => {
  for (const n of nomes) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim().replace(/^["']|["']$/g, "");
  }
  return "";
};

/* Aceita a URL colada de vários jeitos e devolve só https://<projeto>.supabase.co */
function normalizarUrl(bruta) {
  let u = String(bruta || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const x = new URL(u);
    return `${x.protocol}//${x.host}`;   // remove /rest/v1, barras finais, etc.
  } catch (e) { return ""; }
}

function credenciais() {
  return {
    url: normalizarUrl(primeira("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")),
    secreta: primeira("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_KEY"),
    publica: primeira("SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

let cliente = null;
function db() {
  if (cliente) return cliente;
  const { url, secreta } = credenciais();
  const faltando = [!url && "SUPABASE_URL", !secreta && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (faltando.length) {
    const e = new Error(`Variável de ambiente ausente na Vercel: ${faltando.join(" e ")}. Cadastre em Settings › Environment Variables (marque Production) e faça Redeploy.`);
    e.configuracao = true;
    throw e;
  }
  if (/^sb_publishable_/i.test(secreta) || papelDaChave(secreta) === "anon") {
    const e = new Error("A chave em SUPABASE_SERVICE_ROLE_KEY é a chave PÚBLICA (anon/publishable). Use a chave secreta (service_role ou secret key).");
    e.configuracao = true;
    throw e;
  }
  cliente = createClient(url, secreta, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

/* Lê o "papel" de uma chave antiga (JWT eyJ...) sem validar a assinatura */
function papelDaChave(chave) {
  const partes = String(chave || "").split(".");
  if (partes.length !== 3) return "";
  try { return JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")).role || ""; } catch (e) { return ""; }
}

/* Buckets do Supabase Storage (criados pelo supabase/schema.sql) */
const BUCKET_CURRICULOS = "curriculos";   // privado
const BUCKET_MATERIAIS = "materiais";     // público (PDFs da Biblioteca Técnica)
const BUCKET_PUBLICO = "publico";         // público (imagens do HUB, capas e PDFs de políticas)
const BUCKET_EVIDENCIAS = "evidencias";   // privado (documentos e fotos das turmas UniLTS)

/* Busca todas as linhas de uma consulta, de 1.000 em 1.000 */
async function todas(montarConsulta, limiteTotal = 20000) {
  const tam = 1000; let ini = 0; const saida = [];
  while (ini < limiteTotal) {
    const { data, error } = await montarConsulta().range(ini, ini + tam - 1);
    if (error) throw error;
    saida.push(...(data || []));
    if (!data || data.length < tam) break;
    ini += tam;
  }
  return saida;
}

async function configGet(chave, padrao = "") {
  const { data } = await db().from("config").select("valor").eq("chave", chave).maybeSingle();
  return data && data.valor !== null && data.valor !== undefined ? data.valor : padrao;
}
async function configSet(chave, valor) {
  const { error } = await db().from("config").upsert({ chave, valor }, { onConflict: "chave" });
  if (error) throw error;
}

module.exports = { db, todas, configGet, configSet, credenciais, papelDaChave, normalizarUrl, BUCKET_CURRICULOS, BUCKET_MATERIAIS, BUCKET_PUBLICO, BUCKET_EVIDENCIAS };
