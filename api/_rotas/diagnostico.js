/* GET /api/site?modulo=diagnostico (antigo /api/diagnostico) · verifica a configuração do servidor (sem mostrar senhas)
   Abra /integra/diagnostico.html para ver o resultado em formato de checklist. */
const { credenciais, papelDaChave, db, BUCKET_CURRICULOS, BUCKET_MATERIAIS, BUCKET_PUBLICO } = require("../_lib/supabase");

const TABELAS = ["usuarios", "registros", "eventos", "agenda", "materiais", "conteudos_hub", "catalogo_treinamentos", "catalogo_solucoes", "i18n_textos", "ouv_protocolos", "ouv_mensagens", "lipp_conversas", "lipp_mensagens", "lipp_agendamentos", "politicas_documentos", "uni_cursos", "uni_turmas", "uni_alunos", "uni_matriculas", "uni_registros", "uni_contador", "uni_empresas", "uni_empresa_usuarios", "uni_parceiros", "uni_colaboradores", "uni_turma_arquivos", "uni_pedidos", "fin_lancamentos", "config", "emails_log", "acessos", "limites"];

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
  { const t = process.env.MP_ACCESS_TOKEN || "", amb = !t ? "simulação (sem cobrança)" : /^TEST-/i.test(t) ? "sandbox (teste)" : "produção";
    add("Variáveis da Vercel", "Mercado Pago", !!t && !!process.env.MP_PUBLIC_KEY, `Ambiente: ${amb}${process.env.MP_WEBHOOK_SECRET ? " · webhook assinado" : " · sem MP_WEBHOOK_SECRET"}`, "Cadastre MP_ACCESS_TOKEN, MP_PUBLIC_KEY e MP_WEBHOOK_SECRET (Mercado Pago › Suas integrações). Sem elas, o checkout funciona em simulação.");
    add("Variáveis da Vercel", "CRON_SECRET", (process.env.CRON_SECRET || "").length >= 16, process.env.CRON_SECRET ? "Configurada" : "Não encontrada", "Protege a tarefa diária (prazos de 30 dias e revogação de 12 meses)."); }
  add("Variáveis da Vercel", "LIPP · IA (Claude)", !!process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_API_KEY ? `Configurada · modelo ${process.env.LIPP_MODELO || "claude-haiku-5-5"}` : "Sem chave: o LIPP responde pela base de conhecimento do site", "Opcional. Cadastre ANTHROPIC_API_KEY (console.anthropic.com).");
  add("Variáveis da Vercel", "Google Agenda + Meet", !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN), process.env.GOOGLE_REFRESH_TOKEN ? `Agenda: ${process.env.GOOGLE_CALENDAR_ID || "primary"}` : "Não conectada: reuniões ficam a confirmar pela equipe", "Opcional. Veja o passo a passo no LEIA-ME (OAuth Playground).");
  add("Variáveis da Vercel", "Avaliações do Google", !!process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_PLACES_API_KEY ? `Configurada · Place ID ${process.env.GOOGLE_PLACE_ID || "ChIJD_H4-aMgJ1wR2Z25wRuFG8I (padrão)"} · cache de 24 h` : "Não configurada: o carrossel mostra os depoimentos fixos", "Opcional. Cadastre GOOGLE_PLACES_API_KEY (Places API New).");

  /* 2. Banco de dados */
  if (url && secreta) {
    try {
      const c = db();
      for (const t of TABELAS) {
        const { error, count } = await c.from(t).select("*", { count: "exact", head: true });
        add("Banco de dados (Supabase)", `Tabela ${t}`, !error, error ? (error.message || error.code) : `OK · ${count ?? 0} registro(s)`, error ? "Rode supabase/schema.sql no SQL Editor do Supabase." : "");
      }
      const { data: us, error: eUs } = await c.from("usuarios").select("usuario, perfil, ativo");
      if (!eUs) {
        const adm = (us || []).find((x) => x.usuario === "admin");
        add("Banco de dados (Supabase)", "Usuários do painel", true,
          !us.length ? "Nenhum usuário ainda: admin e marketing serão criados no primeiro login, com as senhas iniciais." :
          `${us.length} usuário(s): ${us.map((x) => `${x.usuario} (${x.perfil}${x.ativo ? "" : ", inativo"})`).join(", ")}${adm ? "" : " — atenção: não existe o usuário admin"}`);
      }
      const { error: eRpc } = await c.rpc("l3_eventos", { desde: new Date().toISOString() });
      add("Banco de dados (Supabase)", "Função l3_eventos (relatórios)", !eRpc, eRpc ? eRpc.message : "OK", eRpc ? "Rode supabase/schema.sql no SQL Editor." : "");
      const { data: buckets, error: eB } = await c.storage.listBuckets();
      for (const [b, pub] of [[BUCKET_CURRICULOS, false], [BUCKET_MATERIAIS, true], [BUCKET_PUBLICO, true], ["evidencias", false]]) {
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
