/* =====================================================================
   /api/painel?acao=... · API do L³ INTEGRA (acesso com usuário e senha)
   Perfis: admin (acesso total) · marketing (relatórios, métricas e leads)
   ===================================================================== */
const crypto = require("crypto");
const { db, todas, configGet, configSet, credenciais, BUCKET_CURRICULOS, BUCKET_MATERIAIS } = require("./_lib/supabase");
const U = require("./_lib/util");
const E = require("./_lib/email");
const S = require("./_lib/sessao");

const COOKIE = "l3_sessao";
const SENHAS_INICIAIS = { admin: "PassaporteLTSAdmin", marketing: "PassaporteLTSmkt" };
const CONTAS_AGENDA = (process.env.CONTAS_AGENDA || "atendimento@lippmannts.com,comercial@lippmannts.com").split(",").map((s) => s.trim()).filter(Boolean);
const STATUS_VALIDOS = ["novo", "em atendimento", "proposta enviada", "convertido", "arquivado", "respondido", "ativo", "cancelado", "em análise", "entrevista agendada", "aprovado", "banco de talentos", "reprovado"];

/* Na primeira vez, cria os usuários padrão (troque as senhas no painel) */
async function garantirUsuariosIniciais() {
  const { count } = await db().from("usuarios").select("id", { count: "exact", head: true });
  if (count) return;
  await db().from("usuarios").insert([
    { usuario: "admin", nome: "Administrador", perfil: "admin", senha_hash: S.hashSenha(SENHAS_INICIAIS.admin) },
    { usuario: "marketing", nome: "Marketing", perfil: "marketing", senha_hash: S.hashSenha(SENHAS_INICIAIS.marketing) },
  ]);
}

async function usuarioAtual(req) {
  const s = S.verificar(S.lerCookie(req, COOKIE));
  if (!s) return null;
  const { data } = await db().from("usuarios").select("id, usuario, nome, email, perfil").eq("id", s.uid).eq("ativo", true).maybeSingle();
  return data ? { ...data, _token: s.csrf } : null;
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
      const { data: u } = await db().from("usuarios").select("*").eq("usuario", usuario).eq("ativo", true).maybeSingle();
      const okLogin = !!u && S.conferirSenha(senha, u.senha_hash);
      await db().from("acessos").insert({ usuario, ip_hash: U.ipHash(req), ok: okLogin });
      if (!okLogin) { await new Promise((r) => setTimeout(r, 400)); return U.erro(res, "Usuário ou senha incorretos.", 401); }
      const csrf = crypto.randomBytes(24).toString("hex");
      S.gravarCookie(res, COOKIE, S.assinar({ uid: u.id, csrf }, 8), 8 * 3600);
      await db().from("usuarios").update({ ultimo_acesso: new Date().toISOString() }).eq("id", u.id);
      return U.ok(res, { usuario: { usuario: u.usuario, nome: u.nome, perfil: u.perfil }, token: csrf, senha_padrao: Object.values(SENHAS_INICIAIS).includes(senha) });
    }
    if (acao === "logout") { S.gravarCookie(res, COOKIE, "", 0); return U.ok(res); }
    if (acao === "sessao") {
      const u = await usuarioAtual(req);
      return u ? U.ok(res, { usuario: { usuario: u.usuario, nome: u.nome, perfil: u.perfil }, token: u._token }) : U.json(res, 200, { ok: false });
    }

    /* ---------- daqui em diante, somente com sessão ---------- */
    const u = await usuarioAtual(req);
    if (!u) return U.erro(res, "Sessão expirada. Entre novamente.", 401);
    if (post && (req.headers["x-l3-token"] || "") !== u._token) return U.erro(res, "Token de segurança inválido. Recarregue a página.", 403);
    const admin = u.perfil === "admin";
    const exigirAdmin = () => { if (!admin) { U.erro(res, "Seu perfil não tem permissão para esta ação.", 403); return false; } return true; };

    switch (acao) {
      /* ======================= DADOS DO PAINEL ======================= */
      case "dados": {
        const dias = Math.max(1, Math.min(730, parseInt(q("dias"), 10) || 30));
        const desde = new Date(); desde.setDate(desde.getDate() - dias + 1); desde.setHours(0, 0, 0, 0);
        const { data: eventos, error: e1 } = await db().rpc("l3_eventos", { desde: desde.toISOString() });
        if (e1) throw e1;
        let regs = await todas(() => {
          let c = db().from("registros").select("id, tipo, criado, nome, email, telefone, empresa, cargo, cidade, uf, origem, assunto, mensagem, cargo_pretendido, linkedin, arquivo_nome, arquivo, pagina, visitante, geo_cidade, geo_uf, status, notas").order("criado", { ascending: false });
          if (!admin) c = c.in("tipo", ["lead", "newsletter", "contato"]);
          return c;
        });
        if (!admin) regs = regs.filter((r) => !(r.tipo === "contato" && ["DENÚNCIAS", "RECLAMAÇÕES"].includes(r.assunto)));
        regs = regs.map(({ arquivo, ...r }) => ({ ...r, tem_arquivo: arquivo ? 1 : 0, criado: hora(r.criado) }));
        const lim = new Date(); lim.setDate(lim.getDate() - 120);
        const { data: agenda } = await db().from("agenda").select("*").gte("inicio", lim.toISOString()).order("inicio");
        return U.ok(res, { eventos: eventos || [], registros: regs, agenda: (agenda || []).map((a) => ({ ...a, inicio: hora(a.inicio), fim: hora(a.fim) })), contas_agenda: CONTAS_AGENDA });
      }

      case "registro_atualizar": {
        const id = Number(b.id);
        const { data: r } = await db().from("registros").select("tipo").eq("id", id).maybeSingle();
        if (!r) return U.erro(res, "Registro não encontrado.", 404);
        if (r.tipo === "candidato" && !admin) return U.erro(res, "Sem permissão.", 403);
        const status = STATUS_VALIDOS.includes(b.status) ? b.status : "novo";
        await db().from("registros").update({ status, notas: U.limpar(b.notas, 4000) }).eq("id", id);
        return U.ok(res);
      }
      case "registro_excluir": {
        if (!exigirAdmin()) return;
        const { data: r } = await db().from("registros").select("arquivo").eq("id", Number(b.id)).maybeSingle();
        if (r && r.arquivo) await db().storage.from(BUCKET_CURRICULOS).remove([r.arquivo]);
        await db().from("registros").delete().eq("id", Number(b.id));
        return U.ok(res);
      }
      case "curriculo": {
        if (!exigirAdmin()) return;
        const { data: r } = await db().from("registros").select("arquivo, arquivo_nome").eq("id", Number(q("id"))).eq("tipo", "candidato").maybeSingle();
        if (!r || !r.arquivo) return U.erro(res, "Currículo não encontrado.", 404);
        const { data, error } = await db().storage.from(BUCKET_CURRICULOS).createSignedUrl(r.arquivo, 120, /\.pdf$/i.test(r.arquivo) ? undefined : { download: r.arquivo_nome || true });
        if (error) throw error;
        res.statusCode = 302; res.setHeader("Location", data.signedUrl); res.setHeader("Cache-Control", "no-store"); return res.end();
      }

      /* ======================= AGENDA ======================= */
      case "agenda_salvar": {
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
      case "agenda_excluir": await db().from("agenda").delete().eq("id", Number(b.id)); return U.ok(res);
      case "agenda_convite": {
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
        if (!exigirAdmin()) return;
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
        if (!exigirAdmin()) return;
        for (const [k, max] of [["emails_notificacao", 1000], ["boas_vindas_assunto", 200], ["boas_vindas_texto", 4000]]) if (b[k] !== undefined) await configSet(k, U.limpar(b[k], max));
        return U.ok(res);
      }
      case "email_teste": {
        if (!exigirAdmin()) return;
        const para = U.emailValido(b.para) ? b.para : (await E.emailsEquipe())[0];
        const enviado = await E.enviar(para, "Teste de envio · L³ INTEGRA", E.layout("Teste de envio", "<p>Se você recebeu esta mensagem, os e-mails do site estão funcionando.</p>"));
        const { data: ult } = await db().from("emails_log").select("erro").order("id", { ascending: false }).limit(1).maybeSingle();
        return U.json(res, 200, { ok: enviado, mensagem: enviado ? `E-mail de teste enviado para ${para}.` : "Falha no envio: " + ((ult && ult.erro) || "verifique o SMTP.") });
      }
      case "emails_log": {
        if (!exigirAdmin()) return;
        const { data: log } = await db().from("emails_log").select("*").order("id", { ascending: false }).limit(200);
        const { data: acessos } = await db().from("acessos").select("*").order("id", { ascending: false }).limit(100);
        return U.ok(res, { log: (log || []).map((l) => ({ ...l, t: hora(l.t), ok: l.ok ? 1 : 0 })), acessos: (acessos || []).map((a) => ({ ...a, t: hora(a.t), ok: a.ok ? 1 : 0 })) });
      }

      /* ======================= USUÁRIOS ======================= */
      case "usuarios": {
        if (!exigirAdmin()) return;
        const { data } = await db().from("usuarios").select("id, usuario, nome, email, perfil, ativo, criado, ultimo_acesso").order("id");
        return U.ok(res, { usuarios: (data || []).map((x) => ({ ...x, ativo: x.ativo ? 1 : 0, ultimo_acesso: hora(x.ultimo_acesso) })) });
      }
      case "usuario_salvar": {
        if (!exigirAdmin()) return;
        const usuario = U.limpar(b.usuario, 60).toLowerCase();
        if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) return U.erro(res, "Usuário: use de 3 a 40 letras minúsculas, números, ponto ou hífen.");
        const perfil = b.perfil === "admin" ? "admin" : "marketing";
        const senha = String(b.senha || "");
        if ((!b.id || senha) && senha.length < 10) return U.erro(res, "A senha deve ter ao menos 10 caracteres.");
        const dados = { usuario, nome: U.limpar(b.nome, 80), email: U.limpar(b.email, 120), perfil, ativo: !!Number(b.ativo ?? 1) };
        if (senha) dados.senha_hash = S.hashSenha(senha);
        if (b.id) {
          if (!dados.ativo || perfil !== "admin") {
            const { data: adms } = await db().from("usuarios").select("id").eq("perfil", "admin").eq("ativo", true);
            if ((adms || []).filter((x) => x.id !== Number(b.id)).length < 1) return U.erro(res, "É necessário manter ao menos um administrador ativo.");
          }
          const { error } = await db().from("usuarios").update(dados).eq("id", Number(b.id)); if (error) throw error;
        } else {
          const { error } = await db().from("usuarios").insert(dados);
          if (error) return U.erro(res, error.code === "23505" ? "Este usuário já existe." : "Não foi possível criar o usuário.");
        }
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
        if (!exigirAdmin()) return;
        const { data } = await db().from("materiais").select("*").order("ordem").order("criado");
        return U.ok(res, { materiais: data || [] });
      }
      case "material_upload": {   // endereço temporário para enviar o PDF direto ao Storage
        if (!exigirAdmin()) return;
        const nome = U.limpar(b.nome, 200);
        if (!/\.pdf$/i.test(nome)) return U.erro(res, "Envie o material em PDF (no PowerPoint: Arquivo › Exportar › PDF).");
        if (Number(b.tamanho) > 50 * 1024 * 1024) return U.erro(res, "O PDF deve ter no máximo 50 MB.");
        const caminho = `${slug(b.id || nome.replace(/\.pdf$/i, ""))}-${Date.now().toString(36)}.pdf`;
        const { data, error } = await db().storage.from(BUCKET_MATERIAIS).createSignedUploadUrl(caminho);
        if (error) throw error;
        return U.ok(res, { caminho, url: data.signedUrl, apikey: credenciais().publica });
      }
      case "material_salvar": {
        if (!exigirAdmin()) return;
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
        if (!exigirAdmin()) return;
        const { data: m } = await db().from("materiais").select("arquivo").eq("id", U.limpar(b.id, 80)).maybeSingle();
        if (m && m.arquivo && !/^https?:|^\/?materiais\//.test(m.arquivo)) await db().storage.from(BUCKET_MATERIAIS).remove([m.arquivo]);
        await db().from("materiais").delete().eq("id", U.limpar(b.id, 80));
        const { data } = await db().from("materiais").select("*").order("ordem").order("criado");
        return U.ok(res, { materiais: data || [] });
      }

      /* ======================= CÓPIA DE SEGURANÇA ======================= */
      case "backup": {
        if (!exigirAdmin()) return;
        const tabelas = ["registros", "agenda", "materiais", "config", "usuarios", "emails_log", "acessos"];
        const saida = { gerado_em: new Date().toISOString(), observacao: "Currículos ficam no Supabase Storage (bucket curriculos)." };
        for (const t of tabelas) saida[t] = await todas(() => db().from(t).select(t === "usuarios" ? "id, usuario, nome, email, perfil, ativo, criado, ultimo_acesso" : "*").order(t === "config" ? "chave" : "id"));
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
