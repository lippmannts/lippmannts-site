/* =====================================================================
   LIPPMANN · CATÁLOGO (Treinamentos e Soluções)
   Lê os dados de data/treinamentos.js e data/solucoes.js e monta os
   cartões, os filtros e a ficha técnica. Não é preciso editar aqui
   para mudar textos: edite os arquivos da pasta data/.
   ===================================================================== */
(function () {
  "use strict";
  const I = window.LTS_ICON;
  const TR = window.LTS_TREINAMENTOS || [];
  const GERAL = window.LTS_TREINAMENTOS_GERAL || {};
  const SOL = window.LTS_SOLUCOES || [];
  const GRUPOS = window.LTS_SOLUCOES_GRUPOS || {};
  const CATS = { normativo: "Normas Regulamentadoras", desenvolvimento: "Desenvolvimento e Cultura", emergencia: "Emergências" };
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const semAcento = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function cardTreinamento(t, comoLink) {
    const tag = comoLink ? "a" : "button";
    const attr = comoLink ? `href="treinamentos.html#${t.id}"` : `type="button" data-ficha="${t.id}"`;
    const chips = [t.nr ? `<span class="chip">${esc(t.nr)}</span>` : "", t.categoria === "emergencia" ? `<span class="chip chip-claro">Emergência</span>` : "", t.categoria === "desenvolvimento" ? `<span class="chip chip-claro">Desenvolvimento</span>` : ""].join("");
    return `<${tag} class="card-tr" ${attr} style="text-decoration:none">
      <span class="chips">${chips}</span>
      <span class="foto"><img src="${esc(t.imagem)}" alt="" width="640" height="640" loading="lazy"></span>
      <h3>${esc(t.titulo)}</h3>
      <p>${esc(t.resumo)}</p>
      <span class="mais">Ficha técnica ${I.arrow}</span>
    </${tag}>`;
  }

  function cardSolucao(s, n) {
    return `<article class="sol" id="${s.id}">
      <span class="num">${String(n).padStart(2, "0")}</span>
      <h3>${esc(s.titulo)}</h3>
      <p>${esc(s.texto)}</p>
      <a class="sol-cta" href="${window.LTS_WA("Olá! Vim pelo site oficial da LIPPMANN e gostaria de uma proposta para: " + s.titulo)}" target="_blank" rel="noopener" data-track="solucao:${s.id}">Solicitar proposta ${I.arrow}</a>
    </article>`;
  }

  const lista = arr => `<ul class="lista-losango">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;

  /* ---------- Ficha técnica (painel lateral) ---------- */
  let ultimoFoco = null;
  function abrirFicha(id, atualizarHash = true) {
    const t = TR.find(x => x.id === id);
    if (!t) return;
    fecharFicha(false);
    ultimoFoco = document.activeElement;
    if (window.LTS_API) window.LTS_API.evento("ficha", t.id);
    let extra = "";
    if (t.extra) {
      const e = t.extra;
      if (e.cursos) extra = `<div><span class="rot">${esc(e.titulo)}</span><p style="margin-bottom:16px;color:var(--cinza-aco)">${esc(e.intro)}</p><div class="cursos">${e.cursos.map(c => `<div class="curso"><h4>${esc(c[0])}</h4><p>${esc(c[1])}</p></div>`).join("")}</div></div>`;
      if (e.grupos) extra = `<div><span class="rot">${esc(e.titulo)}</span><p style="margin-bottom:16px;color:var(--cinza-aco)">${esc(e.intro)}</p><div class="grupos-eq">${e.grupos.map(g => `<div class="caixa"><h4 style="margin-bottom:10px">${esc(g.nome)}</h4>${lista(g.itens)}</div>`).join("")}</div></div>`;
    }
    const msg = `Olá! Vim pelo site oficial da LIPPMANN e gostaria de uma proposta para o treinamento: ${t.titulo}.`;
    const el = document.createElement("div");
    el.className = "ficha-fundo";
    el.innerHTML = `
      <div class="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-titulo">
        <div class="ficha-topo">
          <div>
            ${t.norma ? `<p class="norma">${esc(t.norma)}</p>` : `<p class="norma">${esc(CATS[t.categoria] || "")}</p>`}
            <h2 id="ficha-titulo">${esc(t.titulo)}</h2>
            <p>${esc(t.resumo)}</p>
          </div>
          <button class="fechar" type="button" aria-label="Fechar ficha técnica">${I.close}</button>
        </div>
        <div class="ficha-corpo">
          <div class="ficha-cols">
            <div><span class="rot">O que você irá aprender</span>${lista(t.aprender)}</div>
            <div style="display:grid;gap:24px;align-content:start">
              <div><span class="rot">Público-alvo</span>${lista(t.publico)}</div>
              <div class="caixa"><span class="rot">Pré-requisito</span><p style="font-size:.93rem">${esc(t.prerequisito)}</p></div>
              ${t.atestado ? `<div class="caixa"><span class="rot">Atestado</span><p style="font-size:.93rem">${esc(t.atestado)}</p></div>` : ""}
            </div>
          </div>
          ${t.beneficios && t.beneficios.length ? `<div><span class="rot">Benefícios para a organização</span>${lista(t.beneficios)}</div>` : ""}
          ${extra}
          <div class="caixa-azul"><span class="rot">Por que investir nesse treinamento</span><p>${esc(t.porque)}</p></div>
          <a class="doc-mini" href="${(window.LTS_CONFIG.downloads.pastaFichas || "/downloads/fichas/") + t.id}.pdf" download="Ficha-Tecnica-LIPPMANN-${t.id}.pdf" data-track="download:ficha-${t.id}">
            <span class="doc-mini-capa"><img src="/assets/img/previews/fichas/${t.id}.webp" alt="" width="300" height="424" loading="lazy"><span class="doc-selo">PDF</span></span>
            <span class="doc-mini-txt"><b>Ficha técnica · ${esc(t.nr || t.titulo)}</b><small>PDF pronto para enviar ao cliente, com WhatsApp e contatos</small><span class="doc-mini-acao">${I.download} Baixar ficha</span></span>
          </a>
          <div class="ficha-acoes">
            <a class="btn btn-whats" href="${window.LTS_WA(msg)}" target="_blank" rel="noopener" data-track="whatsapp-proposta:${t.id}">${I.whatsapp} Solicitar proposta</a>
            <a class="btn btn-contorno" href="fale-conosco.html?assunto=TREINAMENTOS&ref=${encodeURIComponent(t.titulo)}">Enviar mensagem</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";
    el.addEventListener("click", e => { if (e.target === el) fecharFicha(); });
    el.querySelector(".fechar").addEventListener("click", () => fecharFicha());
    el.querySelector(".fechar").focus();
    if (atualizarHash && location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
  }
  function fecharFicha(limparHash = true) {
    const el = document.querySelector(".ficha-fundo");
    if (!el) return;
    el.remove();
    document.body.style.overflow = "";
    if (limparHash && location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape") fecharFicha(); });

  /* ---------- Página de treinamentos ---------- */
  function paginaTreinamentos() {
    const grid = document.getElementById("lista-treinamentos");
    const filtros = document.getElementById("filtros-tr");
    const busca = document.getElementById("busca-tr");
    const contador = document.getElementById("contador-tr");
    let cat = "todos";
    filtros.innerHTML = [["todos", "Todos"], ...Object.entries(CATS)].map(([k, v]) =>
      `<button class="filtro" type="button" data-cat="${k}" aria-pressed="${k === cat}">${v}</button>`).join("");
    function render() {
      const q = semAcento(busca.value.trim());
      const itens = TR.filter(t => (cat === "todos" || t.categoria === cat) &&
        (!q || semAcento([t.titulo, t.nr, t.norma, t.resumo, ...(t.publico || [])].join(" ")).includes(q)));
      grid.innerHTML = itens.length ? itens.map(t => cardTreinamento(t, false)).join("") :
        `<p class="vazio" style="grid-column:1/-1">Nenhum treinamento encontrado. Fale com a nossa equipe: desenvolvemos capacitações sob medida.</p>`;
      contador.textContent = `${itens.length} ${itens.length === 1 ? "treinamento" : "treinamentos"}`;
    }
    filtros.addEventListener("click", e => {
      const b = e.target.closest("[data-cat]"); if (!b) return;
      cat = b.dataset.cat;
      filtros.querySelectorAll("[data-cat]").forEach(x => x.setAttribute("aria-pressed", x === b));
      render();
    });
    busca.addEventListener("input", render);
    grid.addEventListener("click", e => { const b = e.target.closest("[data-ficha]"); if (b) abrirFicha(b.dataset.ficha); });
    render();

    // Informações gerais
    const info = document.getElementById("info-geral");
    if (info && GERAL.informacoes) {
      info.innerHTML = `
        <div><span class="rot">Informações gerais</span><table class="tabela-info"><tbody>${GERAL.informacoes.map(r => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>
        <div><span class="rot">Diferenciais da LIPPMANN</span>${lista(GERAL.diferenciais)}</div>
        <div><span class="rot">Itens inclusos</span>${lista(GERAL.inclusos)}</div>`;
      info.querySelectorAll(".lista-losango li").forEach(li => li.style.color = "var(--azul-gelo)");
    }

    const doHash = () => { const id = location.hash.slice(1); if (id && TR.some(t => t.id === id)) abrirFicha(id, false); else fecharFicha(false); };
    window.addEventListener("hashchange", doHash);
    doHash();
  }

  /* ---------- Página de soluções ---------- */
  function paginaSolucoes() {
    const grid = document.getElementById("lista-solucoes");
    const filtros = document.getElementById("filtros-sol");
    let g = "todos";
    filtros.innerHTML = [["todos", "Todas"], ...Object.entries(GRUPOS)].map(([k, v]) =>
      `<button class="filtro" type="button" data-g="${k}" aria-pressed="${k === g}">${v}</button>`).join("");
    function render() {
      grid.innerHTML = SOL.map((s, i) => ({ s, n: i + 1 })).filter(x => g === "todos" || x.s.grupo === g).map(x => cardSolucao(x.s, x.n)).join("");
    }
    filtros.addEventListener("click", e => {
      const b = e.target.closest("[data-g]"); if (!b) return;
      g = b.dataset.g;
      filtros.querySelectorAll("[data-g]").forEach(x => x.setAttribute("aria-pressed", x === b));
      render();
    });
    render();
  }

  window.LTS_CATALOGO = {
    abrirFicha, paginaTreinamentos, paginaSolucoes,
    destaquesTreinamentos(el) {
      const ids = (el.dataset.ids || "").split(",");
      el.innerHTML = ids.map(id => TR.find(t => t.id === id)).filter(Boolean).map(t => cardTreinamento(t, true)).join("");
    },
    destaquesSolucoes(el) {
      const ids = (el.dataset.ids || "").split(",");
      el.innerHTML = ids.map(id => { const i = SOL.findIndex(s => s.id === id); return i < 0 ? "" : cardSolucao(SOL[i], i + 1); }).join("");
    }
  };
})();
