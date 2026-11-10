/* =====================================================================
   POST /api/registrar · recebe os formulários do site
   tipos: lead (Conteúdo) · newsletter · contato (Fale Conosco) · candidato (Trabalhe Conosco)
   1) grava no Supabase  2) avisa a equipe por e-mail  3) responde ao visitante quando aplicável
   ===================================================================== */
const { db, BUCKET_CURRICULOS } = require("./_lib/supabase");
const U = require("./_lib/util");
const E = require("./_lib/email");

const ROTULOS = { lead: "Novo lead — Biblioteca Técnica", newsletter: "Nova inscrição na Newsletter", contato: "Fale Conosco", candidato: "Trabalhe Conosco" };

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "POST")) return;
  try {
    const b = await U.corpo(req);
    const tipo = U.limpar(b._tipo, 20);
    if (!ROTULOS[tipo]) return U.erro(res, "Formulário inválido.");
    if (b._honey) return U.ok(res);
    if (!(await U.limite(req, "registrar", 12, 600))) return U.erro(res, "Muitos envios em pouco tempo. Aguarde alguns minutos.", 429);

    const c = (nomes, max = 300) => { for (const n of nomes) if (b[n] !== undefined && b[n] !== "") return U.limpar(b[n], max); return ""; };
    const r = {
      nome: c(["Nome completo", "Nome"]),
      email: c(["E-mail", "Email"], 160).toLowerCase(),
      telefone: c(["Celular / WhatsApp", "Telefone", "Celular"], 40),
      empresa: c(["Empresa"], 160),
      cargo: c(["Cargo"], 120),
      cidade: c(["Cidade"], 120),
      uf: c(["Estado", "UF"], 4).toUpperCase(),
      origem: c(["Como conheceu a LIPPMANN"], 80),
      assunto: c(["Assunto", "_material"], 160),
      mensagem: c(["Mensagem", "Apresentação"], 5000),
      cargo_pretendido: c(["Cargo pretendido"], 120),
      linkedin: c(["LinkedIn"], 250),
    };
    const m = r.cidade && !r.uf && r.cidade.match(/^(.*?)[\s/,-]+([A-Za-z]{2})$/);
    if (m) { r.cidade = m[1].trim(); r.uf = m[2].toUpperCase(); }
    if (r.email && !U.emailValido(r.email)) return U.erro(res, "Informe um e-mail válido.");

    const denuncia = tipo === "contato" && r.assunto === "DENÚNCIAS";
    const obrig = { lead: ["nome", "empresa", "cargo", "cidade", "uf", "email", "telefone", "origem"], newsletter: ["nome", "email"], contato: denuncia ? ["assunto", "mensagem"] : ["assunto", "nome", "email", "mensagem"], candidato: ["nome", "email", "telefone", "cargo_pretendido"] }[tipo];
    if (obrig.some((k) => !r[k])) return U.erro(res, "Preencha todos os campos obrigatórios.");
    if (!b["Consentimento LGPD"]) return U.erro(res, "É necessário aceitar a Política de Privacidade.");

    /* Currículo: o arquivo já foi enviado direto do navegador para o Supabase Storage (/api/upload) */
    let arquivo = "", arquivo_nome = "";
    if (tipo === "candidato") {
      arquivo = U.limpar(b._arquivo, 200);
      arquivo_nome = U.limpar(b._arquivo_nome, 150);
      if (!/^\d{4}-\d{2}\/[a-f0-9-]{36}\.(pdf|docx?)$/.test(arquivo)) return U.erro(res, "Anexe o seu currículo (PDF, DOC ou DOCX).");
      const pasta = arquivo.split("/")[0], nomeArq = arquivo.split("/")[1];
      const { data: lista } = await db().storage.from(BUCKET_CURRICULOS).list(pasta, { search: nomeArq, limit: 1 });
      if (!lista || !lista.length) return U.erro(res, "O envio do currículo não foi concluído. Tente anexar novamente.");
    }

    /* Newsletter: não duplica o mesmo e-mail */
    if (tipo === "newsletter") {
      const { data: existe } = await db().from("registros").select("id").eq("tipo", "newsletter").eq("email", r.email).maybeSingle();
      if (existe) {
        await db().from("registros").update({ status: "ativo", nome: r.nome }).eq("id", existe.id);
        return U.ok(res, { mensagem: "Este e-mail já está cadastrado na Newsletter." });
      }
    }

    const g = U.geo(req);
    const extras = {};
    Object.keys(b).forEach((k) => { if (!k.startsWith("_") && typeof b[k] === "string") extras[k] = U.limpar(b[k], 1000); });
    const { data: novo, error } = await db().from("registros").insert({
      tipo, ...r, arquivo, arquivo_nome,
      pagina: U.limpar(b._pagina, 80), visitante: U.limpar(b._visitante, 60), sessao: U.limpar(b._sessao, 60),
      ip_hash: U.ipHash(req), geo_cidade: g.cidade, geo_uf: g.uf, geo_pais: g.pais,
      status: tipo === "newsletter" ? "ativo" : "novo", extras,
    }).select("id").single();
    if (error) throw error;
    const id = novo.id;

    /* ---------- e-mails ---------- */
    const rotulo = tipo === "contato" ? `Fale Conosco — ${r.assunto}` : tipo === "candidato" ? `Trabalhe Conosco — ${r.cargo_pretendido}` : ROTULOS[tipo];
    const site = (process.env.URL_SITE || "https://www.lippmannts.com").replace(/\/$/, "");
    const resumo = E.tabela({
      "Tipo": rotulo, "Nome": r.nome || (denuncia ? "Anônimo" : ""), "Empresa": r.empresa, "Cargo": r.cargo, "Cargo pretendido": r.cargo_pretendido,
      "E-mail": r.email, "Telefone / WhatsApp": r.telefone, "Cidade / UF": [r.cidade, r.uf].filter(Boolean).join(" / "),
      "Como conheceu": r.origem, "LinkedIn": r.linkedin, "Mensagem": r.mensagem,
      "Localização aproximada (IP)": [g.cidade, g.uf].filter(Boolean).join(" / "),
      "Recebido em": new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), "Página": U.limpar(b._pagina, 80),
    });
    const anexos = [];
    if (arquivo) {
      const { data: blob } = await db().storage.from(BUCKET_CURRICULOS).download(arquivo);
      if (blob) anexos.push({ filename: arquivo_nome || arquivo.split("/")[1], content: Buffer.from(await blob.arrayBuffer()) });
    }
    const primeiro = (r.nome || "").split(" ")[0];
    const envios = [
      E.enviar(await E.emailsEquipe(), `[L³ INTEGRA] ${rotulo}${r.nome ? " · " + r.nome : ""}`,
        E.layout(rotulo, `<p style="margin:0 0 14px">Uma nova interação foi registrada no site e já está no L³ INTEGRA (registro nº ${id}).</p>${resumo}${E.botao("Abrir o L³ INTEGRA", site + "/integra/")}`),
        { replyTo: r.email || undefined, anexos }),
    ];
    if (tipo === "newsletter") {
      const { configGet } = require("./_lib/supabase");
      const assunto = await configGet("boas_vindas_assunto", "Bem-vindo(a) à Newsletter LIPPMANN");
      const texto = await configGet("boas_vindas_texto", "Obrigado por se cadastrar na Newsletter LIPPMANN.");
      envios.push(E.enviar(r.email, assunto, E.layout("Bem-vindo(a) à Newsletter LIPPMANN",
        `<p style="margin:0 0 14px">Olá, ${U.esc(primeiro)}!</p><p style="margin:0 0 14px;line-height:1.6">${U.esc(texto).replace(/\n/g, "<br>")}</p>${E.botao("Conhecer os treinamentos", site + "/treinamentos.html")}<p style="font-size:12px;color:#6C727C;margin-top:22px">Para cancelar a inscrição, responda a este e-mail com a palavra CANCELAR.</p>`),
        { replyTo: "atendimento@lippmannts.com" }));
    }
    if (tipo === "candidato") {
      envios.push(E.enviar(r.email, "Recebemos o seu currículo · LIPPMANN", E.layout("Currículo recebido",
        `<p style="margin:0 0 14px">Olá, ${U.esc(primeiro)}!</p><p style="margin:0 0 14px;line-height:1.6">Recebemos o seu currículo para a área <b>${U.esc(r.cargo_pretendido)}</b>. Ele ficará no nosso banco de talentos e, havendo uma oportunidade compatível, entraremos em contato para agendar uma entrevista.</p><p style="margin:0">Obrigado pelo interesse em fazer parte da LIPPMANN.</p>`)));
    }
    if (tipo === "contato" && r.email && !denuncia) {
      envios.push(E.enviar(r.email, "Recebemos a sua mensagem · LIPPMANN", E.layout("Mensagem recebida",
        `<p style="margin:0 0 14px">Olá, ${U.esc(primeiro)}!</p><p style="margin:0 0 14px;line-height:1.6">Recebemos a sua mensagem sobre <b>${U.esc(r.assunto)}</b>. A equipe LIPPMANN responderá em breve pelo contato informado.</p>${E.botao("Falar agora pelo WhatsApp", "https://wa.me/5511940138792?text=" + encodeURIComponent("Olá! Vim pelo site oficial da LIPPMANN."), "#1FA855")}`)));
    }
    await Promise.allSettled(envios);
    return U.ok(res, { id });
  } catch (e) {
    console.error("registrar:", e);
    return U.erro(res, "Não foi possível registrar agora. Tente novamente em instantes.", 500);
  }
};
