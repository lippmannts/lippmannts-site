/* =====================================================================
   LIPPMANN · CATÁLOGO (Treinamentos e Soluções)
   Treinamentos: lidos do L³ INTEGRA (/api/catalogo); se o servidor não
   responder, usa a lista reserva em data/treinamentos.js.
   Soluções: data/solucoes.js.
   ===================================================================== */
(function () {
  "use strict";
  const I = window.LTS_ICON;
  let TR = window.LTS_TREINAMENTOS || [];
  const GERAL = window.LTS_TREINAMENTOS_GERAL || {};
  let SOL = window.LTS_SOLUCOES || [];
  let GRUPOS = window.LTS_SOLUCOES_GRUPOS || {};
  function carregarSolucoes() {   // soluções editadas no L³ INTEGRA; mantém a lista reserva se o servidor não responder
    const C = window.LTS_CONFIG || {};
    if (C.api && C.api.modoDemonstracao) {
      try { const d = JSON.parse(localStorage.getItem("l3_demo_sol") || "null"), g = JSON.parse(localStorage.getItem("l3_demo_sol_grupos") || "null"); if (d) SOL = d.filter(s => s.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)); if (g) GRUPOS = g; } catch (e) {}
      return Promise.resolve();
    }
    return fetch((C.api && C.api.base || "/api/") + "site?modulo=catalogo&tipo=solucoes").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.ok && Array.isArray(j.solucoes) && j.solucoes.length) { SOL = j.solucoes; if (j.grupos && Object.keys(j.grupos).length) GRUPOS = j.grupos; }
    }).catch(() => {});
  }
  const CATS = { normativo: "Normas Regulamentadoras", desenvolvimento: "Desenvolvimento e Cultura", emergencia: "Emergências" };
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const semAcento = t => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function cardTreinamento(t, comoLink) {
    const tag = comoLink ? "a" : "button";
    const attr = comoLink ? `href="treinamentos.html#${t.id}"` : `type="button" data-ficha="${t.id}"`;
    const chips = [t.nr ? `<span class="chip">${esc(t.nr)}</span>` : "", t.categoria === "emergencia" ? `<span class="chip chip-claro">Emergência</span>` : "", t.categoria === "desenvolvimento" ? `<span class="chip chip-claro">Desenvolvimento</span>` : ""].join("");
    const ch = t.carga_horaria && !/conforme/i.test(t.carga_horaria) ? `<span class="card-ch">${I.relogio || ""}${esc(t.carga_horaria)}</span>` : "";
    return `<${tag} class="card-tr" ${attr} style="text-decoration:none">
      <span class="chips">${chips}</span>
      <span class="foto"><img src="${esc(t.imagem || "/assets/img/marca/lipp-instrucao.webp")}" alt="" width="640" height="640" loading="lazy"></span>
      <h3>${esc(t.titulo)}</h3>
      <p>${esc(t.resumo)}</p>
      ${ch}
      <span class="mais">Saiba mais ${I.arrow}</span>
    </${tag}>`;
  }

  /* Carrega o catálogo editado no L³ INTEGRA; mantém a lista reserva se falhar */
  let carregado = null;
  function carregarCatalogo() {
    if (carregado) return carregado;
    const C = window.LTS_CONFIG || {};
    if (C.api && C.api.modoDemonstracao) {   // demonstração: usa o que foi editado no painel deste navegador
      try { const d = JSON.parse(localStorage.getItem("l3_demo_cat") || "null"); if (d) TR = d.filter(t => t.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)); } catch (e) {}
      return (carregado = Promise.resolve(TR));
    }
    carregado = fetch((C.api && C.api.base || "/api/") + "site?modulo=catalogo").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.ok && Array.isArray(j.treinamentos) && j.treinamentos.length) TR = j.treinamentos;
      return TR;
    }).catch(() => TR);
    return carregado;
  }

  function cardSolucao(s, n) {
    return `<article class="sol" id="${esc(s.id)}">
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
      if (e.cursos) extra = `<div><p style="margin-bottom:16px;color:var(--cinza-aco)">${esc(e.intro)}</p><div class="cursos">${e.cursos.map(c => `<div class="curso"><h4>${esc(c[0])}</h4><p>${esc(c[1])}</p></div>`).join("")}</div></div>`;
      if (e.grupos) extra = `<div><p style="margin-bottom:16px;color:var(--cinza-aco)">${esc(e.intro)}</p><div class="grupos-eq">${e.grupos.map(g => `<div class="caixa"><h4 style="margin-bottom:10px">${esc(g.nome)}</h4>${lista(g.itens)}</div>`).join("")}</div></div>`;
    }
    const msg = `Olá! Vim pelo site oficial da LIPPMANN e gostaria de uma proposta para o treinamento: ${t.titulo}.`;
    const yt = (() => { const m = String(t.youtube || "").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(t.youtube || "") ? t.youtube : ""); })();
    const pdf = t.ficha_pdf !== undefined ? t.ficha_pdf : ((window.LTS_CONFIG.downloads.pastaFichas || "/downloads/fichas/") + t.id + ".pdf");
    const secao = (titulo, corpo, aberto) => `<details class="ac-item"${aberto ? " open" : ""}><summary><span>${esc(titulo)}</span><i aria-hidden="true"></i></summary><div class="ac-corpo">${corpo}</div></details>`;
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
          <div class="ficha-resumo">
            ${t.carga_horaria ? `<span><small>Carga horária</small><b>${esc(t.carga_horaria)}</b></span>` : ""}
            ${t.modalidade ? `<span><small>Modalidade</small><b>${esc(t.modalidade)}</b></span>` : ""}
            <span><small>Certificado</small><b>Incluso</b></span>
          </div>
          ${yt ? `<div class="ficha-video"><iframe src="https://www.youtube.com/embed/${yt}?rel=0" title="Vídeo: ${esc(t.titulo)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>` : ""}
          <div class="acordeao">
            ${secao("O que você irá aprender", lista(t.aprender || []), true)}
            ${secao("Público-alvo", lista(t.publico || []))}
            ${secao("Pré-requisito", `<p>${esc(t.prerequisito)}</p>`)}
            ${t.atestado ? secao("Atestado", `<p>${esc(t.atestado)}</p>`) : ""}
            ${t.beneficios && t.beneficios.length ? secao("Benefícios para a organização", lista(t.beneficios)) : ""}
            ${extra ? secao(t.extra.titulo || "Cursos disponíveis", extra) : ""}
          </div>
          <div class="caixa-azul"><span class="rot">Por que investir nesse treinamento</span><p>${esc(t.porque)}</p></div>
          ${pdf ? `<a class="doc-mini" href="${esc(pdf)}" download="Ficha-Tecnica-LIPPMANN-${t.id}.pdf" data-track="download:ficha-${t.id}">
            <span class="doc-mini-capa"><img src="/assets/img/previews/fichas/${t.id}.webp" alt="" width="300" height="424" loading="lazy" onerror="this.src='/assets/img/previews/portfolio-treinamentos.webp'"><span class="doc-selo">PDF</span></span>
            <span class="doc-mini-txt"><b>Ficha técnica · ${esc(t.nr || t.titulo)}</b><small>PDF pronto para enviar ao cliente, com WhatsApp e contatos</small><span class="doc-mini-acao">${I.download} Baixar ficha</span></span>
          </a>` : ""}
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
    // troca pela versão do L³ INTEGRA assim que o servidor responder e só então abre a ficha do endereço (#id)
    const antes = TR;
    carregarCatalogo().then(() => { if (TR !== antes) render(); doHash(); });
  }

  /* ---------- Página de soluções ---------- */
  function paginaSolucoes() {
    const grid = document.getElementById("lista-solucoes");
    const filtros = document.getElementById("filtros-sol");
    let g = "todos";
    const desenharFiltros = () => {
      const usados = new Set(SOL.map(s => s.grupo)); if (g !== "todos" && !usados.has(g)) g = "todos";
      filtros.innerHTML = [["todos", "Todas"], ...Object.entries(GRUPOS).filter(([k]) => usados.has(k))].map(([k, v]) =>
        `<button class="filtro" type="button" data-g="${esc(k)}" aria-pressed="${k === g}">${esc(v)}</button>`).join("");
    };
    desenharFiltros();
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
    const antes = SOL;
    carregarSolucoes().then(() => { if (SOL !== antes) { desenharFiltros(); render(); } const id = location.hash.slice(1), el = id && document.getElementById(id); if (el) el.scrollIntoView({ block: "center" }); });
  }

  window.LTS_CATALOGO = {
    abrirFicha, paginaTreinamentos, paginaSolucoes,
    destaquesTreinamentos(el) {
      const ids = (el.dataset.ids || "").split(",");
      const desenhar = () => { el.innerHTML = ids.map(id => TR.find(t => t.id === id)).filter(Boolean).map(t => cardTreinamento(t, true)).join(""); };
      desenhar();
      carregarCatalogo().then(desenhar);
    },
    destaquesSolucoes(el) {
      const ids = (el.dataset.ids || "").split(",");
      el.innerHTML = ids.map(id => { const i = SOL.findIndex(s => s.id === id); return i < 0 ? "" : cardSolucao(SOL[i], i + 1); }).join("");
    }
  };
})();
