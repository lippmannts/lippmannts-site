/* =====================================================================
   /api/painel?acao=... · API do L³ INTEGRA (acesso com usuário e senha)
   Acesso: superadministrador (perfil admin, tudo) ou usuários com abas liberadas
   uma a uma na matriz de acessos (Configurações › Usuários e acessos).
   ===================================================================== */
const crypto = require("crypto");
const { db, todas, configGet, configSet, credenciais, BUCKET_CURRICULOS, BUCKET_MATERIAIS, BUCKET_PUBLICO } = require("./_lib/supabase");
const U = require("./_lib/util");
const E = require("./_lib/email");
const S = require("./_lib/sessao");
const P = require("./_lib/permissoes");
const K = require("./_lib/conteudo");
const I18N_IDIOMAS = require("./_rotas/i18n").IDIOMAS;

const COOKIE = "l3_sessao";
const SENHAS_INICIAIS = { admin: "PassaporteLTSAdmin", marketing: "PassaporteLTSmkt" };
const CONTAS_AGENDA = (process.env.CONTAS_AGENDA || "atendimento@lippmannts.com,comercial@lippmannts.com").split(",").map((s) => s.trim()).filter(Boolean);
const STATUS_VALIDOS = ["novo", "em atendimento", "proposta enviada", "convertido", "arquivado", "respondido", "ativo", "cancelado", "em análise", "entrevista agendada", "aprovado", "banco de talentos", "reprovado"];

/* Na primeira vez, cria os usuários padrão (troque as senhas no painel) */
async function garantirUsuariosIniciais() {
  const { count, error } = await db().from("usuarios").select("id", { count: "exact", head: true });
  if (error) throw falhaBanco("ler a tabela usuarios", error);
  if (count) return;
  const { error: e2 } = await db().from("usuarios").insert([
    { usuario: "admin", nome: "Administrador", perfil: "admin", senha_hash: S.hashSenha(SENHAS_INICIAIS.admin) },
    { usuario: "marketing", nome: "Marketing", perfil: "personalizado", permissoes: P.PADRAO_MARKETING, senha_hash: S.hashSenha(SENHAS_INICIAIS.marketing) },
  ]);
  if (e2) throw falhaBanco("criar os usuários iniciais", e2);
}

/* Transforma erros do Supabase em mensagens que explicam o que fazer */
function falhaBanco(acao, error) {
  const m = String((error && (error.message || error.code)) || "erro desconhecido");
  let dica = "Abra /integra/diagnostico.html para ver o que falta.";
  if (/does not exist|schema cache|PGRST205|42P01/i.test(m + (error.code || ""))) dica = "A tabela não existe: rode o arquivo supabase/schema.sql no SQL Editor do Supabase.";
  else if (/permission denied|42501/i.test(m + (error.code || ""))) dica = "Sem permissão: rode novamente o supabase/schema.sql (ele libera o acesso do servidor às tabelas) e confira se SUPABASE_SERVICE_ROLE_KEY é a chave service_role.";
  else if (/invalid api key|jwt|401|unauthorized/i.test(m)) dica = "Chave inválida: confira SUPABASE_SERVICE_ROLE_KEY na Vercel (sem espaços) e faça Redeploy.";
  else if (/fetch failed|ENOTFOUND|getaddrinfo/i.test(m)) dica = "Endereço do Supabase incorreto: confira SUPABASE_URL na Vercel.";
  const e = new Error(`Não foi possível ${acao} no Supabase (${m}). ${dica}`);
  e.configuracao = true;
  return e;
}

async function usuarioAtual(req) {
  const s = S.verificar(S.lerCookie(req, COOKIE));
  if (!s) return null;
  const { data } = await db().from("usuarios").select("id, usuario, nome, email, perfil, permissoes").eq("id", s.uid).eq("ativo", true).maybeSingle();
  return data ? { ...data, permissoes: P.permissoesDe(data), _token: s.csrf } : null;
}

module.exports = async (req, res) => {
  const acao = U.limpar((req.query && req.query.acao) || new URL(req.url, "http://x").searchParams.get("acao"), 40);
  const q = (k) => (req.query && req.query[k]) || new URL(req.url, "http://x").searchParams.get(k) || "";
  const post = req.method === "POST";
  const b = post ? await U.corpo(req) : {};

  try {
    /* ---------- acesso público do painel ---------- */
    if (acao === "login") {
      if (!post) return U.erro(res, "Método não permitido.", 405);
      if (!(await U.limite(req, "login", 6, 900))) return U.erro(res, "Muitas tentativas. Aguarde 15 minutos.", 429);
      await garantirUsuariosIniciais();
      const usuario = U.limpar(b.usuario, 60).toLowerCase();
      const senha = String(b.senha || "");
      const { data: u, error: eU } = await db().from("usuarios").select("*").eq("usuario", usuario).eq("ativo", true).maybeSingle();
      if (eU) throw falhaBanco("consultar o usuário", eU);
      // aceita a senha mesmo se foi colada com espaço sobrando no início ou no fim
      const okLogin = !!u && (S.conferirSenha(senha, u.senha_hash) || (senha.trim() !== senha && S.conferirSenha(senha.trim(), u.senha_hash)));
      await db().from("acessos").insert({ usuario, ip_hash: U.ipHash(req), ok: okLogin });
      if (!okLogin) { await new Promise((r) => setTimeout(r, 400)); return U.erro(res, "Usuário ou senha incorretos.", 401); }
      const csrf = crypto.randomBytes(24).toString("hex");
      S.gravarCookie(res, COOKIE, S.assinar({ uid: u.id, csrf }, 8), 8 * 3600);
      await db().from("usuarios").update({ ultimo_acesso: new Date().toISOString() }).eq("id", u.id);
      return U.ok(res, { usuario: { usuario: u.usuario, nome: u.nome, perfil: u.perfil, permissoes: P.permissoesDe(u) }, token: csrf, senha_padrao: Object.values(SENHAS_INICIAIS).includes(senha) });
    }
    if (acao === "logout") { S.gravarCookie(res, COOKIE, "", 0); return U.ok(res); }
    if (acao === "sessao") {
      const u = await usuarioAtual(req);
      return u ? U.ok(res, { usuario: { usuario: u.usuario, nome: u.nome, perfil: u.perfil, permissoes: u.permissoes }, token: u._token }) : U.json(res, 200, { ok: false });
    }

    /* ---------- daqui em diante, somente com sessão ---------- */
    const u = await usuarioAtual(req);
    if (!u) return U.erro(res, "Sessão expirada. Entre novamente.", 401);
    if (post && (req.headers["x-l3-token"] || "") !== u._token) return U.erro(res, "Token de segurança inválido. Recarregue a página.", 403);
    const admin = u.perfil === "admin";
    const pode = (aba) => admin || u.permissoes.includes(aba);
    /* bloqueio na API: sem a aba marcada na matriz, a ação é recusada */
    const exigir = (...abas) => {
      if (abas.some(pode)) return true;
      U.json(res, 403, { ok: false, erro: "Unauthorized", mensagem: `Acesso negado (Unauthorized): seu usuário não tem permissão para «${abas.map((a) => P.ABAS[a]).join("» ou «")}».` });
      return false;
    };

    switch (acao) {
      /* ======================= DADOS DO PAINEL ======================= */
      case "dados": {
        const dias = Math.max(1, Math.min(730, parseInt(q("dias"), 10) || 30));
        const desde = new Date(); desde.setDate(desde.getDate() - dias + 1); desde.setHours(0, 0, 0, 0);
        let eventos = [];
        if (pode("visao") || pode("inteligencia") || pode("exportar")) {
          const { data: ev, error: e1 } = await db().rpc("l3_eventos", { desde: desde.toISOString() });
          if (e1) throw e1;
          eventos = ev || [];
        }
        const tiposPermitidos = [pode("leads") || pode("denuncias") ? "lead" : null, pode("leads") || pode("denuncias") ? "contato" : null, pode("newsletter") ? "newsletter" : null, pode("talentos") ? "candidato" : null].filter(Boolean);
        let regs = tiposPermitidos.length ? await todas(() => db().from("registros").select("id, tipo, criado, nome, email, telefone, empresa, cargo, cidade, uf, origem, assunto, mensagem, cargo_pretendido, linkedin, arquivo_nome, arquivo, pagina, visitante, geo_cidade, geo_uf, status, notas").in("tipo", tiposPermitidos).order("criado", { ascending: false })) : [];
        regs = regs.filter((r) => pode(P.abaDoRegistro(r)));
        regs = regs.map(({ arquivo, ...r }) => ({ ...r, tem_arquivo: arquivo ? 1 : 0, criado: hora(r.criado) }));
        const lim = new Date(); lim.setDate(lim.getDate() - 120);
        const { data: agenda } = pode("agenda") ? await db().from("agenda").select("*").gte("inicio", lim.toISOString()).order("inicio") : { data: [] };
        return U.ok(res, { eventos, registros: regs, agenda: (agenda || []).map((a) => ({ ...a, inicio: hora(a.inicio), fim: hora(a.fim) })), contas_agenda: CONTAS_AGENDA });
      }

      case "registro_atualizar": {
        const id = Number(b.id);
        const { data: r } = await db().from("registros").select("tipo, assunto").eq("id", id).maybeSingle();
        if (!r) return U.erro(res, "Registro não encontrado.", 404);
        if (!exigir(P.abaDoRegistro(r))) return;
        const status = STATUS_VALIDOS.includes(b.status) ? b.status : "novo";
        await db().from("registros").update({ status, notas: U.limpar(b.notas, 4000) }).eq("id", id);
        return U.ok(res);
      }
      case "registro_excluir": {
        const { data: r } = await db().from("registros").select("arquivo, tipo, assunto").eq("id", Number(b.id)).maybeSingle();
        if (!r) return U.erro(res, "Registro não encontrado.", 404);
        if (!exigir(P.abaDoRegistro(r))) return;
        if (r && r.arquivo) await db().storage.from(BUCKET_CURRICULOS).remove([r.arquivo]);
        await db().from("registros").delete().eq("id", Number(b.id));
        return U.ok(res);
      }
      case "curriculo": {
        if (!exigir("talentos")) return;
        const { data: r } = await db().from("registros").select("arquivo, arquivo_nome").eq("id", Number(q("id"))).eq("tipo", "candidato").maybeSingle();
        if (!r || !r.arquivo) return U.erro(res, "Currículo não encontrado.", 404);
        const { data, error } = await db().storage.from(BUCKET_CURRICULOS).createSignedUrl(r.arquivo, 120, /\.pdf$/i.test(r.arquivo) ? undefined : { download: r.arquivo_nome || true });
        if (error) throw error;
        res.statusCode = 302; res.setHeader("Location", data.signedUrl); res.setHeader("Cache-Control", "no-store"); return res.end();
      }

      /* ======================= AGENDA ======================= */
      case "agenda_salvar": {
        if (!exigir("agenda")) return;
        const titulo = U.limpar(b.titulo, 160);
        const ini = new Date(b.inicio), fim = new Date(b.fim);
        if (!titulo || isNaN(ini) || isNaN(fim) || fim <= ini) return U.erro(res, "Informe título, início e término válidos.");
        const participantes = String(b.participantes || "").split(/[\s,;]+/).filter(U.emailValido).join(", ");
        const dados = {
          titulo, tipo: U.limpar(b.tipo, 20) || "reuniao", inicio: horaBR(b.inicio), fim: horaBR(b.fim),
          link: U.limpar(b.link, 500), plataforma: U.limpar(b.plataforma, 30), participantes,
          organizador: U.limpar(b.organizador, 160), descricao: U.limpar(b.descricao, 4000),
          registro_id: Number(b.registro_id) || null, status: U.limpar(b.status, 20) || "agendado",
        };
        let id = Number(b.id) || 0;
        if (id) {
          const { data: atual } = await db().from("agenda").select("sequencia").eq("id", id).maybeSingle();
          await db().from("agenda").update({ ...dados, sequencia: ((atual && atual.sequencia) || 0) + 1 }).eq("id", id);
        } else {
          const { data: novo, error } = await db().from("agenda").insert({ ...dados, uid: crypto.randomBytes(12).toString("hex") + "@lippmannts.com", criado_por: u.usuario }).select("id").single();
          if (error) throw error;
          id = novo.id;
        }
        if (dados.registro_id && dados.tipo === "entrevista") await db().from("registros").update({ status: "entrevista agendada" }).eq("id", dados.registro_id);
        return U.ok(res, { id });
      }
      case "agenda_excluir": if (!exigir("agenda")) return; await db().from("agenda").delete().eq("id", Number(b.id)); return U.ok(res);
      case "agenda_convite": {
        if (!exigir("agenda")) return;
        const { data: a } = await db().from("agenda").select("*").eq("id", Number(b.id)).maybeSingle();
        if (!a) return U.erro(res, "Compromisso não encontrado.", 404);
        const part = String(a.participantes || "").split(/[\s,;]+/).filter(U.emailValido);
        if (!part.length) return U.erro(res, "Inclua ao menos um participante (e-mail).");
        const org = U.emailValido(a.organizador) ? a.organizador : E.remetente();
        const ics = gerarIcs(a, part, org);
        const fmt = (d) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const quando = `${fmt(a.inicio)} – ${new Date(a.fim).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}`;
        const html = `<p style="margin:0 0 14px;line-height:1.6">Você foi convidado(a) para: <b>${U.esc(a.titulo)}</b></p>${E.tabela({ Quando: quando + " (horário de Brasília)", Plataforma: a.plataforma, Link: a.link, Detalhes: a.descricao })}${a.link ? E.botao("Entrar na reunião", a.link) : ""}<p style="font-size:12px;color:#6C727C;margin-top:18px">O convite em anexo (.ics) adiciona o compromisso ao Outlook, Gmail ou Teams.</p>`;
        const enviado = await E.enviar(part, `Convite: ${a.titulo} · ${quando}`, E.layout("Convite de agenda", html), { ics, cc: [org], responderComo: org });
        if (enviado) await db().from("agenda").update({ convite_enviado: new Date().toISOString() }).eq("id", a.id);
        return U.json(res, 200, { ok: enviado, mensagem: enviado ? "Convite enviado." : "Não foi possível enviar o convite. Verifique o SMTP nas variáveis da Vercel." });
      }

      /* ======================= CONFIGURAÇÕES ======================= */
      case "config": {
        if (!exigir("notificacoes", "materiais")) return;
        return U.ok(res, {
          config: {
            emails_notificacao: await configGet("emails_notificacao", "atendimento@lippmannts.com, comercial@lippmannts.com, lippmannts@gmail.com"),
            boas_vindas_assunto: await configGet("boas_vindas_assunto", "Bem-vindo(a) à Newsletter LIPPMANN"),
            boas_vindas_texto: await configGet("boas_vindas_texto", "Obrigado por se cadastrar na Newsletter LIPPMANN.\n\nA partir de agora você receberá conteúdos técnicos sobre Saúde, Segurança e Meio Ambiente, novidades sobre Normas Regulamentadoras e lançamentos de treinamentos e materiais.\n\nSegurança não é prioridade. Segurança é valor."),
          },
          smtp: { configurado: E.smtpConfigurado(), host: process.env.SMTP_HOST || "", remetente: E.remetente() },
          github: process.env.GITHUB_REPO_URL || "",
        });
      }
      case "config_salvar": {
        if (!exigir("notificacoes")) return;
        for (const [k, max] of [["emails_notificacao", 1000], ["boas_vindas_assunto", 200], ["boas_vindas_texto", 4000]]) if (b[k] !== undefined) await configSet(k, U.limpar(b[k], max));
        return U.ok(res);
      }
      case "email_teste": {
        if (!exigir("notificacoes")) return;
        const para = U.emailValido(b.para) ? b.para : (await E.emailsEquipe())[0];
        const enviado = await E.enviar(para, "Teste de envio · L³ INTEGRA", E.layout("Teste de envio", "<p>Se você recebeu esta mensagem, os e-mails do site estão funcionando.</p>"));
        const { data: ult } = await db().from("emails_log").select("erro").order("id", { ascending: false }).limit(1).maybeSingle();
        return U.json(res, 200, { ok: enviado, mensagem: enviado ? `E-mail de teste enviado para ${para}.` : "Falha no envio: " + ((ult && ult.erro) || "verifique o SMTP.") });
      }
      case "emails_log": {
        if (!exigir("seguranca")) return;
        const { data: log } = await db().from("emails_log").select("*").order("id", { ascending: false }).limit(200);
        const { data: acessos } = await db().from("acessos").select("*").order("id", { ascending: false }).limit(100);
        return U.ok(res, { log: (log || []).map((l) => ({ ...l, t: hora(l.t), ok: l.ok ? 1 : 0 })), acessos: (acessos || []).map((a) => ({ ...a, t: hora(a.t), ok: a.ok ? 1 : 0 })) });
      }

      /* ======================= USUÁRIOS ======================= */
      case "usuarios": {
        if (!exigir("usuarios")) return;
        const { data } = await db().from("usuarios").select("id, usuario, nome, email, perfil, permissoes, ativo, criado, ultimo_acesso").order("id");
        return U.ok(res, { abas: P.ABAS, usuarios: (data || []).map((x) => ({ ...x, permissoes: P.permissoesDe(x), ativo: x.ativo ? 1 : 0, ultimo_acesso: hora(x.ultimo_acesso) })) });
      }
      case "usuario_salvar": {
        if (!exigir("usuarios")) return;
        const usuario = U.limpar(b.usuario, 60).toLowerCase();
        if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) return U.erro(res, "Usuário: use de 3 a 40 letras minúsculas, números, ponto ou hífen.");
        const perfil = b.perfil === "admin" ? "admin" : "personalizado";
        if (perfil === "admin" && !admin) return U.erro(res, "Somente um superadministrador pode criar ou editar outro superadministrador.", 403);
        const senha = String(b.senha || "");
        if ((!b.id || senha) && senha.length < 10) return U.erro(res, "A senha deve ter ao menos 10 caracteres.");
        const permissoes = perfil === "admin" ? [] : P.limparLista(b.permissoes);
        if (!admin && permissoes.some((x) => !u.permissoes.includes(x))) return U.erro(res, "Você só pode liberar abas às quais você também tem acesso.", 403);
        const dados = { usuario, nome: U.limpar(b.nome, 80), email: U.limpar(b.email, 120), perfil, permissoes, ativo: !!Number(b.ativo ?? 1) };
        if (senha) dados.senha_hash = S.hashSenha(senha);
        if (b.id) {
          const { data: alvo } = await db().from("usuarios").select("id, perfil").eq("id", Number(b.id)).maybeSingle();
          if (!alvo) return U.erro(res, "Usuário não encontrado.", 404);
          if (alvo.perfil === "admin" && !admin) return U.erro(res, "Somente um superadministrador pode alterar outro superadministrador.", 403);
          if (alvo.id === u.id && (!dados.ativo || (admin && perfil !== "admin"))) return U.erro(res, "Você não pode inativar nem rebaixar o seu próprio usuário.");
          if (alvo.perfil === "admin" && (!dados.ativo || perfil !== "admin") && !(await outroAdminAtivo(alvo.id))) return U.erro(res, "É necessário manter ao menos um superadministrador ativo.");
          const { error } = await db().from("usuarios").update(dados).eq("id", alvo.id);
          if (error) return U.erro(res, error.code === "23505" ? "Este nome de usuário já existe." : "Não foi possível salvar o usuário.");
        } else {
          const { error } = await db().from("usuarios").insert(dados);
          if (error) return U.erro(res, error.code === "23505" ? "Este nome de usuário já existe." : "Não foi possível criar o usuário.");
        }
        return U.ok(res);
      }
      case "usuario_excluir": {
        if (!exigir("usuarios")) return;
        const { data: alvo } = await db().from("usuarios").select("id, perfil").eq("id", Number(b.id)).maybeSingle();
        if (!alvo) return U.erro(res, "Usuário não encontrado.", 404);
        if (alvo.id === u.id) return U.erro(res, "Você não pode excluir o seu próprio usuário.");
        if (alvo.perfil === "admin" && !admin) return U.erro(res, "Somente um superadministrador pode excluir outro superadministrador.", 403);
        if (alvo.perfil === "admin" && !(await outroAdminAtivo(alvo.id))) return U.erro(res, "É necessário manter ao menos um superadministrador ativo.");
        await db().from("usuarios").delete().eq("id", alvo.id);
        return U.ok(res);
      }
      case "minha_senha": {
        const { data: x } = await db().from("usuarios").select("senha_hash").eq("id", u.id).single();
        if (!S.conferirSenha(String(b.atual || ""), x.senha_hash)) return U.erro(res, "A senha atual não confere.");
        if (String(b.nova || "").length < 10) return U.erro(res, "A nova senha deve ter ao menos 10 caracteres.");
        await db().from("usuarios").update({ senha_hash: S.hashSenha(b.nova) }).eq("id", u.id);
        return U.ok(res, { mensagem: "Senha alterada." });
      }

      /* ======================= MATERIAIS (aba Conteúdo) ======================= */
      case "materiais": {
        if (!exigir("materiais")) return;
        const { data } = await db().from("materiais").select("*").order("ordem").order("criado");
        return U.ok(res, { materiais: data || [] });
      }
      case "material_upload": {   // endereço temporário para enviar o PDF direto ao Storage
        if (!exigir("materiais")) return;
        const nome = U.limpar(b.nome, 200);
        if (!/\.pdf$/i.test(nome)) return U.erro(res, "Envie o material em PDF (no PowerPoint: Arquivo › Exportar › PDF).");
        if (Number(b.tamanho) > 50 * 1024 * 1024) return U.erro(res, "O PDF deve ter no máximo 50 MB.");
        const caminho = `${slug(b.id || nome.replace(/\.pdf$/i, ""))}-${Date.now().toString(36)}.pdf`;
        const { data, error } = await db().storage.from(BUCKET_MATERIAIS).createSignedUploadUrl(caminho);
        if (error) throw error;
        return U.ok(res, { caminho, url: data.signedUrl, apikey: credenciais().publica });
      }
      case "material_salvar": {
        if (!exigir("materiais")) return;
        const titulo = U.limpar(b.titulo, 160);
        if (!titulo) return U.erro(res, "Informe o título do material.");
        const id = slug(b.id || titulo);
        const dados = { id, titulo, area: b.area === "solucoes" ? "solucoes" : "treinamentos", tipo: U.limpar(b.tipo, 40), tema: U.limpar(b.tema, 60), resumo: U.limpar(b.resumo, 400), youtube: U.limpar(b.youtube, 200), ativo: true };
        if (b.paginas) dados.paginas = Number(b.paginas) || null;
        if (b.arquivo) dados.arquivo = U.limpar(b.arquivo, 300);
        const { error } = await db().from("materiais").upsert(dados, { onConflict: "id" });
        if (error) throw error;
        const { data } = await db().from("materiais").select("*").order("ordem").order("criado");
        return U.ok(res, { materiais: data || [] });
      }
      case "material_excluir": {
        if (!exigir("materiais")) return;
        const { data: m } = await db().from("materiais").select("arquivo").eq("id", U.limpar(b.id, 80)).maybeSingle();
        if (m && m.arquivo && !/^https?:|^\/?materiais\//.test(m.arquivo)) await db().storage.from(BUCKET_MATERIAIS).remove([m.arquivo]);
        await db().from("materiais").delete().eq("id", U.limpar(b.id, 80));
        const { data } = await db().from("materiais").select("*").order("ordem").order("criado");
        return U.ok(res, { materiais: data || [] });
      }


      /* ======================= ARQUIVOS PÚBLICOS (imagens do HUB, PDFs de políticas) ======================= */
      case "arquivo_upload": {
        if (!exigir("hub", "catalogo", "politicas", "unilts")) return;
        const nome = U.limpar(b.nome, 200);
        const ext = (nome.split(".").pop() || "").toLowerCase();
        if (!["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)) return U.erro(res, "Envie imagens (JPG, PNG, WEBP) ou PDF.");
        if (Number(b.tamanho) > 25 * 1024 * 1024) return U.erro(res, "O arquivo deve ter no máximo 25 MB.");
        const pasta = ["hub", "catalogo", "politicas", "unilts"].includes(b.pasta) ? b.pasta : "hub";
        const caminho = `${pasta}/${K.slug(nome.replace(/\.[a-z0-9]+$/i, ""), 50)}-${Date.now().toString(36)}.${ext === "jpeg" ? "jpg" : ext}`;
        const { data, error } = await db().storage.from(BUCKET_PUBLICO).createSignedUploadUrl(caminho);
        if (error) throw error;
        const url = db().storage.from(BUCKET_PUBLICO).getPublicUrl(caminho).data.publicUrl;
        return U.ok(res, { caminho, url: data.signedUrl, publico: url, apikey: credenciais().publica });
      }

      /* ======================= HUB (artigos e notícias) ======================= */
      case "hub_listar": {
        if (!exigir("hub")) return;
        const { data, error } = await db().from("conteudos_hub").select("*").order("criado", { ascending: false });
        if (error) throw error;
        return U.ok(res, { itens: (data || []).map((x) => ({ ...x, criado: hora(x.criado), publicado_em: hora(x.publicado_em) })) });
      }
      case "hub_salvar": {
        if (!exigir("hub")) return;
        const titulo = U.limpar(b.titulo, 200);
        if (!titulo) return U.erro(res, "Informe o título da publicação.");
        const dados = {
          titulo, tipo: ["artigo", "noticia", "transparencia"].includes(b.tipo) ? b.tipo : "noticia",
          resumo: U.limpar(b.resumo, 400), corpo_html: K.limparHtml(b.corpo_html), capa: U.limpar(b.capa, 400),
          youtube: K.idYoutube(b.youtube), tags: K.linhas(String(b.tags || "").replace(/,/g, "\n")).slice(0, 12),
          autor: U.limpar(b.autor, 100) || u.nome || u.usuario, publicado: !!b.publicado, atualizado: new Date().toISOString(),
        };
        let id = Number(b.id) || 0;
        if (id) {
          const { data: atual } = await db().from("conteudos_hub").select("publicado, publicado_em").eq("id", id).maybeSingle();
          if (dados.publicado && !(atual && atual.publicado_em)) dados.publicado_em = new Date().toISOString();
          const { error } = await db().from("conteudos_hub").update(dados).eq("id", id); if (error) throw error;
        } else {
          let base = K.slug(titulo, 70), sl = base, n = 2;
          while (true) { const { data: ex } = await db().from("conteudos_hub").select("id").eq("slug", sl).maybeSingle(); if (!ex) break; sl = `${base}-${n++}`; }
          dados.slug = sl; if (dados.publicado) dados.publicado_em = new Date().toISOString();
          const { data: nv, error } = await db().from("conteudos_hub").insert(dados).select("id, slug").single(); if (error) throw error;
          id = nv.id;
        }
        return U.ok(res, { id });
      }
      case "hub_excluir": {
        if (!exigir("hub")) return;
        await db().from("conteudos_hub").delete().eq("id", Number(b.id));
        return U.ok(res);
      }

      /* ======================= CATÁLOGO DE TREINAMENTOS ======================= */
      case "catalogo_listar": {
        if (!exigir("catalogo")) return;
        const { data, error } = await db().from("catalogo_treinamentos").select("*").order("ordem").order("titulo");
        if (error) throw error;
        return U.ok(res, { treinamentos: data || [] });
      }
      case "catalogo_salvar": {
        if (!exigir("catalogo")) return;
        const titulo = U.limpar(b.titulo, 200);
        if (!titulo) return U.erro(res, "Informe o título do treinamento.");
        const id = b.id ? K.slug(b.id, 70) : K.slug(titulo, 70);
        const dados = {
          id, titulo, nr: U.limpar(b.nr, 20) || null, norma: U.limpar(b.norma, 200) || null,
          categoria: ["normativo", "desenvolvimento", "emergencia"].includes(b.categoria) ? b.categoria : "normativo",
          resumo: U.limpar(b.resumo, 500), carga_horaria: U.limpar(b.carga_horaria, 60), modalidade: U.limpar(b.modalidade, 120),
          tags: K.linhas(String(b.tags || "").replace(/,/g, "\n")).slice(0, 10), imagem: U.limpar(b.imagem, 400), youtube: K.idYoutube(b.youtube),
          aprender: K.linhas(b.aprender), publico: K.linhas(b.publico), beneficios: K.linhas(b.beneficios),
          prerequisito: U.limpar(b.prerequisito, 1000), porque: U.limpar(b.porque, 3000), atestado: U.limpar(b.atestado, 1000) || null,
          ficha_pdf: U.limpar(b.ficha_pdf, 400) || null, ordem: Number(b.ordem) || 100, ativo: b.ativo === undefined ? true : !!Number(b.ativo), atualizado: new Date().toISOString(),
        };
        const { error } = await db().from("catalogo_treinamentos").upsert(dados, { onConflict: "id" });
        if (error) throw error;
        return U.ok(res, { id });
      }
      case "catalogo_excluir": {
        if (!exigir("catalogo")) return;
        await db().from("catalogo_treinamentos").delete().eq("id", U.limpar(b.id, 80));
        return U.ok(res);
      }

      /* ======================= SOLUÇÕES ======================= */
      case "solucoes_listar": {
        if (!exigir("solucoes")) return;
        const { data, error } = await db().from("catalogo_solucoes").select("*").order("ordem").order("titulo");
        if (error) throw error;
        let grupos = null; try { grupos = JSON.parse(await configGet("solucoes_grupos", "null")); } catch (e) {}
        return U.ok(res, { solucoes: data || [], grupos });
      }
      case "solucoes_salvar": {
        if (!exigir("solucoes")) return;
        const titulo = U.limpar(b.titulo, 200);
        if (!titulo) return U.erro(res, "Informe o título da solução.");
        if (!U.limpar(b.texto, 2000)) return U.erro(res, "Escreva a descrição da solução.");
        const id = b.id ? K.slug(b.id, 70) : K.slug(titulo, 70);
        const dados = { id, titulo, grupo: K.slug(b.grupo || "analises", 40) || "analises", texto: U.limpar(b.texto, 2000), ordem: Number(b.ordem) || 100, ativo: b.ativo === undefined ? true : !!Number(b.ativo), atualizado: new Date().toISOString() };
        const { error } = await db().from("catalogo_solucoes").upsert(dados, { onConflict: "id" });
        if (error) throw error;
        return U.ok(res, { id });
      }
      case "solucoes_excluir": {
        if (!exigir("solucoes")) return;
        await db().from("catalogo_solucoes").delete().eq("id", U.limpar(b.id, 80));
        return U.ok(res);
      }
      case "solucoes_grupos": {
        if (!exigir("solucoes")) return;
        const g = {}; (Array.isArray(b.grupos) ? b.grupos : []).slice(0, 12).forEach((x) => { const k = K.slug(x.id || x.nome, 40), n = U.limpar(x.nome, 80); if (k && n) g[k] = n; });
        if (!Object.keys(g).length) return U.erro(res, "Mantenha pelo menos um grupo.");
        await configSet("solucoes_grupos", JSON.stringify(g));
        return U.ok(res, { grupos: g });
      }

      /* ======================= OUVIDORIA (protocolos) ======================= */
      case "ouv_listar": {
        if (!exigir("denuncias")) return;
        const { data, error } = await db().from("ouv_protocolos").select("id, protocolo, tipo, nome, email, telefone, anonimo, mensagem, status, criado, atualizado").order("criado", { ascending: false }).limit(2000);
        if (error) throw error;
        return U.ok(res, { protocolos: (data || []).map((p) => ({ ...p, criado: hora(p.criado), atualizado: hora(p.atualizado) })) });
      }
      case "ouv_detalhe": {
        if (!exigir("denuncias")) return;
        const { data: p } = await db().from("ouv_protocolos").select("id, protocolo, tipo, nome, email, telefone, anonimo, mensagem, status, criado, atualizado, registro_id").eq("id", Number(q("id") || b.id)).maybeSingle();
        if (!p) return U.erro(res, "Protocolo não encontrado.", 404);
        const O = require("./_lib/ouvidoria");
        return U.ok(res, { protocolo: { ...p, criado: hora(p.criado), atualizado: hora(p.atualizado) }, historico: (await O.linhaDoTempo(p.id, false)).map((m) => ({ ...m, criado: hora(m.criado) })) });
      }
      case "ouv_responder": {
        if (!exigir("denuncias")) return;
        const O = require("./_lib/ouvidoria");
        const { data: p } = await db().from("ouv_protocolos").select("*").eq("id", Number(b.id)).maybeSingle();
        if (!p) return U.erro(res, "Protocolo não encontrado.", 404);
        const status = O.STATUS[b.status] ? b.status : p.status, texto = U.limpar(b.texto, 4000), publico = b.publico === undefined ? true : !!Number(b.publico);
        if (!texto && status === p.status) return U.erro(res, "Escreva a resposta ou altere a situação.");
        await db().from("ouv_mensagens").insert({ protocolo_id: p.id, autor: "lippmann", texto: texto || `Situação alterada para: ${O.STATUS[status]}.`, publico, status_novo: status !== p.status ? status : null, por: u.usuario });
        await db().from("ouv_protocolos").update({ status, atualizado: new Date().toISOString() }).eq("id", p.id);
        if (publico) await O.avisarAtualizacao(p, texto, status);
        return U.ok(res, { mensagem: publico ? (p.email ? "Resposta registrada e enviada por e-mail ao solicitante." : "Resposta registrada. O solicitante é anônimo: ele verá a resposta ao consultar o protocolo.") : "Anotação interna registrada (não aparece para o solicitante)." });
      }

      /* ======================= LIPP · assistente virtual (conversas, dúvidas, leads e reuniões) ======================= */
      case "lipp_resumo": {
        if (!exigir("lipp")) return;
        const quandoBR = (v) => new Date(v).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const dias = Math.max(1, Math.min(730, parseInt(q("dias"), 10) || 30));
        const desde = new Date(Date.now() - dias * 86400000).toISOString();
        const [cv, ag] = await Promise.all([
          db().from("lipp_conversas").select("id, pagina, idioma, geo_cidade, geo_uf, temas, mensagens, modo, status, lead, agendou, lead_nome, lead_email, lead_telefone, lead_empresa, lead_cargo, necessidade, criado, atualizado").gte("criado", desde).order("criado", { ascending: false }).limit(3000),
          db().from("lipp_agendamentos").select("*").order("inicio", { ascending: false }).limit(500),
        ]);
        if (cv.error) throw cv.error;
        const conversas = cv.data || [];
        const ids = conversas.map((c) => c.id).slice(0, 800);
        let primeiras = [];
        if (ids.length) {
          const { data: ms } = await db().from("lipp_mensagens").select("conversa_id, texto, criado").eq("papel", "usuario").in("conversa_id", ids).order("criado").limit(5000);
          const vistas = new Set(); (ms || []).forEach((m) => { if (!vistas.has(m.conversa_id)) { vistas.add(m.conversa_id); primeiras.push(m.texto); } });
        }
        const M = require("../assets/js/lipp-motor");
        const temas = {}; conversas.forEach((c) => (c.temas || []).forEach((x) => { temas[x] = (temas[x] || 0) + 1; }));
        const perguntas = {}; primeiras.forEach((p) => { const k = M.semAcento(p).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90); if (k) perguntas[k] = perguntas[k] || { texto: p.slice(0, 160), n: 0 }; if (k) perguntas[k].n++; });
        return U.ok(res, {
          ia: !!process.env.ANTHROPIC_API_KEY, google: require("./_lib/agenda").configurada(), dias,
          conversas: conversas.map((c) => ({ ...c, criado: hora(c.criado), atualizado: hora(c.atualizado) })),
          agendamentos: (ag.data || []).map((a) => ({ ...a, quando: quandoBR(a.inicio), criado: hora(a.criado) })),
          temas: Object.entries(temas).sort((a, z) => z[1] - a[1]).slice(0, 15),
          perguntas: Object.values(perguntas).sort((a, z) => z.n - a.n).slice(0, 15),
        });
      }
      case "lipp_conversa": {
        if (!exigir("lipp")) return;
        const id = String(q("id") || b.id || "");
        const { data: c } = await db().from("lipp_conversas").select("*").eq("id", id).maybeSingle();
        if (!c) return U.erro(res, "Conversa não encontrada.", 404);
        const { data: ms } = await db().from("lipp_mensagens").select("papel, texto, modo, criado").eq("conversa_id", id).order("criado").limit(400);
        return U.ok(res, { conversa: { ...c, criado: hora(c.criado) }, mensagens: (ms || []).map((m) => ({ ...m, criado: hora(m.criado) })) });
      }
      case "lipp_agendamento_salvar": {
        if (!exigir("lipp")) return;
        const st = ["solicitado", "agendado", "realizado", "cancelado"].includes(b.status) ? b.status : null;
        const dados = { ...(st ? { status: st } : {}), ...(b.meet_url !== undefined ? { meet_url: U.limpar(b.meet_url, 300) || null } : {}), ...(b.observacao !== undefined ? { observacao: U.limpar(b.observacao, 1000) || null } : {}) };
        if (dados.meet_url && !/^https:\/\//.test(dados.meet_url)) return U.erro(res, "O link da reunião deve começar com https://");
        const { data: a, error } = await db().from("lipp_agendamentos").update(dados).eq("id", Number(b.id)).select("*").single();
        if (error) throw error;
        if (b.avisar && a.email && (dados.meet_url || st === "agendado" || st === "cancelado")) {
          const quando = new Date(a.inicio).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
          await E.enviar(a.email, st === "cancelado" ? `Reunião cancelada · LIPPMANN` : `Reunião confirmada · LIPPMANN · ${quando}`, E.layout(st === "cancelado" ? "Reunião cancelada" : "Reunião confirmada", `<p style="margin:0 0 14px">Olá, ${U.esc(String(a.nome).split(" ")[0])}! ${st === "cancelado" ? "A reunião abaixo foi cancelada. Se quiser, agende outro horário pelo assistente LIPP no site ou responda este e-mail." : "Sua reunião com um consultor da LIPPMANN está confirmada."}</p>${E.tabela({ "Quando": quando + " (horário de Brasília)", "Duração": "30 minutos", "Google Meet": a.meet_url || "—" })}${a.meet_url && st !== "cancelado" ? E.botao("Entrar no Google Meet", a.meet_url) : ""}`), { replyTo: "comercial@lippmannts.com" }).catch(() => {});
        }
        return U.ok(res, { mensagem: b.avisar ? "Agendamento atualizado e e-mail enviado ao visitante." : "Agendamento atualizado." });
      }

      /* ======================= TRADUÇÕES (multi-idiomas) ======================= */
      case "i18n_listar": {
        if (!exigir("traducoes")) return;
        const l = String(q("l") || "");
        if (!I18N_IDIOMAS.includes(l)) return U.erro(res, "Idioma inválido.");
        const linhas = [];
        for (let de = 0; ; de += 1000) {
          const { data, error } = await db().from("i18n_textos").select("pt, traducao, atualizado, atualizado_por").eq("idioma", l).range(de, de + 999);
          if (error) throw error;
          linhas.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        return U.ok(res, { textos: linhas.map((x) => ({ ...x, atualizado: hora(x.atualizado) })) });
      }
      case "i18n_salvar": {
        if (!exigir("traducoes")) return;
        const l = String(b.idioma || ""), pt = String(b.pt || "").replace(/\s+/g, " ").trim().slice(0, 4000), tr = String(b.traducao || "").replace(/\s+/g, " ").trim().slice(0, 4000);
        if (!I18N_IDIOMAS.includes(l)) return U.erro(res, "Idioma inválido.");
        if (!pt) return U.erro(res, "Texto original vazio.");
        const id = require("crypto").createHash("sha1").update(pt).digest("hex");
        if (!tr) { await db().from("i18n_textos").delete().eq("id", id).eq("idioma", l); return U.ok(res, { removido: true }); }
        const { error } = await db().from("i18n_textos").upsert({ id, idioma: l, pt, traducao: tr, atualizado: new Date().toISOString(), atualizado_por: u.usuario }, { onConflict: "id,idioma" });
        if (error) throw error;
        return U.ok(res);
      }
      case "i18n_fontes": {   // textos do site editados no painel, para listar o que ainda não tem tradução
        if (!exigir("traducoes")) return;
        const [cat, sol, hub, pol, cur] = await Promise.all([
          db().from("catalogo_treinamentos").select("titulo, resumo, norma, carga_horaria, modalidade, aprender, publico, beneficios, prerequisito, porque, atestado, ativo"),
          db().from("catalogo_solucoes").select("titulo, texto, ativo"),
          db().from("conteudos_hub").select("titulo, resumo, tags, publicado"),
          db().from("politicas_documentos").select("titulo, resumo, ativo"),
          db().from("uni_cursos").select("titulo, resumo, ativo"),
        ]);
        let grupos = null; try { grupos = JSON.parse(await configGet("solucoes_grupos", "null")); } catch (e) {}
        return U.ok(res, { catalogo: cat.data || [], solucoes: sol.data || [], grupos, hub: hub.data || [], politicas: pol.data || [], cursos: cur.data || [] });
      }

      /* ======================= POLÍTICAS E TERMO ======================= */
      case "politicas_listar": {
        if (!exigir("politicas")) return;
        const { data, error } = await db().from("politicas_documentos").select("*").order("ordem");
        if (error) throw error;
        return U.ok(res, { politicas: data || [] });
      }
      case "politicas_salvar": {
        if (!exigir("politicas")) return;
        const titulo = U.limpar(b.titulo, 200);
        if (!titulo) return U.erro(res, "Informe o título do documento.");
        const id = b.id ? K.slug(b.id, 70) : K.slug(titulo, 70);
        const dados = { id, titulo, codigo: U.limpar(b.codigo, 40), revisao: U.limpar(b.revisao, 20), resumo: U.limpar(b.resumo, 500),
          protegido: !!b.protegido, corpo_html: b.protegido ? K.limparHtml(b.corpo_html) : null, ordem: Number(b.ordem) || 100,
          ativo: b.ativo === undefined ? true : !!Number(b.ativo), atualizado: new Date().toISOString() };
        if (b.arquivo !== undefined) dados.arquivo = U.limpar(b.arquivo, 400);
        if (b.capa) dados.capa = U.limpar(b.capa, 400);
        if (b.paginas) dados.paginas = Number(b.paginas) || null;
        const { error } = await db().from("politicas_documentos").upsert(dados, { onConflict: "id" });
        if (error) throw error;
        return U.ok(res, { id });
      }
      case "politicas_excluir": {
        if (!exigir("politicas")) return;
        await db().from("politicas_documentos").delete().eq("id", U.limpar(b.id, 80));
        return U.ok(res);
      }

      /* ======================= UniLTS ======================= */
      case "uni_resumo": {
        if (!exigir("unilts")) return;
        const [cur, tur, mat, alu, cont] = await Promise.all([
          db().from("uni_cursos").select("*").order("titulo"),
          db().from("uni_turmas").select("*").order("numero", { ascending: false }),
          todas(() => db().from("uni_matriculas").select("id, turma_id, status")),
          db().from("uni_alunos").select("id", { count: "exact", head: true }),
          db().from("uni_contador").select("proximo").eq("chave", "turma").maybeSingle(),
        ]);
        const { data: empresasL } = await db().from("uni_empresas").select("id, razao_social, nome_fantasia, cnpj, ativo").order("razao_social");
        const { data: parceirosL } = await db().from("uni_parceiros").select("id, nome, email, qualificacao, registro, ativo").order("nome");
        if (cur.error) throw cur.error;
        const porTurma = {};
        mat.forEach((m) => { const x = (porTurma[m.turma_id] = porTurma[m.turma_id] || { total: 0, aprovado: 0, reprovado: 0, em_andamento: 0 }); if (m.status !== "cancelado") { x.total++; x[m.status] = (x[m.status] || 0) + 1; } });
        const nomes = Object.fromEntries((cur.data || []).map((c) => [c.id, c.titulo]));
        return U.ok(res, {
          empresas: empresasL || [], parceiros: parceirosL || [], cursos: cur.data || [], alunos: alu.count || 0, proximo: cont.data ? cont.data.proximo : 33,
          turmas: (tur.data || []).map((t) => ({ ...t, curso: nomes[t.curso_id] || t.curso_id, contagem: porTurma[t.id] || { total: 0, aprovado: 0, reprovado: 0, em_andamento: 0 } })),
        });
      }
      case "uni_curso_salvar": {
        if (!exigir("unilts")) return;
        const titulo = U.limpar(b.titulo, 200);
        if (!titulo) return U.erro(res, "Informe o título do curso.");
        const modulos = (Array.isArray(b.modulos) ? b.modulos : []).slice(0, 40).map((m, i) => ({
          titulo: U.limpar(m.titulo, 200) || `Módulo ${i + 1}`,
          aulas: (Array.isArray(m.aulas) ? m.aulas : []).slice(0, 60).map((a, j) => ({ id: U.limpar(a.id, 40) || `m${i + 1}a${j + 1}-${crypto.randomBytes(2).toString("hex")}`, titulo: U.limpar(a.titulo, 200) || `Aula ${j + 1}`, duracao: U.limpar(a.duracao, 30), youtube: K.idYoutube(a.youtube), texto: K.limparHtml(a.texto) })),
        }));
        const avaliacao = (Array.isArray(b.avaliacao) ? b.avaliacao : []).slice(0, 80).map((x) => {
          const alt = (Array.isArray(x.alternativas) ? x.alternativas : []).map((v) => U.limpar(v, 400)).filter(Boolean).slice(0, 6);
          return { pergunta: U.limpar(x.pergunta, 600), alternativas: alt, correta: Math.min(Math.max(0, Number(x.correta) || 0), Math.max(0, alt.length - 1)) };
        }).filter((x) => x.pergunta && x.alternativas.length >= 2);
        const id = b.id ? K.slug(b.id, 70) : K.slug(titulo, 70);
        const nota = Math.min(10, Math.max(0, Number(String(b.nota_corte || "7").replace(",", ".")) || 7));
        const dados = {
          id, titulo, nr: U.limpar(b.nr, 30) || null, norma: U.limpar(b.norma, 200), modalidade: U.limpar(b.modalidade, 80) || "EaD (ensino a distância)",
          carga_horaria: Number(String(b.carga_horaria || "0").replace(",", ".")) || 0, resumo: U.limpar(b.resumo, 600), imagem: U.limpar(b.imagem, 400),
          nota_corte: nota, tentativas_max: Math.min(10, Math.max(1, Number(b.tentativas_max) || 3)), validade_meses: Math.max(0, Number(b.validade_meses) || 0),
          instrutor_nome: U.limpar(b.instrutor_nome, 120), instrutor_qualificacao: U.limpar(b.instrutor_qualificacao, 200), instrutor_assinatura: U.limpar(b.instrutor_assinatura, 400),
          rt_nome: U.limpar(b.rt_nome, 120), rt_qualificacao: U.limpar(b.rt_qualificacao, 200), rt_assinatura: U.limpar(b.rt_assinatura, 400),
          mapa_mental: U.limpar(b.mapa_mental, 400), plano_ensino: K.limparHtml(b.plano_ensino), conteudo_programatico: K.linhas(b.conteudo_programatico).slice(0, 60),
          modulos, avaliacao, ativo: b.ativo === undefined ? true : !!Number(b.ativo), atualizado: new Date().toISOString(),
          preco: Math.max(0, Math.round(Number(String(b.preco || "0").replace(/\./g, "").replace(",", ".")) * 100) / 100 || 0), venda_online: !!Number(b.venda_online),
        };
        const { error } = await db().from("uni_cursos").upsert(dados, { onConflict: "id" });
        if (error) throw error;
        return U.ok(res, { id });
      }
      case "uni_curso_excluir": {
        if (!exigir("unilts")) return;
        const id = U.limpar(b.id, 80);
        const { count } = await db().from("uni_turmas").select("id", { count: "exact", head: true }).eq("curso_id", id);
        if (count) return U.erro(res, "Este curso já tem turmas e não pode ser excluído. Desmarque “Curso ativo” para ocultá-lo.");
        await db().from("uni_cursos").delete().eq("id", id);
        return U.ok(res);
      }
      case "uni_turma_salvar": {
        if (!exigir("unilts")) return;
        const dt = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : null);
        if (b.id) {
          const upd = { inicio: dt(b.inicio), fim: dt(b.fim), local: U.limpar(b.local, 200), instrutor_nome: U.limpar(b.instrutor_nome, 120), observacoes: U.limpar(b.observacoes, 2000),
            empresa_id: Number(b.empresa_id) || null, parceiro_id: Number(b.parceiro_id) || null, prazo_dias: Math.min(365, Math.max(1, Number(b.prazo_dias) || 30)) };
          const { data: atualT } = await db().from("uni_turmas").select("status, encerrada_em").eq("id", Number(b.id)).maybeSingle();
          if (["aberta", "encerrada", "cancelada"].includes(b.status)) {
            upd.status = b.status;
            if (b.status === "encerrada" && !(atualT && atualT.encerrada_em)) upd.encerrada_em = new Date().toISOString();
            if (b.status === "aberta") { upd.encerrada_em = null; upd.concluida_parceiro = null; }
          }
          const { error } = await db().from("uni_turmas").update(upd).eq("id", Number(b.id)); if (error) throw error;
          return U.ok(res, { id: Number(b.id) });
        }
        const curso = U.limpar(b.curso_id, 80);
        const { data: c } = await db().from("uni_cursos").select("id").eq("id", curso).maybeSingle();
        if (!c) return U.erro(res, "Escolha o curso da turma.");
        const mod = ["ead", "presencial", "hibrido"].includes(b.modalidade) ? b.modalidade : "ead";
        const { data, error } = await db().rpc("uni_criar_turma2", { p_curso: curso, p_tipo: b.tipo === "b2b" || b.empresa_id ? "b2b" : "b2c", p_inicio: dt(b.inicio), p_fim: dt(b.fim), p_local: U.limpar(b.local, 200), p_instrutor: U.limpar(b.instrutor_nome, 120) || null, p_obs: U.limpar(b.observacoes, 2000) || null,
          p_modalidade: mod, p_empresa: Number(b.empresa_id) || null, p_parceiro: Number(b.parceiro_id) || null, p_prazo: Math.min(365, Math.max(1, Number(b.prazo_dias) || 30)) });
        if (error) throw falhaBanco("criar a turma (rode novamente o supabase/schema.sql)", error);
        const t = Array.isArray(data) ? data[0] : data;
        return U.ok(res, { id: t.id, codigo: t.codigo });
      }
      case "uni_ajustar_numero": {
        if (!exigir("unilts")) return;
        if (u.perfil !== "admin") return U.json(res, 403, { ok: false, erro: "Unauthorized", mensagem: "Somente o superadministrador pode ajustar a numeração das turmas." });
        const { error } = await db().rpc("uni_ajustar_proxima", { proximo_numero: Number(b.proximo) || 0 });
        if (error) return U.erro(res, (error.message || "").replace(/^.*?:\s*/, "") || "Número inválido.");
        return U.ok(res);
      }
      case "uni_turma": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const d = await N.dadosTurma(Number(q("id") || b.id), { logs: true, arquivos: true, certificados: true });
        if (!d) return U.erro(res, "Turma não encontrada.", 404);
        return U.ok(res, { ...d, responsavel: u.nome || u.usuario, superadmin: u.perfil === "admin" });
      }
      case "uni_matricular": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const { data: t } = await db().from("uni_turmas").select("*").eq("id", Number(b.turma_id)).maybeSingle();
        if (!t) return U.erro(res, "Turma não encontrada.");
        if (t.status !== "aberta") return U.erro(res, "A turma não está aberta para matrículas.");
        const nome = U.limpar(b.nome, 160), email = U.limpar(b.email, 160).toLowerCase(), cpf = N.soDigitos(b.cpf);
        if (nome.split(/\s+/).length < 2) return U.erro(res, "Informe o nome completo do aluno (é o nome que sai no certificado).");
        if (!U.emailValido(email)) return U.erro(res, "Informe um e-mail válido.");
        if (!N.cpfValido(cpf)) return U.erro(res, "CPF inválido.");
        const { data: c } = await db().from("uni_cursos").select("*").eq("id", t.curso_id).maybeSingle();
        let { data: a } = await db().from("uni_alunos").select("*").eq("email", email).maybeSingle();
        let senha = "";
        if (!a) {
          senha = N.gerarSenha();
          const ins = await db().from("uni_alunos").insert({ nome, email, cpf, telefone: U.limpar(b.telefone, 30), empresa: U.limpar(b.empresa, 160), senha_hash: S.hashSenha(senha), trocar_senha: true }).select("*").single();
          if (ins.error) throw ins.error; a = ins.data;
        } else {
          const upd = { nome, cpf, telefone: U.limpar(b.telefone, 30) || a.telefone, empresa: U.limpar(b.empresa, 160) || a.empresa, ativo: true };
          if (a.trocar_senha) { senha = N.gerarSenha(); upd.senha_hash = S.hashSenha(senha); }   // ainda não acessou: gera nova provisória
          await db().from("uni_alunos").update(upd).eq("id", a.id);
        }
        const { data: ja } = await db().from("uni_matriculas").select("id, status").eq("aluno_id", a.id).eq("turma_id", t.id).maybeSingle();
        if (ja && ja.status !== "cancelado") return U.erro(res, "Este aluno já está matriculado nesta turma.");
        if (ja) await db().from("uni_matriculas").update({ status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null }).eq("id", ja.id);
        else { const { error } = await db().from("uni_matriculas").insert({ aluno_id: a.id, turma_id: t.id, prazo_ate: t.modalidade !== "presencial" ? new Date(Date.now() + Number(t.prazo_dias || 30) * 86400000).toISOString() : null }); if (error) throw error; }
        const enviado = await N.emailAcesso({ ...a, nome, email }, senha, c, t);
        return U.ok(res, { mensagem: enviado ? `Aluno matriculado. O acesso${senha ? " com senha provisória" : ""} foi enviado para ${email}.` : `Aluno matriculado, mas o e-mail não foi enviado (confira o SMTP em Configurações › Notificações). Use “Reenviar acesso” depois de corrigir.` });
      }
      case "uni_reenviar_acesso": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const { data: a } = await db().from("uni_alunos").select("*").eq("id", Number(b.aluno_id)).maybeSingle();
        if (!a) return U.erro(res, "Aluno não encontrado.");
        const senha = N.gerarSenha();
        await db().from("uni_alunos").update({ senha_hash: S.hashSenha(senha), trocar_senha: true, ativo: true }).eq("id", a.id);
        const ok1 = await N.emailAcesso(a, senha, null, null);
        return U.ok(res, { mensagem: ok1 ? `Nova senha provisória enviada para ${a.email}.` : "Senha redefinida, mas o e-mail não foi enviado. Confira o SMTP." });
      }
      case "uni_nova_tentativa": {
        if (!exigir("unilts")) return;
        const { data: m } = await db().from("uni_matriculas").select("*").eq("id", Number(b.id)).maybeSingle();
        if (!m || m.status === "aprovado") return U.erro(res, "Matrícula não encontrada ou já aprovada.");
        const tent = (m.tentativas || []).map((x) => ({ ...x }));
        const alvo = tent.find((x) => !x.descartada); if (alvo) { alvo.descartada = true; alvo.liberado_por = u.usuario; }
        await db().from("uni_matriculas").update({ tentativas: tent, status: "em_andamento" }).eq("id", m.id);
        return U.ok(res, { mensagem: "Nova tentativa liberada para o aluno." });
      }
      case "uni_matricula_cancelar": {
        if (!exigir("unilts")) return;
        await db().from("uni_matriculas").update({ status: "cancelado" }).eq("id", Number(b.id));
        return U.ok(res);
      }
      case "uni_alunos": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const al = await todas(() => db().from("uni_alunos").select("id, nome, cpf, email, telefone, empresa, trocar_senha, ativo, criado, ultimo_acesso").order("nome"));
        const ms = await todas(() => db().from("uni_matriculas").select("aluno_id, status"));
        const cont = {}; ms.forEach((m) => { if (m.status !== "cancelado") cont[m.aluno_id] = (cont[m.aluno_id] || 0) + 1; });
        return U.ok(res, { alunos: al.map((a) => ({ ...a, cpf: N.formatarCpf(a.cpf), matriculas: cont[a.id] || 0, criado: hora(a.criado), ultimo_acesso: hora(a.ultimo_acesso) })) });
      }
      case "uni_reabilitar": {
        if (!exigir("unilts")) return;
        if (u.perfil !== "admin") return U.json(res, 403, { ok: false, erro: "Unauthorized", mensagem: "Somente o superadministrador pode reabilitar acessos." });
        const N = require("./_lib/uni");
        const { data: m } = await db().from("uni_matriculas").select("id, aluno_id, acesso_revogado").eq("id", Number(b.id)).maybeSingle();
        if (!m) return U.erro(res, "Matrícula não encontrada.");
        await db().from("uni_matriculas").update({ acesso_revogado: null, reabilitado_por: `${u.usuario} em ${new Date().toISOString()}` }).eq("id", m.id);
        await N.registrar(m.aluno_id, m.id, "acesso_reabilitado", `por ${u.usuario}`);
        return U.ok(res, { mensagem: "Acesso reabilitado." });
      }
      case "uni_empresas": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const { data: es } = await db().from("uni_empresas").select("*").order("razao_social");
        const us = await todas(() => db().from("uni_empresa_usuarios").select("id, empresa_id, nome, email, trocar_senha, ativo, ultimo_acesso"));
        const cols = await todas(() => db().from("uni_colaboradores").select("empresa_id"));
        return U.ok(res, { empresas: (es || []).map((e) => ({ ...e, cnpj: N.formatarCnpj(e.cnpj), usuarios: us.filter((x) => x.empresa_id === e.id).map((x) => ({ ...x, ultimo_acesso: hora(x.ultimo_acesso) })), colaboradores: cols.filter((x) => x.empresa_id === e.id).length })) });
      }
      case "uni_empresa_salvar": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const razao = U.limpar(b.razao_social, 200), cnpj = N.soDigitos(b.cnpj);
        if (!razao) return U.erro(res, "Informe a razão social.");
        if (!N.cnpjValido(cnpj)) return U.erro(res, "CNPJ inválido.");
        const dados = { razao_social: razao, nome_fantasia: U.limpar(b.nome_fantasia, 160) || null, cnpj, contato_nome: U.limpar(b.contato_nome, 120) || null, contato_email: U.limpar(b.contato_email, 160) || null, contato_telefone: U.limpar(b.contato_telefone, 40) || null, ativo: b.ativo === undefined ? true : !!Number(b.ativo) };
        let id = Number(b.id) || 0;
        if (id) { const { error } = await db().from("uni_empresas").update(dados).eq("id", id); if (error) throw error; }
        else {
          const { data: ja } = await db().from("uni_empresas").select("id").eq("cnpj", cnpj).maybeSingle();
          if (ja) return U.erro(res, "Já existe uma empresa com este CNPJ.");
          const ins = await db().from("uni_empresas").insert(dados).select("id").single(); if (ins.error) throw ins.error; id = ins.data.id;
        }
        let mensagem = "Empresa salva.";
        if (U.limpar(b.usuario_email, 160)) {
          const r = await criarUsuarioPortal("uni_empresa_usuarios", "empresa", { empresa_id: id, nome: U.limpar(b.usuario_nome, 120) || dados.contato_nome || razao, email: U.limpar(b.usuario_email, 160).toLowerCase() }, dados.nome_fantasia || razao);
          if (!r.ok) return U.erro(res, r.mensagem); mensagem += " " + r.mensagem;
        }
        return U.ok(res, { id, mensagem });
      }
      case "uni_parceiros": {
        if (!exigir("unilts")) return;
        const { data } = await db().from("uni_parceiros").select("id, nome, cpf, email, telefone, qualificacao, registro, trocar_senha, ativo, ultimo_acesso, aluno_id, trilha_aprovada_em, trilha_dispensada").order("nome");
        const N = require("./_lib/uni");
        const lista = [];
        for (const x of data || []) lista.push({ ...x, trilha: await N.trilhaDoParceiro(x), cpf: N.formatarCpf(x.cpf), ultimo_acesso: hora(x.ultimo_acesso) });
        return U.ok(res, { parceiros: lista });
      }
      case "uni_parceiro_salvar": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const nome = U.limpar(b.nome, 120), email = U.limpar(b.email, 160).toLowerCase(), cpf = N.soDigitos(b.cpf);
        if (nome.split(/\s+/).length < 2) return U.erro(res, "Informe o nome completo do instrutor.");
        if (cpf && !N.cpfValido(cpf)) return U.erro(res, "CPF inválido.");
        const dados = { nome, cpf: cpf || null, telefone: U.limpar(b.telefone, 40) || null, qualificacao: U.limpar(b.qualificacao, 200) || null, registro: U.limpar(b.registro, 80) || null, ativo: b.ativo === undefined ? true : !!Number(b.ativo) };
        if (b.trilha_dispensada !== undefined) { if (u.perfil !== "admin" && !!Number(b.trilha_dispensada)) return U.erro(res, "Somente o superadministrador pode dispensar a trilha obrigatória."); dados.trilha_dispensada = !!Number(b.trilha_dispensada); }
        if (b.id) { const { error } = await db().from("uni_parceiros").update(dados).eq("id", Number(b.id)); if (error) throw error; return U.ok(res, { mensagem: "Parceiro atualizado." }); }
        const r = await criarUsuarioPortal("uni_parceiros", "parceiro", { ...dados, email }, "");
        return r.ok ? U.ok(res, { mensagem: r.mensagem }) : U.erro(res, r.mensagem);
      }
      case "uni_portal_reenviar": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const tabela = b.tipo === "parceiro" ? "uni_parceiros" : "uni_empresa_usuarios";
        const { data: x } = await db().from(tabela).select("*").eq("id", Number(b.id)).maybeSingle();
        if (!x) return U.erro(res, "Usuário não encontrado.");
        const senha = N.gerarSenha();
        await db().from(tabela).update({ senha_hash: S.hashSenha(senha), trocar_senha: true, ativo: true }).eq("id", x.id);
        const ok1 = await N.emailPortal(b.tipo === "parceiro" ? "parceiro" : "empresa", x, senha, "");
        return U.ok(res, { mensagem: ok1 ? `Nova senha provisória enviada para ${x.email}.` : "Senha redefinida, mas o e-mail não foi enviado. Confira o SMTP." });
      }
      case "uni_certificado": {
        if (!exigir("unilts")) return;
        const N = require("./_lib/uni");
        const d = await N.dadosCertificado(q("c"), "completo");
        if (!d) return U.erro(res, "Certificado não encontrado.", 404);
        delete d.aluno_id;
        return U.ok(res, { certificado: d });
      }

      /* ======================= FINANCEIRO E BI ======================= */
      case "fin_dados": {
        if (!exigir("financeiro")) return;
        const MP = require("./_lib/mercadopago");
        const dt = (v, d) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? v : d);
        const fim = dt(q("fim") || b.fim, new Date().toISOString().slice(0, 10)), inicio = dt(q("inicio") || b.inicio, new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10));
        const ate = fim + "T23:59:59.999-03:00", de = inicio + "T00:00:00-03:00";
        const [peds, lanc, cursos, mats] = await Promise.all([
          todas(() => db().from("uni_pedidos").select("id, codigo, curso_id, nome, email, valor, metodo, parcelas, status, taxa, ambiente, pago_em, estornado_em, estorno_motivo, criado, mp_id, mp_detalhe").gte("criado", de).lte("criado", ate).order("criado", { ascending: false })),
          todas(() => db().from("fin_lancamentos").select("*").gte("data", inicio).lte("data", fim).order("data", { ascending: false })),
          db().from("uni_cursos").select("id, titulo, nr, carga_horaria, preco, venda_online"),
          todas(() => db().from("uni_matriculas").select("id, turma_id, concluido_em").eq("status", "aprovado").gte("concluido_em", de).lte("concluido_em", ate)),
        ]);
        const tids = [...new Set(mats.map((m) => m.turma_id))];
        const turmas = tids.length ? await todas(() => db().from("uni_turmas").select("id, curso_id, modalidade, tipo, empresa_id").in("id", tids)) : [];
        return U.ok(res, { inicio, fim, ambiente: MP.ambiente(), pedidos: peds, lancamentos: lanc, cursos: cursos.data || [], aprovacoes: mats.map((m) => { const t = turmas.find((x) => x.id === m.turma_id) || {}; return { data: m.concluido_em, curso_id: t.curso_id, modalidade: t.modalidade, tipo: t.tipo }; }) });
      }
      case "fin_estornar": {
        if (!exigir("financeiro")) return;
        const N = require("./_lib/uni");
        const { data: p } = await db().from("uni_pedidos").select("*").eq("id", Number(b.id)).maybeSingle();
        if (p && !N.dentroDaGarantia(p) && u.perfil !== "admin") return U.json(res, 403, { ok: false, erro: "Unauthorized", mensagem: "Fora dos 7 dias de garantia, somente o superadministrador pode estornar." });
        const r = await require("./pagamento").reembolsar(p, U.limpar(b.motivo, 300) || "estorno pela LIPPMANN", `painel:${u.usuario}`, true);
        return r.ok ? U.ok(res, r) : U.erro(res, r.mensagem);
      }
      case "fin_simular": {
        if (!exigir("financeiro")) return;
        const MP = require("./_lib/mercadopago");
        if (MP.ambiente() === "producao") return U.erro(res, "Simulação indisponível em produção.");
        const { data: p } = await db().from("uni_pedidos").select("*").eq("id", Number(b.id)).maybeSingle();
        if (!p || p.status !== "pendente") return U.erro(res, "Só pedidos pendentes podem ser simulados.");
        const ok1 = b.resultado !== "recusado";
        await require("./pagamento").aplicar(p, { id: p.mp_id || `SIM-${p.codigo}`, status: ok1 ? "approved" : "rejected", status_detail: ok1 ? "accredited (simulado no L³ INTEGRA)" : "rejected (simulado)", fee_details: ok1 ? [{ amount: Math.round(Number(p.valor) * (p.metodo === "pix" ? 0.0099 : 0.0499) * 100) / 100 }] : [] });
        return U.ok(res, { mensagem: ok1 ? "Pagamento simulado como aprovado: aluno matriculado e acesso enviado." : "Pagamento simulado como recusado." });
      }
      case "fin_lancamento_salvar": {
        if (!exigir("financeiro")) return;
        const valor = Math.round(Number(String(b.valor || "").replace(/\./g, "").replace(",", ".")) * 100) / 100;
        if (!(valor > 0)) return U.erro(res, "Informe um valor maior que zero.");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.data || ""))) return U.erro(res, "Informe a data.");
        const dados = { tipo: b.tipo === "receita" ? "receita" : "despesa", data: b.data, categoria: U.limpar(b.categoria, 80) || "Outros", descricao: U.limpar(b.descricao, 300) || null, valor, atualizado: new Date().toISOString() };
        if (b.id) { const { error } = await db().from("fin_lancamentos").update(dados).eq("id", Number(b.id)); if (error) throw error; }
        else { const { error } = await db().from("fin_lancamentos").insert({ ...dados, criado_por: u.usuario }); if (error) throw error; }
        return U.ok(res);
      }
      case "fin_lancamento_excluir": {
        if (!exigir("financeiro")) return;
        await db().from("fin_lancamentos").delete().eq("id", Number(b.id));
        return U.ok(res);
      }

      /* ======================= CÓPIA DE SEGURANÇA ======================= */
      case "backup": {
        if (!exigir("seguranca")) return;
        const tabelas = ["registros", "agenda", "materiais", "conteudos_hub", "catalogo_treinamentos", "catalogo_solucoes", "i18n_textos", "ouv_protocolos", "ouv_mensagens", "lipp_conversas", "lipp_mensagens", "lipp_agendamentos", "politicas_documentos", "uni_cursos", "uni_turmas", "uni_alunos", "uni_matriculas", "uni_empresas", "uni_parceiros", "uni_colaboradores", "uni_turma_arquivos", "uni_pedidos", "fin_lancamentos", "config", "usuarios", "emails_log", "acessos"];
        const saida = { gerado_em: new Date().toISOString(), observacao: "Currículos ficam no Supabase Storage (bucket curriculos)." };
        for (const t of tabelas) saida[t] = await todas(() => db().from(t).select(t === "usuarios" ? "id, usuario, nome, email, perfil, permissoes, ativo, criado, ultimo_acesso" : t === "uni_alunos" ? "id, nome, cpf, email, telefone, empresa, ativo, criado, ultimo_acesso" : "*").order(t === "config" ? "chave" : "id"));
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="L3-INTEGRA-backup-${new Date().toISOString().slice(0, 10)}.json"`);
        return res.end(JSON.stringify(saida, null, 1));
      }

      default: return U.erro(res, "Ação desconhecida.", 404);
    }
  } catch (e) {
    console.error("painel:", acao, e);
    if (e && e.configuracao) return U.json(res, 500, { ok: false, mensagem: e.message, diagnostico: true });
    const tabelaFaltando = e && (e.code === "42P01" || e.code === "PGRST205" || /relation .* does not exist|schema cache/i.test(e.message || ""));
    if (tabelaFaltando) return U.json(res, 500, { ok: false, mensagem: "As tabelas do L³ INTEGRA não foram encontradas no Supabase. Rode o arquivo supabase/schema.sql no SQL Editor.", diagnostico: true });
    return U.json(res, 500, { ok: false, mensagem: "Erro no servidor: " + (e && e.message ? e.message : "tente novamente."), diagnostico: true });
  }
};

/* ---------- auxiliares ---------- */
async function criarUsuarioPortal(tabela, tipo, dados, empresaNome) {
  const N = require("./_lib/uni");
  if (!U.emailValido(dados.email)) return { ok: false, mensagem: "E-mail de acesso inválido." };
  const { data: ja } = await db().from(tabela).select("id").eq("email", dados.email).maybeSingle();
  if (ja) return { ok: false, mensagem: "Este e-mail já tem acesso cadastrado." };
  const senha = N.gerarSenha();
  const { error } = await db().from(tabela).insert({ ...dados, senha_hash: S.hashSenha(senha), trocar_senha: true });
  if (error) throw error;
  const enviado = await N.emailPortal(tipo, dados, senha, empresaNome);
  return { ok: true, mensagem: enviado ? `Acesso enviado para ${dados.email}.` : `Acesso criado para ${dados.email}, mas o e-mail não foi enviado (confira o SMTP).`, senha };
}
async function outroAdminAtivo(excetoId) {
  const { data } = await db().from("usuarios").select("id").eq("perfil", "admin").eq("ativo", true);
  return (data || []).some((x) => x.id !== excetoId);
}
function slug(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "material";
}
// data do banco (UTC) -> "AAAA-MM-DD HH:MM:SS" no horário de Brasília (formato usado pelo painel)
function hora(v) {
  if (!v) return "";
  const d = new Date(v); if (isNaN(d)) return String(v);
  return d.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace("T", " ");
}
// "AAAA-MM-DDTHH:MM" digitado no painel (horário de Brasília) -> ISO com fuso
function horaBR(v) {
  const s = String(v || "").replace(" ", "T").slice(0, 16);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s) ? s + ":00-03:00" : new Date(v).toISOString();
}
function gerarIcs(a, part, org) {
  const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const e = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const desc = [a.descricao, a.link ? "Link da reunião: " + a.link : ""].filter(Boolean).join("\n\n");
  const linhas = ["BEGIN:VCALENDAR", "PRODID:-//LIPPMANN//L3 INTEGRA//PT", "VERSION:2.0", "CALSCALE:GREGORIAN", "METHOD:REQUEST", "BEGIN:VEVENT",
    `UID:${a.uid}`, `SEQUENCE:${a.sequencia || 0}`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(a.inicio)}`, `DTEND:${utc(a.fim)}`,
    `SUMMARY:${e(a.titulo)}`, `DESCRIPTION:${e(desc)}`, `LOCATION:${e(a.link || "Online")}`,
    `ORGANIZER;CN=LIPPMANN Treinamentos e Soluções:mailto:${org}`,
    ...part.map((p) => `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${p}`),
    "STATUS:CONFIRMED", "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Lembrete", "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
  const dobrar = (l) => { const out = []; let x = l; while (Buffer.byteLength(x) > 74) { let n = 74; while (Buffer.byteLength(x.slice(0, n)) > 74) n--; out.push(x.slice(0, n)); x = " " + x.slice(n); } out.push(x); return out.join("\r\n"); };
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
