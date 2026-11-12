/* =====================================================================
   UniLTS · Área da Empresa (cliente PJ)
   Colaboradores (modelo Excel, importação, exportação com cursos), turmas
   (vínculo por listas suspensas) e certificados. Só dados da própria empresa.
   ===================================================================== */
(function () {
  "use strict";
  const app = document.getElementById("ava-app");
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    baixar: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'), subir: s('<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>'),
    planilha: s('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>'), pessoas: s('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    cert: s('<circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/>'), turma: s('<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'), fechar: s('<path d="M6 6l12 12M18 6 6 18"/>'), doc: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>')
  };
  const COLUNAS = [["nome", "Nome"], ["matricula", "Matrícula"], ["rg", "RG"], ["cpf", "CPF"], ["admissao", "Admissão"], ["aso_data", "Data do ASO"], ["aso_tipo", "Tipo do ASO"],
    ["apto_altura", "Trabalho em Altura"], ["apto_confinado", "Espaço Confinado"], ["apto_eletricidade", "Eletricidade"], ["cargo", "Cargo"], ["unidade", "Unidade"], ["filial", "Filial"],
    ["centro_custo", "Centro de Custo"], ["area", "Área/Depto"], ["telefone", "Telefone"], ["email", "E-mail"]];
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ALIAS = Object.fromEntries(COLUNAS.map(([k, r]) => [norm(r), k]));
  Object.assign(ALIAS, { areadepto: "area", area: "area", departamento: "area", aso: "aso_data", dataaso: "aso_data", tipoaso: "aso_tipo", altura: "apto_altura", espacoconfinado: "apto_confinado", eletricidade: "apto_eletricidade", centrodecusto: "centro_custo", email: "email" });
  const dataBR = d => d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "";
  const nota = n => n === null || n === undefined ? "—" : Number(n).toFixed(2).replace(".", ",");
  const SIT = { em_andamento: ["Em andamento", "and"], aprovado: ["Aprovado", "ok"], reprovado: ["Reprovado", "erro"] };
  const MOD = { ead: "EaD", presencial: "Presencial", hibrido: "Híbrida (Blended Learning)" };
  let P, esc, st = { aba: "colaboradores", filtros: {} };

  P = window.UNI_PORTAL({
    tipo: "empresa", titulo: "Área da Empresa", demo: "empresa@demo.com",
    descricao: "Acompanhe a capacitação dos seus colaboradores com a LIPPMANN: importação da equipe, vínculo às turmas, certificados e relatórios.",
    itens: [`${IC.planilha} Importação da equipe por planilha padrão`, `${IC.turma} Vínculo às turmas em poucos cliques`, `${IC.cert} Certificados e validades em um só lugar`],
    entrar: () => carregar()
  });
  esc = P.esc;
  const api = (...a) => P.api(...a);

  async function carregar() {
    app.innerHTML = `<p class="vazio" style="padding:40px">Carregando…</p>`;
    const [r, c] = await Promise.all([api("resumo"), api("colaboradores")]);
    if (!r.ok || !c.ok) { app.innerHTML = `<p class="ava-aviso erro" style="margin:40px">${esc((r.ok ? c : r).mensagem || "Não foi possível carregar.")}</p>`; return; }
    st.r = r; st.cols = c.colaboradores;
    desenhar();
  }
  function desenhar() {
    const r = st.r, t = r.totais;
    app.innerHTML = `<section class="ava-wrap portal-wrap">
      <div class="portal-cab"><div><p class="ava-eyebrow">Área da Empresa</p><h1>${esc(r.empresa.nome_fantasia || r.empresa.razao_social)}</h1><p class="ava-mini">${esc(r.empresa.razao_social)} · CNPJ ${esc(r.empresa.cnpj)}</p></div></div>
      <div class="portal-kpis">
        <div><b>${t.colaboradores}</b><span>Colaboradores</span></div><div><b>${t.matriculas}</b><span>Matrículas</span></div>
        <div><b>${t.aprovados}</b><span>Aprovados</span></div><div><b>${t.em_andamento}</b><span>Em andamento</span></div>
      </div>
      <div class="portal-abas" role="tablist">${[["colaboradores", "Colaboradores"], ["turmas", "Turmas e matrículas"], ["certificados", "Certificados"]].map(([k, l]) => `<button type="button" role="tab" data-aba="${k}" aria-selected="${st.aba === k}">${l}</button>`).join("")}</div>
      <div id="p-aba"></div>
    </section>`;
    app.querySelector(".portal-abas").onclick = e => { const b = e.target.closest("[data-aba]"); if (b) { st.aba = b.dataset.aba; desenhar(); } };
    ({ colaboradores: abaColaboradores, turmas: abaTurmas, certificados: abaCertificados })[st.aba]();
  }

  /* ---------- colaboradores ---------- */
  const sel = (id, rot, lista, val) => `<label class="portal-filtro"><span>${rot}</span><select id="${id}"><option value="">Todas</option>${(lista || []).map(x => `<option${x === val ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`;
  function filtrar(lista, f) {
    const q = norm(f.busca || "");
    return lista.filter(c => (!f.unidade || c.unidade === f.unidade) && (!f.filial || c.filial === f.filial) && (!f.area || c.area === f.area) && (!f.centro_custo || c.centro_custo === f.centro_custo) && (!f.cargo || c.cargo === f.cargo) && (!q || norm([c.nome, c.cpf, c.matricula, c.cargo].join(" ")).includes(q)));
  }
  function abaColaboradores() {
    const r = st.r, f = st.filtros;
    const lista = filtrar(st.cols, f);
    const apt = c => [["apto_altura", "Altura"], ["apto_confinado", "Confinado"], ["apto_eletricidade", "Eletricidade"]].map(([k, l]) => c[k] === true ? `<span class="pchip ok">${l}</span>` : c[k] === false ? `<span class="pchip off">${l}</span>` : "").join("");
    document.getElementById("p-aba").innerHTML = `
      <div class="portal-barra">
        <button class="btn btn-contorno" type="button" id="bt-modelo">${IC.baixar} Baixar modelo Excel</button>
        <label class="btn btn-primario" style="cursor:pointer">${IC.subir} Importar planilha<input type="file" id="in-planilha" accept=".xlsx,.xls,.csv" hidden></label>
        <button class="btn btn-contorno" type="button" id="bt-exportar">${IC.planilha} Exportar com cursos</button>
      </div>
      <div id="imp-res"></div>
      <div class="portal-filtros">
        <label class="portal-filtro portal-busca"><span>Buscar</span><input id="f-busca" value="${esc(f.busca || "")}" placeholder="Nome, CPF, matrícula ou cargo"></label>
        ${sel("f-unidade", "Unidade", r.filtros.unidade, f.unidade)}${sel("f-filial", "Filial", r.filtros.filial, f.filial)}${sel("f-area", "Área/Depto", r.filtros.area, f.area)}${sel("f-centro_custo", "Centro de custo", r.filtros.centro_custo, f.centro_custo)}
      </div>
      <p class="ava-mini">${lista.length} de ${st.cols.length} colaborador(es)</p>
      <div class="portal-tabela"><table><thead><tr><th>Colaborador</th><th>Cargo · Área</th><th>Unidade · Filial</th><th>ASO</th><th>Aptidões</th><th>Cursos</th></tr></thead><tbody>
        ${lista.map(c => `<tr data-col="${c.id}"><td><b>${esc(c.nome)}</b><small>CPF ${esc(c.cpf)}${c.matricula ? " · Mat. " + esc(c.matricula) : ""}</small></td><td>${esc(c.cargo || "—")}<small>${esc(c.area || "")}</small></td><td>${esc(c.unidade || "—")}<small>${esc(c.filial || "")}</small></td><td>${c.aso_data ? dataBR(c.aso_data) : "—"}<small>${esc(c.aso_tipo || "")}</small></td><td><div class="pchips">${apt(c)}</div></td><td>${c.cursos.length ? c.cursos.map(x => `<span class="pchip ${(SIT[x.status] || [])[1] || ""}" title="${esc(x.curso)}">${esc(x.nr || x.curso.slice(0, 14))}</span>`).join("") : "<small>—</small>"}</td></tr>`).join("") || `<tr><td colspan="6" class="vazio">Nenhum colaborador. Baixe o modelo Excel, preencha e importe a planilha.</td></tr>`}
      </tbody></table></div>
      <p class="ava-mini portal-lgpd">Dados pessoais e de saúde ocupacional (ASO) tratados conforme a LGPD, visíveis apenas para a sua empresa e para a LIPPMANN.</p>`;
    ["unidade", "filial", "area", "centro_custo"].forEach(k => document.getElementById("f-" + k).onchange = e => { st.filtros[k] = e.target.value; abaColaboradores(); });
    const busca = document.getElementById("f-busca"); busca.oninput = () => { st.filtros.busca = busca.value; clearTimeout(st.tb); st.tb = setTimeout(() => { abaColaboradores(); const b = document.getElementById("f-busca"); b.focus(); b.setSelectionRange(b.value.length, b.value.length); }, 300); };
    document.getElementById("bt-modelo").onclick = baixarModelo;
    document.getElementById("bt-exportar").onclick = exportar;
    document.getElementById("in-planilha").onchange = e => importar(e.target.files[0]);
    document.querySelectorAll("[data-col]").forEach(tr => tr.onclick = () => detalheColaborador(st.cols.find(c => String(c.id) === tr.dataset.col)));
  }
  function precisaXlsx() { if (window.XLSX) return true; alert("O leitor de planilhas não carregou. Verifique a internet e recarregue a página."); return false; }
  function baixarModelo() {
    if (!precisaXlsx()) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([COLUNAS.map(c => c[1]), ["Maria da Silva Souza", "000123", "12.345.678-9", "529.982.247-25", "15/03/2024", "10/01/2026", "Periódico", "Sim", "Não", "Não", "Operadora de Produção", "Jundiaí", "Matriz", "CC-1020", "Produção", "(11) 99999-0000", "maria.souza@empresa.com.br"]]);
    ws["!cols"] = COLUNAS.map(([k]) => ({ wch: ["nome", "email", "cargo"].includes(k) ? 30 : 16 }));
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
    const inst = XLSX.utils.aoa_to_sheet([["MODELO PADRÃO · IMPORTAÇÃO DE COLABORADORES · UniLTS / LIPPMANN"], [""], ["Preencha uma linha por colaborador na aba Colaboradores, sem alterar os títulos das colunas. Apague a linha de exemplo."],
      ["Obrigatórios: Nome (completo) e CPF. E-mail é obrigatório para cursos EaD (é o login do colaborador)."], ["Datas: DD/MM/AAAA (Admissão e Data do ASO)."],
      ["Tipo do ASO: " + (st.r.tipos_aso || []).join(", ") + "."], ["Aptidões (Trabalho em Altura, Espaço Confinado, Eletricidade): Sim ou Não."],
      ["O CPF identifica o colaborador: ao importar de novo, os dados existentes são atualizados."], [""], ["Dados de ASO são dados pessoais sensíveis (LGPD). Envie somente o necessário para a gestão dos treinamentos."]]);
    inst["!cols"] = [{ wch: 120 }];
    XLSX.utils.book_append_sheet(wb, inst, "Instruções");
    XLSX.writeFile(wb, "Modelo-Colaboradores-UniLTS-LIPPMANN.xlsx");
  }
  async function importar(arq) {
    if (!arq || !precisaXlsx()) return;
    const out = document.getElementById("imp-res");
    out.innerHTML = `<p class="ava-aviso info">Lendo a planilha…</p>`;
    try {
      const wb = XLSX.read(await arq.arrayBuffer(), { type: "array", cellDates: false });
      const ws = wb.Sheets["Colaboradores"] || wb.Sheets[wb.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
      const cab = (linhas[0] || []).map(h => ALIAS[norm(h)] || null);
      if (!cab.includes("nome") || !cab.includes("cpf")) { out.innerHTML = `<p class="ava-aviso erro">A planilha precisa das colunas “Nome” e “CPF”. Use o modelo padrão.</p>`; return; }
      const dados = linhas.slice(1).map((l, i) => { const o = { _linha: i + 2 }; cab.forEach((k, j) => { if (k) o[k] = typeof l[j] === "string" ? l[j].trim() : l[j]; }); return o; })
        .filter(o => String(o.nome || "").trim() || String(o.cpf || "").trim()).filter(o => !/maria da silva souza/i.test(o.nome || ""));
      if (!dados.length) { out.innerHTML = `<p class="ava-aviso erro">Nenhuma linha preenchida encontrada.</p>`; return; }
      out.innerHTML = `<p class="ava-aviso info">Importando ${dados.length} linha(s)…</p>`;
      const r = await api("importar", { corpo: { linhas: dados } });
      if (!r.ok) { out.innerHTML = `<p class="ava-aviso erro">${esc(r.mensagem)}</p>`; return; }
      await carregar(); st.aba = "colaboradores";
      document.getElementById("imp-res").innerHTML = `<div class="ava-aviso ${r.erros.length ? "info" : "ok"}"><b>${esc(r.mensagem)}</b>${r.erros.length ? `<ul class="imp-erros">${r.erros.slice(0, 50).map(x => `<li>Linha ${x.linha}${x.nome ? " (" + esc(x.nome) + ")" : ""}: ${esc(x.erro)}</li>`).join("")}</ul>` : ""}</div>`;
    } catch (e) { out.innerHTML = `<p class="ava-aviso erro">Não foi possível ler o arquivo. Salve como .xlsx e tente novamente.</p>`; }
  }
  /* exportação com colunas dinâmicas por curso: situação, data de realização e validade */
  function exportar() {
    if (!precisaXlsx()) return;
    const cursos = [...new Set(st.cols.flatMap(c => c.cursos.map(x => x.curso)))].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
    const sn = v => v === true ? "Sim" : v === false ? "Não" : "";
    const cab = [...COLUNAS.map(c => c[1]), ...cursos.flatMap(n => [`${n} · Situação`, `${n} · Data de realização`, `${n} · Validade`])];
    const linhas = filtrar(st.cols, st.filtros).map(c => {
      const base = COLUNAS.map(([k]) => k.startsWith("apto_") ? sn(c[k]) : ["admissao", "aso_data"].includes(k) ? dataBR(c[k]) : (c[k] ?? ""));
      const din = cursos.flatMap(n => { const x = c.cursos.filter(y => y.curso === n).sort((a, b) => String(b.concluido_em || "").localeCompare(String(a.concluido_em || "")))[0];
        if (!x) return ["", "", ""];
        return [x.status === "aprovado" ? (x.valido_ate && new Date(x.valido_ate) < new Date() ? "Vencido" : "Concluído") : (SIT[x.status] || [x.status])[0], dataBR(x.concluido_em), x.status === "aprovado" ? (x.valido_ate ? dataBR(x.valido_ate) : "Indeterminada") : ""]; });
      return [...base, ...din];
    });
    const ws = XLSX.utils.aoa_to_sheet([cab, ...linhas]);
    ws["!cols"] = cab.map((h, i) => ({ wch: i === 0 ? 32 : Math.min(34, Math.max(12, h.length + 2)) }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Colaboradores e cursos");
    XLSX.writeFile(wb, `Colaboradores-Cursos-${(st.r.empresa.nome_fantasia || st.r.empresa.razao_social).replace(/[^\w]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  function gaveta(html) {
    document.querySelectorAll(".pg-fundo").forEach(x => x.remove());
    const f = document.createElement("div"); f.className = "pg-fundo"; f.innerHTML = `<div class="pg-gaveta" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(f); f.onclick = e => { if (e.target === f || e.target.closest("[data-fechar]")) f.remove(); };
    return f;
  }
  function detalheColaborador(c) {
    const linha = (k, v) => v ? `<tr><th>${k}</th><td>${esc(v)}</td></tr>` : "";
    const g = gaveta(`<div class="pg-cab"><div><p class="ava-eyebrow">Colaborador</p><h2>${esc(c.nome)}</h2></div><button class="pg-x" type="button" data-fechar aria-label="Fechar">${IC.fechar}</button></div>
      <table class="pg-dados"><tbody>${linha("CPF", c.cpf)}${linha("Matrícula", c.matricula)}${linha("RG", c.rg)}${linha("Admissão", dataBR(c.admissao))}${linha("ASO", [dataBR(c.aso_data), c.aso_tipo].filter(Boolean).join(" · "))}
        ${linha("Aptidões", [c.apto_altura && "Trabalho em altura", c.apto_confinado && "Espaço confinado", c.apto_eletricidade && "Eletricidade"].filter(Boolean).join(", ") || "Nenhuma informada")}
        ${linha("Cargo", c.cargo)}${linha("Unidade / Filial", [c.unidade, c.filial].filter(Boolean).join(" · "))}${linha("Centro de custo", c.centro_custo)}${linha("Área/Depto", c.area)}${linha("Telefone", c.telefone)}${linha("E-mail", c.email)}</tbody></table>
      <h3 class="pg-h3">Cursos</h3>
      ${c.cursos.length ? c.cursos.map(x => `<div class="pg-curso"><div><b>${esc(x.curso)}</b><small>Turma ${esc(x.turma)} · ${(SIT[x.status] || [x.status])[0]}${x.status === "em_andamento" ? ` · ${x.progresso}%` : ""}${x.concluido_em ? ` · Concluído em ${dataBR(x.concluido_em)}` : ""}${x.valido_ate ? ` · Válido até ${dataBR(x.valido_ate)}` : ""}</small></div>${x.certificado ? `<a class="btn btn-contorno" href="/unilts/certificado.html?c=${encodeURIComponent(x.certificado)}" target="_blank" rel="noopener">${IC.cert} Certificado</a>` : ""}</div>`).join("") : `<p class="vazio">Nenhum curso ainda.</p>`}
      <div class="ava-acoes" style="margin-top:16px"><button class="btn btn-contorno pg-perigo" type="button" id="col-x">Excluir colaborador</button></div>`);
    g.querySelector("#col-x").onclick = async e => {
      const b = e.target; if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Clique de novo para confirmar"; return; }
      const r = await api("colaborador_excluir", { corpo: { id: c.id } }); if (r.ok) { g.remove(); carregar(); }
    };
  }

  /* ---------- turmas ---------- */
  function abaTurmas() {
    const r = st.r, f = st.filtrosT || (st.filtrosT = {});
    const abertas = r.turmas.filter(t => t.status === "aberta");
    const tsel = r.turmas.find(t => String(t.id) === String(st.turma)) || abertas[0] || r.turmas[0];
    if (tsel) st.turma = tsel.id;
    const ja = new Set(st.cols.filter(c => c.cursos.some(x => tsel && x.turma === tsel.codigo)).map(c => c.id));
    const disp = filtrar(st.cols, f).filter(c => !ja.has(c.id));
    document.getElementById("p-aba").innerHTML = !r.turmas.length ? `<div class="ava-aviso info">Nenhuma turma aberta para a sua empresa ainda. Fale com a LIPPMANN para programar um treinamento: (11) 94013-8792.</div>` : `
      <div class="portal-filtros">
        <label class="portal-filtro portal-busca"><span>Turma</span><select id="t-sel">${r.turmas.map(t => `<option value="${t.id}"${t.id === tsel.id ? " selected" : ""}>${esc(t.codigo)} · ${esc(t.curso)} (${MOD[t.modalidade] || "EaD"}${t.status !== "aberta" ? " · encerrada" : ""})</option>`).join("")}</select></label>
      </div>
      <div class="portal-turma-cab">
        <div><b>${esc(tsel.codigo)}</b> · ${esc(tsel.curso)}<small>${MOD[tsel.modalidade] || "EaD"} · ${dataBR(tsel.inicio)} a ${dataBR(tsel.fim)}${tsel.modalidade !== "presencial" ? ` · prazo de ${tsel.prazo_dias} dias corridos para concluir` : ""} · ${tsel.total} matriculado(s) · ${tsel.aprovados} aprovado(s)</small></div>
        <a class="btn btn-contorno" href="/integra/relatorio.html?turma=${tsel.id}" target="_blank" rel="noopener">${IC.doc} Relatório FR-DOC-18</a>
      </div>
      <div class="portal-duas">
        <div class="portal-cartao">
          <h3>Vincular colaboradores</h3>
          ${tsel.status !== "aberta" ? `<p class="ava-aviso info">Turma encerrada.</p>` : `
          <div class="portal-filtros compacto">${sel("v-unidade", "Unidade", r.filtros.unidade, f.unidade)}${sel("v-area", "Área/Depto", r.filtros.area, f.area)}${sel("v-cargo", "Cargo", r.filtros.cargo, f.cargo)}${sel("v-filial", "Filial", r.filtros.filial, f.filial)}</div>
          <label class="pg-todos"><input type="checkbox" id="v-todos"> Selecionar todos (${disp.length})</label>
          <div class="pg-lista">${disp.map(c => `<label class="pg-item"><input type="checkbox" value="${c.id}"><span><b>${esc(c.nome)}</b><small>${esc([c.cargo, c.unidade, c.area].filter(Boolean).join(" · "))}${tsel.modalidade !== "presencial" && !c.email ? ` · <em class="erro">sem e-mail (obrigatório no EaD)</em>` : ""}</small></span></label>`).join("") || `<p class="vazio">Nenhum colaborador disponível com esses filtros.</p>`}</div>
          <p class="ava-aviso" id="v-msg" hidden></p>
          <button class="btn btn-primario" type="button" id="v-ok" style="width:100%">Vincular selecionados</button>
          ${tsel.modalidade !== "presencial" ? `<p class="ava-mini">Cada colaborador recebe por e-mail o acesso à Área do Aluno, com senha provisória. O prazo de ${tsel.prazo_dias} dias corridos para concluir começa na matrícula; se estourar, o progresso volta a 0%.</p>` : ""}`}
        </div>
        <div class="portal-cartao">
          <h3>Matriculados</h3>
          ${participantes(tsel)}
        </div>
      </div>`;
    if (!tsel) return;
    document.getElementById("t-sel").onchange = e => { st.turma = e.target.value; abaTurmas(); };
    ["unidade", "area", "cargo", "filial"].forEach(k => { const el = document.getElementById("v-" + k); if (el) el.onchange = e => { st.filtrosT[k] = e.target.value; abaTurmas(); }; });
    const todos = document.getElementById("v-todos"); if (todos) todos.onchange = () => document.querySelectorAll(".pg-lista input").forEach(x => x.checked = todos.checked);
    const ok = document.getElementById("v-ok");
    if (ok) ok.onclick = async () => {
      const ids = [...document.querySelectorAll(".pg-lista input:checked")].map(x => +x.value);
      if (!ids.length) return msg("v-msg", "erro", "Selecione ao menos um colaborador.");
      ok.disabled = true; const r2 = await api("vincular", { corpo: { turma_id: tsel.id, colaboradores: ids } }); ok.disabled = false;
      if (!r2.ok) return msg("v-msg", "erro", r2.mensagem);
      await carregar(); st.aba = "turmas"; desenhar(); msg("v-msg", r2.sem_email && r2.sem_email.length ? "info" : "ok", r2.mensagem);
    };
  }
  const msg = (id, tipo, t) => { const el = document.getElementById(id); if (el) { el.hidden = false; el.className = "ava-aviso " + tipo; el.textContent = t; } };
  function participantes(t) {
    const lista = st.cols.flatMap(c => c.cursos.filter(x => x.turma === t.codigo).map(x => ({ c, x })));
    return lista.length ? `<div class="portal-tabela"><table><thead><tr><th>Colaborador</th><th>Progresso</th><th>Nota</th><th>Situação</th></tr></thead><tbody>${lista.map(({ c, x }) => `<tr><td><b>${esc(c.nome)}</b><small>${esc(c.cargo || "")}</small></td><td><span class="pbarra"><span style="width:${x.progresso}%"></span></span> ${x.progresso}%</td><td>${nota(x.nota)}</td><td><span class="pchip ${(SIT[x.status] || [])[1] || ""}">${(SIT[x.status] || [x.status])[0]}</span>${x.certificado ? ` <a href="/unilts/certificado.html?c=${encodeURIComponent(x.certificado)}" target="_blank" rel="noopener">certificado</a>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="vazio">Nenhum colaborador matriculado nesta turma.</p>`;
  }

  /* ---------- certificados ---------- */
  function abaCertificados() {
    const hoje = new Date(), em60 = new Date(Date.now() + 60 * 86400000);
    const lista = st.cols.flatMap(c => c.cursos.filter(x => x.status === "aprovado").map(x => ({ c, x }))).sort((a, b) => String(a.x.valido_ate || "9999").localeCompare(String(b.x.valido_ate || "9999")));
    const sit = x => !x.valido_ate ? ["Válido · indeterminado", "ok"] : new Date(x.valido_ate) < hoje ? ["Vencido", "erro"] : new Date(x.valido_ate) < em60 ? ["Vence em até 60 dias", "and"] : ["Válido", "ok"];
    document.getElementById("p-aba").innerHTML = `<div class="portal-tabela"><table><thead><tr><th>Colaborador</th><th>Curso</th><th>Conclusão</th><th>Validade</th><th>Situação</th><th></th></tr></thead><tbody>
      ${lista.map(({ c, x }) => { const [r1, k] = sit(x); return `<tr><td><b>${esc(c.nome)}</b><small>CPF ${esc(c.cpf)}</small></td><td>${esc(x.curso)}<small>Turma ${esc(x.turma)}</small></td><td>${dataBR(x.concluido_em)}</td><td>${x.valido_ate ? dataBR(x.valido_ate) : "Indeterminada"}</td><td><span class="pchip ${k}">${r1}</span></td><td><a class="btn btn-contorno" href="/unilts/certificado.html?c=${encodeURIComponent(x.certificado)}" target="_blank" rel="noopener">${IC.cert} Abrir</a></td></tr>`; }).join("") || `<tr><td colspan="6" class="vazio">Nenhum certificado emitido ainda.</td></tr>`}
    </tbody></table></div>`;
  }
})();
