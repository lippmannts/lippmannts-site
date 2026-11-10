/* L³ INTEGRA · conexão com o Supabase (somente no servidor)
   A chave "service_role" fica APENAS nas variáveis de ambiente da Vercel.
   Nunca coloque essa chave em arquivos do site ou no GitHub. */
const { createClient } = require("@supabase/supabase-js");

let cliente = null;
function db() {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL, chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente da Vercel.");
  cliente = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return cliente;
}

/* Buckets do Supabase Storage (criados pelo supabase/schema.sql) */
const BUCKET_CURRICULOS = "curriculos";   // privado
const BUCKET_MATERIAIS = "materiais";     // público (PDFs da Biblioteca Técnica)

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

module.exports = { db, todas, configGet, configSet, BUCKET_CURRICULOS, BUCKET_MATERIAIS };
