/* =====================================================================
   LIPPMANN · carrossel de avaliações (página inicial)
   - Fonte: /api/site?modulo=avaliacoes (Google Places API New, cache de 24 h no servidor).
   - Enquanto a API não responde "ok": true, mostra os depoimentos de reserva do index.html.
   - Carrossel circular: setas ‹ ›, bolinhas, arrastar com o dedo/mouse, teclado e troca automática
     (6,5 s; pausa ao passar o mouse ou tocar). Funciona com qualquer número de cartões e
     gira mesmo quando todos cabem na tela (desktop: 3 por vez · tablet: 2 · celular: 1).
   - O estilo do carrossel vem neste arquivo (não depende de alterar o style.css).
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG || {}, G = (C.redes && C.redes.google) || {};
  const DEMO = !!(C.api && C.api.modoDemonstracao);
  const $ = (id) => document.getElementById(id);
  const raiz = $("avaliacoes"); if (!raiz) return;
  const trilho = $("aval-trilho"), pontos = $("aval-pontos"), notaEl = $("aval-nota"), fonte = $("aval-fonte"), avaliar = $("aval-avaliar");
  const btAnt = $("aval-ant"), btProx = $("aval-prox");
  const AVALIAR = G.avaliarUrl || "https://g.page/r/CdmducEbhRvCEAE/review";
  if (avaliar) avaliar.href = AVALIAR;

  /* ---------- estilo do carrossel (substitui a rolagem nativa por deslizamento controlado) ---------- */
  if (!document.getElementById("aval-css")) {
    const css = document.createElement("style"); css.id = "aval-css";
    css.textContent = `
      #aval-trilho.aval-js{display:block;overflow:hidden;scroll-snap-type:none;padding:4px 2px 14px;touch-action:pan-y;cursor:grab;user-select:none}
      #aval-trilho.aval-js.arrastando{cursor:grabbing}
      #aval-trilho.aval-js .aval-faixa{display:flex;gap:22px;will-change:transform}
      #aval-trilho.aval-js .aval-faixa.animar{transition:transform .55s cubic-bezier(.22,.61,.36,1)}
      #aval-trilho.aval-js .aval-card{flex:0 0 calc((100% - 44px) / 3);scroll-snap-align:none}
      #aval-trilho.aval-js .aval-faixa.trocar{transition:opacity .25s;opacity:0}
      @media (max-width:980px){#aval-trilho.aval-js .aval-card{flex-basis:calc((100% - 22px) / 2)}}
      @media (max-width:640px){#aval-trilho.aval-js .aval-card{flex-basis:100%}}
      @media (prefers-reduced-motion:reduce){#aval-trilho.aval-js .aval-faixa.animar{transition:none}}
      .aval-seta:disabled{opacity:.35;cursor:default}
      img.aval-avatar{background:#E8EEF8}`;
    document.head.appendChild(css);
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const estrelas = (n, cls = "") => `<span class="aval-estrelas ${cls}" role="img" aria-label="${String(n).replace(".", ",")} de 5 estrelas">${[1, 2, 3, 4, 5].map((i) => `<i class="${n >= i ? "cheia" : n >= i - 0.5 ? "meia" : ""}">★</i>`).join("")}</span>`;
  const iniciais = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const dataBR = (d) => (d ? new Date(d).toLocaleDateString(document.documentElement.lang || "pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "");
  const semMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- montagem ---------- */
  trilho.classList.add("aval-js");
  const faixa = document.createElement("div"); faixa.className = "aval-faixa";
  [...trilho.children].forEach((c) => faixa.appendChild(c));
  trilho.appendChild(faixa);

  let atual = 0, timer = null, ocupado = false;
  const cartoes = () => [...faixa.querySelectorAll(".aval-card")];
  const total = () => cartoes().length;
  const passo = () => { const c = faixa.querySelector(".aval-card"); return c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(faixa).columnGap) || 22) : 0; };
  const porTela = () => (innerWidth <= 640 ? 1 : innerWidth <= 980 ? 2 : 3);

  function numerar() { cartoes().forEach((c, i) => { c.dataset.i = i; }); }
  function marcar() {
    pontos.querySelectorAll("button").forEach((b, i) => { b.setAttribute("aria-selected", String(i === atual)); b.tabIndex = i === atual ? 0 : -1; });
    const um = total() < 2; btAnt.disabled = um; btProx.disabled = um;
    cartoes().forEach((c, i) => c.setAttribute("aria-hidden", String(i >= porTela())));
  }
  function montarPontos() {
    numerar();
    pontos.innerHTML = cartoes().map((_, i) => `<button type="button" role="tab" aria-label="Avaliação ${i + 1}" data-i="${i}"></button>`).join("");
    marcar();
  }

  /* avança 1 cartão (circular): desliza e manda o primeiro para o fim */
  function proximo() {
    if (ocupado || total() < 2) return;
    ocupado = true;
    const fim = () => { faixa.classList.remove("animar"); faixa.appendChild(faixa.firstElementChild); faixa.style.transform = ""; atual = (atual + 1) % total(); marcar(); ocupado = false; };
    if (semMovimento()) return fim();
    faixa.classList.add("animar"); faixa.style.transform = `translateX(${-passo()}px)`;
    let feito = false; const pronto = () => { if (!feito) { feito = true; fim(); } };
    faixa.addEventListener("transitionend", pronto, { once: true }); setTimeout(pronto, 700);
  }
  /* volta 1 cartão: traz o último para o início e desliza de volta */
  function anterior() {
    if (ocupado || total() < 2) return;
    ocupado = true;
    faixa.classList.remove("animar"); faixa.insertBefore(faixa.lastElementChild, faixa.firstElementChild);
    atual = (atual - 1 + total()) % total();
    const fim = () => { faixa.classList.remove("animar"); faixa.style.transform = ""; marcar(); ocupado = false; };
    if (semMovimento()) return fim();
    faixa.style.transform = `translateX(${-passo()}px)`; void faixa.offsetWidth;
    faixa.classList.add("animar"); faixa.style.transform = "translateX(0px)";
    let feito = false; const pronto = () => { if (!feito) { feito = true; fim(); } };
    faixa.addEventListener("transitionend", pronto, { once: true }); setTimeout(pronto, 700);
  }
  /* bolinha: reordena para o cartão escolhido ficar primeiro (com transição suave) */
  function irPara(i) {
    if (ocupado || i === atual || total() < 2) return;
    ocupado = true; faixa.classList.add("trocar");
    setTimeout(() => {
      const alvo = cartoes().find((c) => +c.dataset.i === i);
      while (alvo && faixa.firstElementChild !== alvo) faixa.appendChild(faixa.firstElementChild);
      atual = i; marcar(); faixa.classList.remove("trocar"); ocupado = false;
    }, 250);
  }

  function parar() { clearInterval(timer); timer = null; }
  function reiniciar() { parar(); if (!semMovimento() && total() > 1) timer = setInterval(proximo, 6500); }

  btProx.addEventListener("click", () => { proximo(); reiniciar(); });
  btAnt.addEventListener("click", () => { anterior(); reiniciar(); });
  pontos.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) { irPara(+b.dataset.i); reiniciar(); } });
  trilho.setAttribute("tabindex", "0");
  trilho.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") { e.preventDefault(); proximo(); reiniciar(); } if (e.key === "ArrowLeft") { e.preventDefault(); anterior(); reiniciar(); } });
  raiz.addEventListener("mouseenter", parar); raiz.addEventListener("mouseleave", reiniciar);
  document.addEventListener("visibilitychange", () => (document.hidden ? parar() : reiniciar()));

  /* arrastar (dedo ou mouse) */
  let x0 = null, y0 = 0, dx = 0, horizontal = null;
  trilho.addEventListener("pointerdown", (e) => {
    if (ocupado || total() < 2 || (e.pointerType === "mouse" && e.button !== 0) || e.target.closest("a")) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; horizontal = null; parar();
  });
  trilho.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (horizontal === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) {
      horizontal = Math.abs(mx) > Math.abs(my);
      if (horizontal) { trilho.classList.add("arrastando"); try { trilho.setPointerCapture(e.pointerId); } catch (x) {} }
      else { x0 = null; return; }
    }
    if (!horizontal) return;
    dx = mx; faixa.classList.remove("animar"); faixa.style.transform = `translateX(${dx * 0.9}px)`;
  });
  const soltar = () => {
    if (x0 === null) return;
    const d = dx; x0 = null; trilho.classList.remove("arrastando");
    if (horizontal && Math.abs(d) > 45) { faixa.style.transform = ""; d < 0 ? proximo() : anterior(); }
    else if (horizontal) { faixa.classList.add("animar"); faixa.style.transform = ""; }
    horizontal = null; reiniciar();
  };
  trilho.addEventListener("pointerup", soltar); trilho.addEventListener("pointercancel", soltar);
  trilho.addEventListener("click", (e) => { if (Math.abs(dx) > 8) { e.preventDefault(); e.stopPropagation(); dx = 0; } }, true);
  addEventListener("resize", () => { faixa.style.transform = ""; marcar(); });

  /* ---------- dados ---------- */
  function notaReserva() {
    if (!G.notaReserva || !notaEl) return;
    notaEl.hidden = false;
    notaEl.innerHTML = `<b>${esc(G.notaReserva)}</b>${estrelas(parseFloat(String(G.notaReserva).replace(",", ".")), "grande")}<small>no Google</small>`;
  }
  function iniciar() { montarPontos(); reiniciar(); }

  function cartaoGoogle(r) {
    const nome = esc(r.nome || "Cliente Google");
    const avatar = r.foto
      ? `<img class="aval-avatar" src="${esc(r.foto)}" alt="Foto de ${nome}" width="48" height="48" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-ini="${esc(iniciais(r.nome))}">`
      : `<span class="aval-avatar" aria-hidden="true">${esc(iniciais(r.nome))}</span>`;
    const quando = r.relativo || dataBR(r.data);
    const paragrafos = esc(r.texto).split(/\n+/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");
    return `<figure class="aval-card">
      <div class="aval-autor">${avatar}
        <div><b translate="no">${r.perfil ? `<a href="${esc(r.perfil)}" target="_blank" rel="noopener nofollow">${nome}</a>` : nome}</b>
        <small>${estrelas(Number(r.nota) || 5)} <span title="${esc(dataBR(r.data))}">${esc(quando)}</span></small></div></div>
      <blockquote translate="no" lang="pt-BR">${paragrafos}</blockquote>
      ${r.link ? `<a class="aval-ver" href="${esc(r.link)}" target="_blank" rel="noopener">Ver no Google</a>` : ""}</figure>`;
  }

  function aplicarGoogle(j) {
    parar(); ocupado = false;
    faixa.style.transform = ""; faixa.classList.remove("animar", "trocar");
    faixa.innerHTML = j.reviews.map(cartaoGoogle).join("");
    faixa.querySelectorAll("img.aval-avatar").forEach((im) => {   // foto do Google indisponível: iniciais
      const trocar = () => { const s = document.createElement("span"); s.className = "aval-avatar"; s.setAttribute("aria-hidden", "true"); s.textContent = im.dataset.ini || "?"; im.replaceWith(s); };
      im.addEventListener("error", trocar, { once: true });
      if (im.complete && im.naturalWidth === 0 && im.getAttribute("src")) trocar();
    });
    if (typeof j.nota === "number" && notaEl) {
      notaEl.hidden = false;
      notaEl.innerHTML = `<b>${j.nota.toFixed(1).replace(".", ",")}</b>${estrelas(j.nota, "grande")}<small>${j.total ? `${Number(j.total).toLocaleString("pt-BR")} avaliações no Google` : "no Google"}</small>`;
    }
    if (fonte) fonte.innerHTML = `Avaliações reais publicadas no perfil oficial da LIPPMANN no <a href="${esc(j.url || G.url || AVALIAR)}" target="_blank" rel="noopener">Google</a>, atualizadas automaticamente.`;
    atual = 0; iniciar();
  }

  // 1) funciona já com os depoimentos de reserva
  notaReserva(); iniciar();
  // 2) troca pelos reais do Google assim que a API responder ok: true
  if (DEMO) return;
  fetch((C.api && C.api.base || "/api/") + "site?modulo=avaliacoes", { headers: { Accept: "application/json" }, cache: "no-store" })
    .then((r) => r.json())
    .then((j) => {
      if (j && j.ok && Array.isArray(j.reviews) && j.reviews.length) aplicarGoogle(j);
      else if (j && j.erro_google) console.warn("Avaliações do Google indisponíveis:", j.erro_google);
    })
    .catch((e) => console.warn("Avaliações do Google:", e));
})();
