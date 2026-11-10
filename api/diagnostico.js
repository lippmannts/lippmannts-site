/* GET /api/diagnostico · verifica a configuração do servidor (sem mostrar senhas)
   Abra /integra/diagnostico.html para ver o resultado em formato de checklist. */
const { credenciais, papelDaChave, db, BUCKET_CURRICULOS, BUCKET_MATERIAIS } = require("./_lib/supabase");

const TABELAS = ["usuarios", "registros", "eventos", "agenda", "materiais", "config", "emails_log", "acessos", "limites"];

module.exports = async (req, res) => {
  const itens = [];
  const add = (grupo, nome, ok, detalhe, ajuda = "") => itens.push({ grupo, nome, ok, detalhe, ajuda });
  const { url, secreta, publica } = credenciais();
  const bruta = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  /* 1. Variáveis de ambiente */
  add("Variáveis da Vercel", "SUPABASE_URL", !!url && /\.supabase\.co$/.test(new URL(url || "http://x").host),
    url ? `Usando ${url}${bruta.trim() !== url ? " (ajustado automaticamente a partir do valor colado)" : ""}` : "Não encontrada",
    "Formato: https://SEU-PROJETO.supabase.co (Supabase › Project Settings › Data API › Project URL)");
  const papel = papelDaChave(secreta);
  const tipoSecreta = !secreta ? "" : secreta.startsWith("sb_secret_") ? "secret key (novo formato)" : papel ? `chave legada com papel "${papel}"` : "formato desconhecido";
  add("Variáveis da Vercel", "SUPABASE_SERVICE_ROLE_KEY", !!secreta && (secreta.startsWith("sb_secret_") || papel === "service_role"),
    secreta ? `Encontrada: ${tipoSecreta}, ${secreta.length} caracteres` : "Não encontrada",
    "Supabase › Project Settings › API Keys › aba Legacy API Keys › service_role (Reveal) — ou uma Secret key (sb_secret_…)");
  const papelPub = papelDaChave(publica);
  add("Variáveis da Vercel", "SUPABASE_ANON_KEY", !!publica && (publica.startsWith("sb_publishable_") || papelPub === "anon"),
    publica ? `Encontrada: ${publica.startsWith("sb_publishable_") ? "publishable key" : papelPub ? `papel "${papelPub}"` : "formato desconhecido"}` : "Não encontrada",
    "Supabase › Project Settings › API Keys › anon public (ou Publishable key sb_publishable_…). Necessária para envio de currículos e PDFs.");
  const seg = process.env.SESSAO_SEGREDO || "";
  add("Variáveis da Vercel", "SESSAO_SEGREDO", seg.length >= 24, seg ? `${seg.length} caracteres` : "Não encontrada", "Qualquer texto aleatório com 32+ caracteres. Sem ele o login do painel não funciona.");
  add("Variáveis da Vercel", "SMTP (e-mails)", !!process.env.SMTP_HOST && !!process.env.SMTP_PASS,
    process.env.SMTP_HOST ? `Servidor ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || "465"} · usuário ${process.env.SMTP_USER || "—"}` : "SMTP_HOST não encontrado",
    "Sem SMTP o site grava os dados normalmente, mas não envia e-mails.");

  /* 2. Banco de dados */
  if (url && secreta) {
    try {
      const c = db();
      for (const t of TABELAS) {
        const { error, count } = await c.from(t).select("*", { count: "exact", head: true });
        add("Banco de dados (Supabase)", `Tabela ${t}`, !error, error ? (error.message || error.code) : `OK · ${count ?? 0} registro(s)`, error ? "Rode supabase/schema.sql no SQL Editor do Supabase." : "");
      }
      const { error: eRpc } = await c.rpc("l3_eventos", { desde: new Date().toISOString() });
      add("Banco de dados (Supabase)", "Função l3_eventos (relatórios)", !eRpc, eRpc ? eRpc.message : "OK", eRpc ? "Rode supabase/schema.sql no SQL Editor." : "");
      const { data: buckets, error: eB } = await c.storage.listBuckets();
      for (const [b, pub] of [[BUCKET_CURRICULOS, false], [BUCKET_MATERIAIS, true]]) {
        const achou = (buckets || []).find((x) => x.id === b || x.name === b);
        add("Armazenamento de arquivos", `Bucket ${b}`, !!achou && !!achou.public === pub,
          eB ? eB.message : !achou ? "Não encontrado" : `OK · ${achou.public ? "público" : "privado"}${!!achou.public !== pub ? ` (deveria ser ${pub ? "público" : "privado"})` : ""}`,
          "Rode supabase/schema.sql ou crie em Storage › New bucket.");
      }
    } catch (e) {
      add("Banco de dados (Supabase)", "Conexão", false, e.message || String(e), "Confira a URL e a chave secreta.");
    }
  }

  /* 3. E-mail */
  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = require("nodemailer");
      const s = (process.env.SMTP_SECURE || "ssl").toLowerCase();
      const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || (s === "tls" ? 587 : 465)), secure: s === "ssl", requireTLS: s === "tls", ignoreTLS: s === "nenhuma", auth: process.env.SMTP_PASS ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined, connectionTimeout: 8000 });
      await t.verify();
      add("E-mail", "Conexão SMTP", true, "Servidor de e-mail respondeu e aceitou o login.");
    } catch (e) {
      add("E-mail", "Conexão SMTP", false, String(e.message || e).slice(0, 200), "Confira servidor, porta, SMTP_SECURE (ssl para 465, tls para 587), usuário e senha.");
    }
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify({ ok: itens.every((i) => i.ok), ambiente: process.env.VERCEL_ENV || "local", node: process.version, itens }));
};
