/* L³ INTEGRA · RELATÓRIO DE TREINAMENTO (FR-DOC-18) unificado da turma, pronto para salvar em PDF:
   prestadora, cliente, turma, conteúdo, indicadores, participantes e notas, logs auditáveis (NR 01),
   documentos, evidências fotográficas legendadas e, em anexo, os certificados dos aprovados. */
(function () {
  const C = window.LTS_CONFIG, DEMO = !!(C.api && C.api.modoDemonstracao);
  const id = new URLSearchParams(location.search).get("turma");
  const el = document.getElementById("rel"), st = document.getElementById("r-status"), bt = document.getElementById("bt-pdf");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const d = v => v ? new Date(String(v).length === 10 ? v + "T12:00:00" : String(v).replace(" ", "T")).toLocaleDateString("pt-BR") : "—";
  const dh = v => v ? new Date(String(v).replace(" ", "T")).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
  const nota = n => n === null || n === undefined || n === "" ? "—" : Number(n).toFixed(2).replace(".", ",");
  const SIT = { em_andamento: "Em andamento", aprovado: "Aprovado", reprovado: "Reprovado", cancelado: "Cancelado" };
  const MOD = { ead: "EaD (ensino a distância)", presencial: "Presencial", hibrido: "Híbrida (Blended Learning): teoria e avaliação on-line no AVA + prática presencial" };
  const EVT = { login: "Entrada (login)", logout: "Saída (logout)", acesso_curso: "Acesso ao curso", aula_concluida: "Aula concluída", avaliacao: "Avaliação", senha_alterada: "Senha definida", senha_redefinida: "Senha redefinida",
    matricula_empresa: "Matrícula (empresa)", matricula_presencial: "Matrícula (instrutor)", notas_presenca: "Notas e presença", resultado_presencial: "Resultado", prazo_expirado_reset: "Prazo expirado · progresso zerado",
    acesso_revogado: "Acesso revogado (12 meses)", acesso_reabilitado: "Acesso reabilitado", login_bloqueado: "Login bloqueado" };
  async function carregar() {
    if (DEMO) return window.UNI_DEMO.painel("uni_turma", {}, { id });
    for (const u of [`painel?acao=uni_turma&id=`, `empresa?acao=relatorio&id=`, `parceiro?acao=relatorio&id=`]) {
      try { const r = await fetch(C.api.base + u + encodeURIComponent(id), { credentials: "same-origin" }); if (r.ok) { const j = await r.json(); if (j.ok) return j; } } catch (e) {}
    }
    return { ok: false, mensagem: "Relatório indisponível ou sem permissão." };
  }
  carregar().then(r => {
    if (!r || !r.ok) { st.textContent = r && r.mensagem ? r.mensagem : "Relatório indisponível."; el.innerHTML = `<p class="nao">${esc(st.textContent)} Entre no L³ INTEGRA, na Área da Empresa ou no Painel do Parceiro e abra o relatório pela turma.</p>`; return; }
    const t = r.turma, c = r.curso || {}, ms = r.matriculas.filter(m => m.status !== "cancelado");
    const pres = t.modalidade && t.modalidade !== "ead", hib = t.modalidade === "hibrido";
    const ap = ms.filter(m => m.status === "aprovado"), rp = ms.filter(m => m.status === "reprovado"), an = ms.filter(m => m.status === "em_andamento");
    const media = ap.length ? ap.reduce((s, m) => s + Number(m.nota || 0), 0) / ap.length : null;
    const taxa = ap.length + rp.length ? Math.round(ap.length / (ap.length + rp.length) * 100) : 0;
    const arqs = r.arquivos || [], fotos = r.fotos || {}, docs = r.documentos || {};
    const instrutor = r.parceiro ? `${r.parceiro.nome}${r.parceiro.qualificacao ? " · " + r.parceiro.qualificacao : ""}${r.parceiro.registro ? " · " + r.parceiro.registro : ""}` : `${t.instrutor_nome || c.instrutor_nome || ""}${c.instrutor_qualificacao ? " · " + c.instrutor_qualificacao : ""}`;
    const resumoLog = m => {
      const L = m.logs || [], ent = L.filter(x => x.acao === "login"), sai = L.filter(x => x.acao === "logout"), aulas = L.filter(x => x.acao === "aula_concluida").length;
      return pres && !hib ? { a: dh(m.presenca_entrada), b: dh(m.presenca_saida), n: m.presenca_entrada && m.presenca_saida ? ((new Date(m.presenca_saida) - new Date(m.presenca_entrada)) / 3600000).toFixed(1).replace(".", ",") + " h" : "—", aulas: "—" }
        : { a: ent.length ? dh(ent[0].t) : "—", b: L.length ? dh(L[L.length - 1].t) : "—", n: `${ent.length} entrada(s) · ${sai.length} saída(s)`, aulas: `${aulas}/${m.progresso.total}` };
    };
    const todosLogs = ms.flatMap(m => (m.logs || []).map(x => ({ ...x, nome: m.aluno.nome }))).sort((a, b) => String(a.t).localeCompare(String(b.t)));
    document.title = `RELATÓRIO DE TREINAMENTO - ${t.codigo}`;
    el.innerHTML = `<article class="doc">
      <table class="cab"><tbody><tr>
        <td class="cab-logo"><img src="/assets/img/marca/LTS-LOGO-HOR-AZUL_REV01.svg" alt="LIPPMANN Treinamentos e Soluções"></td>
        <td class="cab-tit"><h1>RELATÓRIO DE TREINAMENTO - ${esc(t.codigo)}</h1><p>${esc(c.titulo || "")}</p></td>
        <td class="cab-cod"><b>FR-DOC-18</b><span>Revisão 00</span><span>Emissão ${d(r.emissao)}</span></td>
      </tr></tbody></table>

      <h2>1. Identificação</h2>
      <table class="kv"><tbody>
        <tr><th>Prestadora</th><td>LIPPMANN TREINAMENTOS E SOLUÇÕES LTDA</td><th>CNPJ</th><td>53.000.126/0001-22</td></tr>
        <tr><th>Contato</th><td>atendimento@lippmannts.com · (11) 94013-8792</td><th>Site</th><td>lippmannts.com</td></tr>
        ${r.empresa ? `<tr><th>Contratante</th><td>${esc(r.empresa.razao_social)}</td><th>CNPJ</th><td>${esc(r.empresa.cnpj)}</td></tr>` : `<tr><th>Contratante</th><td colspan="3">Turma aberta · pessoa física (B2C)</td></tr>`}
      </tbody></table>

      <h2>2. Dados do treinamento</h2>
      <table class="kv"><tbody>
        <tr><th>Curso</th><td colspan="3">${esc(c.titulo || "")}</td></tr>
        <tr><th>Referência normativa</th><td colspan="3">${esc(c.norma || c.nr || "—")}</td></tr>
        <tr><th>Turma</th><td>${esc(t.codigo)}</td><th>Modalidade</th><td>${esc(MOD[t.modalidade] || c.modalidade || "EaD")}</td></tr>
        <tr><th>Carga horária</th><td>${String(Number(c.carga_horaria || 0)).replace(".", ",")} horas</td><th>Situação</th><td>${esc({ aberta: "Aberta", encerrada: "Encerrada", cancelada: "Cancelada" }[t.status] || t.status)}</td></tr>
        <tr><th>Período</th><td>${d(t.inicio)} a ${d(t.fim)}</td><th>${pres ? "Local" : "Prazo EaD"}</th><td>${pres ? esc(t.local || "") : `${t.prazo_dias || 30} dias corridos por matrícula`}</td></tr>
        ${!pres ? `<tr><th>Local</th><td colspan="3">${esc(t.local || "")}</td></tr>` : ""}
        <tr><th>Instrutor</th><td colspan="3">${esc(instrutor)}</td></tr>
        <tr><th>Responsável técnico</th><td colspan="3">${esc(c.rt_nome || "")}${c.rt_qualificacao ? " · " + esc(c.rt_qualificacao) : ""}</td></tr>
      </tbody></table>

      <h2>3. Conteúdo programático</h2>
      <ol class="cp">${(c.conteudo_programatico || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>

      <h2>4. Indicadores da turma</h2>
      <div class="kpis">
        <div><b>${ms.length}</b><span>Participantes</span></div><div><b>${ap.length}</b><span>Aprovados</span></div>
        <div><b>${rp.length}</b><span>Reprovados</span></div><div><b>${an.length}</b><span>Em andamento</span></div>
        <div><b>${taxa}%</b><span>Taxa de aprovação</span></div><div><b>${nota(media)}</b><span>Nota média (aprovados)</span></div>
        <div><b>${nota(c.nota_corte)}</b><span>Nota mínima</span></div><div><b>${r.certificados ? r.certificados.length : ap.length}</b><span>Certificados emitidos</span></div>
      </div>

      <h2>5. Relação de participantes e notas</h2>
      <table class="lista"><thead><tr><th>Nº</th><th>Participante</th><th>CPF</th>${pres ? "<th>Teórica</th><th>Prática</th>" : "<th>Aulas</th><th>Tent.</th>"}<th>Nota final</th><th>Situação</th><th>Certificado</th></tr></thead><tbody>
        ${ms.map((m, i) => `<tr><td>${i + 1}</td><td>${esc(m.aluno.nome)}${m.aluno.empresa ? `<br><small>${esc(m.aluno.empresa)}</small>` : ""}</td><td class="nw">${esc(m.aluno.cpf)}</td>${pres ? `<td>${nota(m.nota_teorica)}</td><td>${nota(m.nota_pratica)}</td>` : `<td>${m.progresso.pct}%</td><td>${m.tentativas}/${m.tentativas_max}</td>`}<td>${nota(m.nota)}</td><td class="s-${m.status}">${SIT[m.status] || m.status}</td><td class="cert">${esc(m.certificado || "—")}</td></tr>`).join("") || `<tr><td colspan="8">Nenhum participante.</td></tr>`}
      </tbody></table>

      <h2>6. Registros auditáveis de entrada e saída (NR 01)</h2>
      <table class="lista"><thead><tr><th>Participante</th><th>${pres && !hib ? "Entrada" : "Primeiro acesso"}</th><th>${pres && !hib ? "Saída" : "Último registro"}</th><th>${pres && !hib ? "Permanência" : "Entradas / saídas"}</th>${pres && !hib ? "" : "<th>Aulas</th>"}</tr></thead><tbody>
        ${ms.map(m => { const x = resumoLog(m); return `<tr><td>${esc(m.aluno.nome)}</td><td class="nw">${x.a}</td><td class="nw">${x.b}</td><td>${x.n}</td>${pres && !hib ? "" : `<td>${x.aulas}</td>`}</tr>`; }).join("")}
      </tbody></table>
      ${todosLogs.length ? `<p class="sub">Trilha de auditoria completa (${todosLogs.length} registro(s), horário de Brasília):</p>
      <table class="lista log"><thead><tr><th>Data e hora</th><th>Participante</th><th>Evento</th><th>Detalhe</th></tr></thead><tbody>
        ${todosLogs.map(x => `<tr><td class="nw">${dh(x.t)}</td><td>${esc(x.nome)}</td><td>${esc(EVT[x.acao] || x.acao)}</td><td>${esc(x.detalhe || "")}</td></tr>`).join("")}
      </tbody></table>` : ""}

      ${pres ? `<h2>7. Documentos legais</h2>
      <table class="lista"><thead><tr><th>Documento</th><th>Situação</th><th>Arquivo</th><th>Enviado em</th></tr></thead><tbody>
        ${Object.entries(docs).map(([k, rot]) => { const a = arqs.filter(x => x.categoria === "documento" && x.tipo === k); return `<tr><td>${esc(rot)}</td><td class="${a.length ? "s-aprovado" : "s-reprovado"}">${a.length ? "Anexado" : "Pendente"}</td><td>${a.map(x => x.url ? `<a href="${esc(x.url)}">${esc(x.nome_original || "arquivo")}</a>` : esc(x.nome_original || "")).join("<br>") || "—"}</td><td>${a.map(x => d(x.criado)).join("<br>") || "—"}</td></tr>`; }).join("")}
      </tbody></table>

      <h2 class="quebra">8. Evidências fotográficas</h2>
      <div class="fotos">${Object.entries(fotos).map(([k, rot]) => { const a = arqs.find(x => x.categoria === "foto" && x.tipo === k);
        return `<figure>${a && a.url ? `<img src="${esc(a.url)}" alt="${esc(rot)}">` : `<div class="sem-foto">Foto pendente</div>`}<figcaption><b>${esc(rot)}</b>${a ? `<span>${esc((a.legenda || "").replace(rot + " · ", ""))}</span><small>${a.largura || "?"} × ${a.altura || "?"} px · enviado em ${dh(a.criado)}</small>` : ""}</figcaption></figure>`; }).join("")}</div>` : ""}

      <h2>${pres ? "9" : "7"}. Metodologia e avaliação</h2>
      <p>${pres ? `Capacitação ${hib ? "híbrida: parte teórica no AVA UniLTS (aulas, avaliação com até " + Number(c.tentativas_max || 3) + " tentativas) e parte prática presencial" : "presencial"} conduzida pelo instrutor ${esc(r.parceiro ? r.parceiro.nome : t.instrutor_nome || "")}, com avaliação teórica e prática. Aprovação com nota mínima ${nota(c.nota_corte)} em cada uma; a nota final é a média das duas. Presença comprovada por registro de entrada e saída, documentos legais digitalizados e evidências fotográficas.`
        : `Capacitação na modalidade EaD, no Ambiente Virtual de Aprendizagem UniLTS, com aulas em vídeo, textos de apoio, plano de ensino e mapa mental. A avaliação é liberada após a conclusão de todas as aulas, com até ${Number(c.tentativas_max || 3)} tentativas e nota mínima ${nota(c.nota_corte)}. Cada matrícula tem ${t.prazo_dias || 30} dias corridos para conclusão; estourado o prazo, o progresso é zerado automaticamente. Os acessos são registrados com data e hora (trilha de auditoria acima).`}
      Os certificados dos aprovados contêm QR Code para validação pública em lippmannts.com/validar.html e seguem anexos a este relatório.</p>

      <h2>${pres ? "10" : "8"}. Observações</h2>
      <p class="obs">${esc(t.observacoes || "Sem observações.")}</p>

      <div class="ass">
        <div><span class="linha"></span><b>${esc(r.parceiro ? r.parceiro.nome : t.instrutor_nome || c.instrutor_nome || "")}</b><small>Instrutor</small></div>
        <div><span class="linha"></span><b>${esc(c.rt_nome || "")}</b><small>Responsável técnico</small></div>
        <div><span class="linha"></span><b>${esc(r.responsavel || "")}</b><small>Emitido por</small></div>
      </div>
      <p class="rodape">Documento gerado eletronicamente pela plataforma L³ INTEGRA / UniLTS em ${new Date(r.emissao).toLocaleString("pt-BR")}. FR-DOC-18 · LIPPMANN Treinamentos e Soluções · CNPJ 53.000.126/0001-22. Contém dados pessoais: uso restrito, conforme a LGPD.</p>
    </article>
    ${(r.certificados || []).length ? `<div class="anexo-tit"><h2>Anexo · Certificados emitidos (${r.certificados.length})</h2></div><div class="rel-certs">${r.certificados.map(x => window.UNI_CERT.html(x)).join("")}</div>` : ""}`;
    const ajustar = () => { const z = Math.min(1, (window.innerWidth - 24) / 1123); el.querySelectorAll(".folha").forEach(f => f.style.zoom = z < 1 ? z : ""); };
    ajustar(); window.addEventListener("resize", ajustar);
    window.addEventListener("beforeprint", () => el.querySelectorAll(".folha").forEach(f => f.style.zoom = "")); window.addEventListener("afterprint", ajustar);
    st.textContent = `RELATÓRIO DE TREINAMENTO - ${t.codigo}`; bt.disabled = false;
  });
  bt.onclick = () => window.print();
})();
