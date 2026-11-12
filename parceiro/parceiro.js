/* =====================================================================
   UniLTS · Painel do Parceiro / Instrutor
   Turmas presenciais e híbridas: participantes, notas teórica e prática,
   entrada/saída, documentos legais e evidências fotográficas em resolução total.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG, DEMO = !!(C.api && C.api.modoDemonstracao);
  const app = document.getElementById("ava-app");
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    camera: s('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/>'), doc: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/>'),
    ok: s('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'), pend: s('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'), volta: s('<path d="M15 18 9 12l6-6"/>'),
    turma: s('<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'), nota: s('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'), subir: s('<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>')
  };
  const MOD = { presencial: "Presencial", hibrido: "Híbrida (Blended Learning)", ead: "EaD" };
  const SIT = { em_andamento: "Em andamento", aprovado: "Aprovado", reprovado: "Reprovado" };
  const MIN = 1280;
  const dataBR = d => d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR") : "—";
  const nota = n => n === null || n === undefined || n === "" ? "" : String(Number(n)).replace(".", ",");
  const local = v => { if (!v) return ""; const d = new Date(v); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  let P, esc, st = {};

  P = window.UNI_PORTAL({
    tipo: "parceiro", titulo: "Painel do Parceiro", demo: "instrutor@demo.com",
    descricao: "Registre as turmas presenciais e híbridas que você conduz pela LIPPMANN: participantes, notas, documentos legais e evidências fotográficas.",
    itens: [`${IC.nota} Notas teórica e prática, entrada e saída`, `${IC.doc} Documentos FR-DOC e credenciais`, `${IC.camera} Evidências fotográficas com legenda obrigatória`],
    entrar: () => rotear()
  });
  esc = P.esc;
  const api = (...a) => P.api(...a);
  window.addEventListener("hashchange", () => rotear());
  document.addEventListener("click", e => {   // links internos (#t/...) funcionam mesmo com <base> no documento
    const a = e.target.closest('a[href^="#"]'); if (!a || a.classList.contains("a11y-pular") || e.ctrlKey || e.metaKey) return;
    e.preventDefault(); const h = a.getAttribute("href").slice(1);
    if (location.hash.slice(1) === h) rotear(); else location.hash = h;
  });
  function rotear() { const m = location.hash.match(/^#t\/(\d+)(?:\/(\w+))?/); m ? turma(+m[1], m[2] || "participantes") : inicio(); window.scrollTo(0, 0); }
  const aviso = (id, tipo, t) => { const el = document.getElementById(id); if (el) { el.hidden = !t; el.className = "ava-aviso " + tipo; el.textContent = t || ""; } };

  /* ---------- trilha obrigatória do instrutor (curso interno na UniLTS) ---------- */
  function cartaoTrilha(t) {
    if (t.status === "dispensada") return "";
    if (t.status === "aprovada") return `<div class="par-trilha ok"><div>${IC.ok}</div><div><b>Trilha de Capacitação do Instrutor Parceiro concluída</b><span>Você está habilitado a criar e concluir turmas.${t.certificado ? ` Certificado ${esc(t.certificado)}.` : ""}</span></div><a class="btn btn-contorno" href="/ajuda.html#instrutores">Central de Ajuda</a></div>`;
    return `<div class="par-trilha"><div>${IC.doc}</div><div><b>Curso obrigatório: Trilha de Capacitação do Instrutor Parceiro</b>
      <span>Antes de criar e concluir turmas, conclua a trilha na UniLTS (cerca de 3 horas): Apresentação Institucional, Portfólio LTS, Políticas Corporativas, Metodologia Ativa de Ensino e o tutorial passo a passo desta plataforma. Aprovação com nota mínima 8,00.${t.status === "em_andamento" && t.progresso ? ` <b>Seu progresso: ${t.progresso.pct}%.</b>` : ""}</span></div>
      <button class="btn btn-primario" type="button" id="bt-trilha">${t.status === "em_andamento" ? "Continuar a trilha" : "Iniciar a trilha"}</button><p class="ava-aviso" id="trilha-msg" hidden></p></div>`;
  }
  document.addEventListener("click", async e => {
    const bt = e.target.closest("#bt-trilha"); if (!bt) return;
    bt.disabled = true; const r = await api("trilha_iniciar", { corpo: {} }); bt.disabled = false;
    if (!r.ok) return aviso("trilha-msg", "erro", r.mensagem);
    location.href = r.url;
  });

  /* ---------- início ---------- */
  async function inicio() {
    app.innerHTML = `<p class="vazio" style="padding:40px">Carregando…</p>`;
    const r = await api("resumo"); if (!r.ok) return;
    st.r = r;
    const nD = Object.keys(r.documentos).length, nF = Object.keys(r.fotos).length;
    const liberada = ["aprovada", "dispensada"].includes((r.trilha || {}).status); st.liberada = liberada;
    app.innerHTML = `<section class="ava-wrap portal-wrap">
      <div class="portal-cab"><div><p class="ava-eyebrow">Painel do Parceiro</p><h1>Olá, ${esc(r.parceiro.nome.split(" ")[0])}!</h1><p class="ava-mini">${esc([r.parceiro.qualificacao, r.parceiro.registro].filter(Boolean).join(" · "))}</p></div>
        <button class="btn btn-primario" type="button" id="bt-nova" ${liberada ? "" : "disabled title=\"Conclua a trilha obrigatória para criar turmas\""}>+ Nova turma presencial</button></div>
      ${cartaoTrilha(r.trilha || {})}
      <div id="nova" hidden></div>
      <div class="par-turmas">${r.turmas.map(t => `<a class="par-turma" href="#t/${t.id}">
        <div class="par-turma-cab"><b>${esc(t.codigo)}</b><span class="pchip ${t.concluida_parceiro ? "ok" : "and"}">${t.concluida_parceiro ? "Concluída" : "Em registro"}</span></div>
        <h2>${esc(t.curso)}</h2>
        <p class="ava-mini">${MOD[t.modalidade] || ""} · ${dataBR(t.inicio)}${t.fim && t.fim !== t.inicio ? " a " + dataBR(t.fim) : ""} · ${esc(t.local || "")}${t.empresa ? " · " + esc(t.empresa) : ""}</p>
        <div class="par-check"><span class="${t.participantes ? "ok" : ""}">${t.participantes ? IC.ok : IC.pend} ${t.participantes} participante(s)</span><span class="${t.docs_ok === nD ? "ok" : ""}">${t.docs_ok === nD ? IC.ok : IC.pend} Documentos ${t.docs_ok}/${nD}</span><span class="${t.fotos_ok === nF ? "ok" : ""}">${t.fotos_ok === nF ? IC.ok : IC.pend} Fotos ${t.fotos_ok}/${nF}</span>${t.concluida_parceiro ? `<span class="ok">${IC.ok} ${t.aprovados} aprovado(s)</span>` : ""}</div>
      </a>`).join("") || `<p class="vazio">${liberada ? "Nenhuma turma ainda. Clique em “+ Nova turma presencial” ou aguarde a LIPPMANN atribuir uma turma a você." : "Nenhuma turma ainda. Conclua a trilha obrigatória acima para liberar a criação de turmas."}</p>`}</div>
    </section>`;
    document.getElementById("bt-nova").onclick = () => {
      const n = document.getElementById("nova"); n.hidden = !n.hidden; if (n.hidden) return;
      n.innerHTML = `<form class="portal-cartao" id="f-nova"><h3>Nova turma</h3>
        <div class="pg-form">
          <label class="full">Curso<select id="n-curso">${r.cursos.map(c => `<option value="${esc(c.id)}">${esc(c.titulo)}</option>`).join("")}</select></label>
          <label>Modalidade<select id="n-mod"><option value="presencial">Presencial</option><option value="hibrido">Híbrida (Blended Learning): teoria e avaliação on-line + prática presencial</option></select></label>
          <label>Local<input id="n-local" placeholder="Endereço / empresa / sala"></label>
          <label>Data de início<input id="n-ini" type="date"></label><label>Data de término<input id="n-fim" type="date"></label>
          <label class="full">Observações<textarea id="n-obs" rows="2"></textarea></label>
        </div>
        <p class="ava-mini">O código da turma (TXXXXX-EAAAA) é gerado automaticamente na sequência oficial da LIPPMANN.</p>
        <p class="ava-aviso" id="n-msg" hidden></p><button class="btn btn-primario" type="submit">Criar turma</button></form>`;
      document.getElementById("f-nova").onsubmit = async e => {
        e.preventDefault();
        const x = await api("turma_salvar", { corpo: { curso_id: document.getElementById("n-curso").value, modalidade: document.getElementById("n-mod").value, local: document.getElementById("n-local").value, inicio: document.getElementById("n-ini").value, fim: document.getElementById("n-fim").value, observacoes: document.getElementById("n-obs").value } });
        if (!x.ok) return aviso("n-msg", "erro", x.mensagem);
        location.hash = `t/${x.id}`;
      };
    };
  }

  /* ---------- turma ---------- */
  async function turma(id, aba) {
    if (!st.t || st.t.turma.id !== id || !st.manter) {
      app.innerHTML = `<p class="vazio" style="padding:40px">Carregando…</p>`;
      const r = await api("turma", { query: { id } }); if (!r.ok) { app.innerHTML = `<p class="ava-aviso erro" style="margin:40px">${esc(r.mensagem)}</p>`; return; }
      st.t = r;
    }
    st.manter = false;
    const d = st.t, t = d.turma, fechada = !!t.concluida_parceiro;
    const ms = d.matriculas.filter(m => m.status !== "cancelado");
    const docsOk = Object.keys(d.documentos).filter(k => d.arquivos.some(a => a.categoria === "documento" && a.tipo === k)).length;
    const fotosOk = Object.keys(d.fotos).filter(k => d.arquivos.some(a => a.categoria === "foto" && a.tipo === k)).length;
    app.innerHTML = `<section class="ava-wrap portal-wrap">
      <a class="ava-voltar" href="#">${IC.volta} Minhas turmas</a>
      <div class="portal-cab"><div><p class="ava-eyebrow">${MOD[t.modalidade] || ""} · ${fechada ? "Concluída" : "Em registro"}</p><h1>${esc(t.codigo)}</h1><p class="ava-mini">${esc(d.curso.titulo)} · ${dataBR(t.inicio)}${t.fim && t.fim !== t.inicio ? " a " + dataBR(t.fim) : ""} · ${esc(t.local || "")}${d.empresa ? " · " + esc(d.empresa.nome_fantasia || d.empresa.razao_social) : ""}</p></div>
        <a class="btn btn-contorno" href="/integra/relatorio.html?turma=${t.id}" target="_blank" rel="noopener">${IC.doc} Relatório FR-DOC-18</a></div>
      <div class="portal-abas" role="tablist">${[["participantes", `Participantes e notas (${ms.length})`], ["documentos", `Documentos (${docsOk}/${Object.keys(d.documentos).length})`], ["fotos", `Evidências fotográficas (${fotosOk}/4)`], ["conclusao", "Conclusão"]].map(([k, l]) => `<a role="tab" href="#t/${t.id}/${k}" aria-selected="${aba === k}">${l}</a>`).join("")}</div>
      <div id="t-aba"></div></section>`;
    const alvo = document.getElementById("t-aba");
    ({ participantes: abaParticipantes, documentos: abaDocumentos, fotos: abaFotos, conclusao: abaConclusao })[aba] ? ({ participantes: abaParticipantes, documentos: abaDocumentos, fotos: abaFotos, conclusao: abaConclusao })[aba](alvo, d, fechada, ms, docsOk, fotosOk) : abaParticipantes(alvo, d, fechada, ms);
  }
  async function recarregar(aba, msgId, tipo, texto) { st.t = null; await turma(+location.hash.match(/^#t\/(\d+)/)[1], aba); if (texto) aviso(msgId, tipo, texto); }

  function abaParticipantes(alvo, d, fechada, ms) {
    const t = d.turma, hib = t.modalidade === "hibrido", corte = Number(d.curso.nota_corte || 7);
    alvo.innerHTML = `${fechada ? "" : `<form class="portal-cartao" id="f-part"><h3>Adicionar participante</h3>
        ${d.colaboradores && d.colaboradores.length ? `<label class="pg-form-l">Colaborador da empresa<select id="p-col"><option value="">— digitar manualmente —</option>${d.colaboradores.map(c => `<option value="${c.id}">${esc(c.nome)} · ${esc(c.cargo || "")}</option>`).join("")}</select></label>` : ""}
        <div class="pg-form" id="p-manual"><label class="full">Nome completo<input id="p-nome"></label><label>CPF<input id="p-cpf" inputmode="numeric" placeholder="000.000.000-00"></label><label>E-mail (opcional)<input id="p-email" type="email"></label><label class="full">Empresa (opcional)<input id="p-emp"></label></div>
        <p class="ava-aviso" id="p-msg" hidden></p><button class="btn btn-primario" type="submit">Adicionar</button></form>`}
      <div class="portal-cartao">
        <h3>Notas e presença</h3>
        <p class="ava-mini">Notas de 0 a 10 · aprovação com nota mínima ${String(corte).replace(".", ",")} na teórica e na prática${hib ? " (a teórica vem da avaliação EaD do aluno)" : ""}. Entrada e saída são exigidas pela NR 01 para comprovar a carga horária.</p>
        ${ms.length ? `<div class="portal-tabela"><table class="par-notas"><thead><tr><th>Participante</th><th>Teórica</th><th>Prática</th><th>Entrada</th><th>Saída</th><th>Situação</th>${fechada ? "" : "<th></th>"}</tr></thead><tbody>
          ${ms.map(m => `<tr data-m="${m.id}"><td><b>${esc(m.aluno.nome)}</b><small>CPF ${esc(m.aluno.cpf)}</small></td>
            <td>${hib ? `<span class="${m.nota_teorica >= corte ? "ok" : ""}">${m.nota_teorica !== null && m.nota_teorica !== undefined ? nota(m.nota_teorica) : `EaD ${m.progresso.pct}%`}</span>` : `<input class="n-te" inputmode="decimal" value="${nota(m.nota_teorica)}" ${fechada ? "disabled" : ""} aria-label="Nota teórica">`}</td>
            <td><input class="n-pr" inputmode="decimal" value="${nota(m.nota_pratica)}" ${fechada ? "disabled" : ""} aria-label="Nota prática"></td>
            <td><input class="n-en" type="datetime-local" value="${local(m.presenca_entrada)}" ${fechada ? "disabled" : ""} aria-label="Entrada"></td>
            <td><input class="n-sa" type="datetime-local" value="${local(m.presenca_saida)}" ${fechada ? "disabled" : ""} aria-label="Saída"></td>
            <td>${SIT[m.status] || m.status}${m.certificado ? `<br><a href="/unilts/certificado.html?c=${encodeURIComponent(m.certificado)}" target="_blank" rel="noopener">certificado</a>` : ""}</td>
            ${fechada ? "" : `<td><button class="pg-mini-x" type="button" data-rem="${m.id}" title="Remover participante">✕</button></td>`}</tr>`).join("")}
        </tbody></table></div>
        ${fechada ? "" : `<div class="ava-acoes"><button class="btn btn-contorno" type="button" id="bt-horario">Preencher entrada/saída de todos com o horário da turma</button><button class="btn btn-primario" type="button" id="bt-notas">Salvar notas e presença</button></div>`}
        <p class="ava-aviso" id="n-msg" hidden></p>` : `<p class="vazio">Nenhum participante adicionado.</p>`}
      </div>`;
    const f = document.getElementById("f-part");
    if (f) {
      const col = document.getElementById("p-col"); if (col) col.onchange = () => { document.getElementById("p-manual").hidden = !!col.value; };
      const cpf = document.getElementById("p-cpf"); cpf.oninput = () => { const x = cpf.value.replace(/\D/g, "").slice(0, 11); cpf.value = x.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); };
      f.onsubmit = async e => {
        e.preventDefault();
        const r = await api("participante_adicionar", { corpo: { turma_id: t.id, colaborador_id: col && col.value ? +col.value : null, nome: document.getElementById("p-nome").value.trim(), cpf: cpf.value, email: document.getElementById("p-email").value.trim(), empresa: document.getElementById("p-emp").value } });
        if (!r.ok) return aviso("p-msg", "erro", r.mensagem);
        recarregar("participantes", "p-msg", "ok", r.mensagem);
      };
    }
    alvo.querySelectorAll("[data-rem]").forEach(b => b.onclick = async () => { if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Remover?"; return; } const r = await api("participante_remover", { corpo: { id: +b.dataset.rem } }); if (r.ok) recarregar("participantes"); });
    const bh = document.getElementById("bt-horario");
    if (bh) bh.onclick = () => { const ini = (t.inicio || new Date().toISOString().slice(0, 10)) + "T08:00", fim = (t.fim || t.inicio || new Date().toISOString().slice(0, 10)) + "T" + String(8 + Math.min(10, Math.ceil(Number(d.curso.carga_horaria || 8)) + 1)).padStart(2, "0") + ":00"; alvo.querySelectorAll(".n-en").forEach(i => { if (!i.value) i.value = ini; }); alvo.querySelectorAll(".n-sa").forEach(i => { if (!i.value) i.value = fim; }); };
    const bn = document.getElementById("bt-notas");
    if (bn) bn.onclick = async () => {
      const notas = [...alvo.querySelectorAll("tr[data-m]")].map(tr => ({ id: +tr.dataset.m, nota_teorica: tr.querySelector(".n-te") ? tr.querySelector(".n-te").value : undefined, nota_pratica: tr.querySelector(".n-pr").value, entrada: tr.querySelector(".n-en").value ? new Date(tr.querySelector(".n-en").value).toISOString() : "", saida: tr.querySelector(".n-sa").value ? new Date(tr.querySelector(".n-sa").value).toISOString() : "" }));
      bn.disabled = true; const r = await api("notas_salvar", { corpo: { turma_id: t.id, notas } }); bn.disabled = false;
      if (!r.ok) return aviso("n-msg", "erro", r.mensagem);
      recarregar("participantes", "n-msg", "ok", r.mensagem);
    };
  }

  /* envio direto ao armazenamento privado, sem reduzir a imagem */
  async function enviar(t, categoria, tipo, arq, legenda, dim) {
    const up = await api("upload_url", { corpo: { turma_id: t.id, categoria, tipo, nome: arq.name, tamanho: arq.size, largura: dim.w, altura: dim.h } });
    if (!up.ok) throw new Error(up.mensagem);
    let caminho = up.caminho, previa = "";
    if (up.demo) previa = await previaDemo(arq, categoria);
    else {
      const fd = new FormData(); fd.append("cacheControl", "3600"); fd.append("", arq, arq.name);
      const h = { "x-upsert": "false" }; if (up.apikey) { h.apikey = up.apikey; h.Authorization = "Bearer " + up.apikey; }
      const r = await fetch(up.url, { method: "PUT", body: fd, headers: h });
      if (!r.ok) throw new Error("O envio falhou. Verifique a internet e tente de novo.");
    }
    const reg = await api("arquivo_registrar", { corpo: { turma_id: t.id, categoria, tipo, caminho, legenda, nome: arq.name, tamanho: arq.size, largura: dim.w, altura: dim.h, previa } });
    if (!reg.ok) throw new Error(reg.mensagem);
    return reg.mensagem;
  }
  async function previaDemo(arq, categoria) {   // demonstração: guarda só uma miniatura no navegador
    if (categoria !== "foto" && arq.type === "application/pdf") return "";
    const bmp = await createImageBitmap(arq); const k = Math.min(1, 900 / Math.max(bmp.width, bmp.height)); const cv = document.createElement("canvas");
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k); cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height); return cv.toDataURL("image/jpeg", .7);
  }
  async function dimensoes(arq) { if (!arq.type.startsWith("image/")) return { w: 0, h: 0 }; try { const b = await createImageBitmap(arq); return { w: b.width, h: b.height }; } catch (e) { return { w: 0, h: 0 }; } }

  function abaDocumentos(alvo, d, fechada) {
    const t = d.turma;
    alvo.innerHTML = `<div class="portal-cartao"><h3>Documentos legais digitalizados</h3><p class="ava-mini">Envie em PDF (preferencialmente) ou foto legível (JPG/PNG). Todos são obrigatórios para concluir a turma. Os arquivos ficam em armazenamento privado.</p>
      <div class="par-docs">${Object.entries(d.documentos).map(([k, rot]) => { const a = d.arquivos.find(x => x.categoria === "documento" && x.tipo === k);
        return `<div class="par-doc ${a ? "ok" : ""}"><div class="par-doc-ic">${a ? IC.ok : IC.doc}</div><div><b>${esc(rot)}</b><small>${a ? `${esc(a.nome_original || "arquivo")} · enviado em ${dataBR(a.criado)}` : "Pendente"}</small></div>
          <div class="par-doc-acoes">${a && a.url ? `<a class="btn btn-contorno" href="${esc(a.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}${fechada ? "" : `<label class="btn ${a ? "btn-contorno" : "btn-primario"}" style="cursor:pointer">${IC.subir} ${a ? "Adicionar" : "Enviar"}<input type="file" accept="application/pdf,image/jpeg,image/png" data-doc="${k}" hidden></label>`}${a && !fechada ? `<button class="pg-mini-x" type="button" data-x="${a.id}" title="Excluir">✕</button>` : ""}</div></div>`; }).join("")}</div>
      <p class="ava-aviso" id="d-msg" hidden></p></div>`;
    alvo.querySelectorAll("[data-doc]").forEach(inp => inp.onchange = async () => {
      const arq = inp.files[0]; if (!arq) return; aviso("d-msg", "info", "Enviando…");
      try { const m = await enviar(t, "documento", inp.dataset.doc, arq, "", await dimensoes(arq)); recarregar("documentos", "d-msg", "ok", m); } catch (e) { aviso("d-msg", "erro", e.message); }
    });
    alvo.querySelectorAll("[data-x]").forEach(b => b.onclick = async () => { if (!b.dataset.conf) { b.dataset.conf = 1; b.textContent = "Excluir?"; return; } const r = await api("arquivo_excluir", { corpo: { id: +b.dataset.x } }); if (r.ok) recarregar("documentos"); });
  }

  function abaFotos(alvo, d, fechada) {
    const t = d.turma;
    alvo.innerHTML = `<div class="portal-cartao"><h3>Evidências fotográficas</h3>
      <p class="ava-mini">As 4 fotos são obrigatórias, cada uma com a sua legenda fixa e uma descrição. Envie o <b>arquivo original da câmera em resolução total</b> (mínimo ${MIN} px no lado maior): fotos reenviadas por aplicativos de mensagem costumam ser comprimidas e são recusadas.</p>
      <div class="par-fotos">${Object.entries(d.fotos).map(([k, rot]) => { const a = d.arquivos.find(x => x.categoria === "foto" && x.tipo === k);
        return `<div class="par-foto ${a ? "ok" : ""}"><div class="par-foto-img">${a && a.url ? `<img src="${esc(a.url)}" alt="${esc(rot)}">` : `${IC.camera}<span>Foto pendente</span>`}</div>
          <div class="par-foto-txt"><b>${esc(rot)}</b>${a ? `<small>${esc((a.legenda || "").replace(rot + " · ", ""))}</small><small>${a.largura || "?"} × ${a.altura || "?"} px · ${a.bytes ? (a.bytes / 1048576).toFixed(1).replace(".", ",") + " MB" : ""}</small>` : ""}
          ${fechada ? "" : `<textarea rows="2" data-leg="${k}" placeholder="Descreva a foto (obrigatório): ex. turma de 12 participantes no galpão de manutenção">${a ? esc((a.legenda || "").replace(rot + " · ", "")) : ""}</textarea>
          <label class="btn ${a ? "btn-contorno" : "btn-primario"}" style="cursor:pointer">${IC.camera} ${a ? "Substituir foto" : "Enviar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" data-foto="${k}" hidden></label>`}</div></div>`; }).join("")}</div>
      <p class="ava-aviso" id="f-msg" hidden></p></div>`;
    alvo.querySelectorAll("[data-foto]").forEach(inp => inp.onchange = async () => {
      const arq = inp.files[0]; inp.value = ""; if (!arq) return;
      const leg = alvo.querySelector(`[data-leg="${inp.dataset.foto}"]`).value.trim();
      if (leg.length < 10) return aviso("f-msg", "erro", "Escreva a descrição da foto (mínimo de 10 caracteres) antes de enviar.");
      const dim = await dimensoes(arq);
      if (Math.max(dim.w, dim.h) < MIN) return aviso("f-msg", "erro", `Foto em resolução baixa (${dim.w} × ${dim.h} px). Envie o arquivo original da câmera, com no mínimo ${MIN} px no lado maior.`);
      aviso("f-msg", "info", `Enviando em resolução total (${dim.w} × ${dim.h} px)…`);
      try { const m = await enviar(t, "foto", inp.dataset.foto, arq, leg, dim); recarregar("fotos", "f-msg", "ok", m); } catch (e) { aviso("f-msg", "erro", e.message); }
    });
  }

  function abaConclusao(alvo, d, fechada, ms, docsOk, fotosOk) {
    const t = d.turma, hib = t.modalidade === "hibrido";
    const pend = ms.filter(m => m.nota_pratica === null || m.nota_pratica === undefined || (!hib && (m.nota_teorica === null || m.nota_teorica === undefined)) || !m.presenca_entrada || !m.presenca_saida).length;
    const itens = [[ms.length > 0, `Participantes adicionados (${ms.length})`], [ms.length > 0 && !pend, `Notas, entrada e saída de todos${pend ? ` (${pend} pendente(s))` : ""}`], [docsOk === Object.keys(d.documentos).length, `Documentos legais (${docsOk}/${Object.keys(d.documentos).length})`], [fotosOk === 4, `Evidências fotográficas com legenda (${fotosOk}/4)`]];
    const tudo = itens.every(x => x[0]);
    alvo.innerHTML = `<div class="portal-cartao"><h3>${fechada ? "Turma concluída" : "Conclusão da turma"}</h3>
      <ul class="par-lista">${itens.map(([ok, txt]) => `<li class="${ok ? "ok" : ""}">${ok ? IC.ok : IC.pend} ${txt}</li>`).join("")}</ul>
      ${fechada ? `<p class="ava-aviso ok">Concluída em ${dataBR(t.concluida_parceiro)}. Certificados dos aprovados emitidos automaticamente. Alterações só pela LIPPMANN.</p><p class="ava-aviso" id="c-msg" hidden></p>`
        : `<p class="ava-mini">Ao concluir, o sistema calcula o resultado (aprovado com teórica e prática a partir de ${String(Number(d.curso.nota_corte || 7)).replace(".", ",")}), emite os certificados com QR Code e fecha a turma para edição.</p>
        <p class="ava-aviso" id="c-msg" hidden></p>
        ${st.liberada === false ? `<p class="ava-aviso erro">Conclua a Trilha de Capacitação do Instrutor Parceiro (no início do painel) para concluir turmas.</p>` : ""}
        <button class="btn btn-primario" type="button" id="bt-concluir" ${tudo && st.liberada !== false ? "" : "disabled"}>${IC.ok} Concluir turma e emitir certificados</button>`}
      <div class="ava-acoes" style="margin-top:14px"><a class="btn btn-contorno" href="/integra/relatorio.html?turma=${t.id}" target="_blank" rel="noopener">${IC.doc} Relatório FR-DOC-18</a></div></div>`;
    const b = document.getElementById("bt-concluir");
    if (b) b.onclick = async () => {
      if (!confirm("Concluir a turma? Depois disso, notas, documentos e fotos não poderão ser alterados por você.")) return;
      b.disabled = true; const r = await api("concluir", { corpo: { turma_id: t.id } }); b.disabled = false;
      if (!r.ok) return aviso("c-msg", "erro", r.mensagem);
      recarregar("conclusao", "c-msg", "ok", r.mensagem);
    };
  }
})();
