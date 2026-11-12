/* LIPPMANN · carrossel de avaliações (Google Places API via /api/site?modulo=avaliacoes, cache de 24 h no servidor; depoimentos de reserva) */
(function () {
  const C = window.LTS_CONFIG || {}, G = (C.redes && C.redes.google) || {}, DEMO = C.api && C.api.modoDemonstracao;
  const $ = id => document.getElementById(id);
  const raiz = $("avaliacoes"); if (!raiz) return;
  const trilho = $("aval-trilho"), pontos = $("aval-pontos"), notaEl = $("aval-nota"), fonte = $("aval-fonte"), avaliar = $("aval-avaliar");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const estrelas = (n, cls = "") => `<span class="aval-estrelas ${cls}" role="img" aria-label="${String(n).replace(".", ",")} de 5 estrelas">${[1, 2, 3, 4, 5].map(i => `<i class="${n >= i ? "cheia" : n >= i - .5 ? "meia" : ""}">★</i>`).join("")}</span>`;
  const iniciais = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  const dataBR = d => d ? new Date(d).toLocaleDateString(document.documentElement.lang || "pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  avaliar.href = G.avaliarUrl || "https://g.page/r/CdmducEbhRvCEAE/review";   // link oficial de avaliação (sempre este)
  let atual = 0, timer = null;

  function cards() { return [...trilho.querySelectorAll(".aval-card")]; }
  function montarPontos() {
    pontos.innerHTML = cards().map((_, i) => `<button type="button" role="tab" aria-label="Avaliação ${i + 1}" data-i="${i}"></button>`).join("");
    pontos.querySelectorAll("button").forEach(b => b.onclick = () => { ir(+b.dataset.i); reiniciar(); });
    marcar();
  }
  function marcar() { pontos.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", i === atual)); }
  function ir(i) {
    const cs = cards(); if (!cs.length) return;
    atual = (i + cs.length) % cs.length;
    trilho.scrollTo({ left: cs[atual].offsetLeft - trilho.offsetLeft - parseFloat(getComputedStyle(trilho).paddingLeft || 0), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    marcar();
  }
  function reiniciar() { clearInterval(timer); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => ir(atual + 1), 6500); }
  $("aval-ant").onclick = () => { ir(atual - 1); reiniciar(); };
  $("aval-prox").onclick = () => { ir(atual + 1); reiniciar(); };
  ["mouseenter", "focusin", "touchstart"].forEach(ev => raiz.addEventListener(ev, () => clearInterval(timer), { passive: true }));
  ["mouseleave", "focusout"].forEach(ev => raiz.addEventListener(ev, reiniciar));
  let rolagem; trilho.addEventListener("scroll", () => { clearTimeout(rolagem); rolagem = setTimeout(() => {   // arrasto manual: acompanha o cartão visível
    const cs = cards(), x = trilho.scrollLeft; let m = 0, d = Infinity; cs.forEach((c, i) => { const dd = Math.abs(c.offsetLeft - trilho.offsetLeft - x); if (dd < d) { d = dd; m = i; } }); if (m !== atual) { atual = m; marcar(); } }, 120); }, { passive: true });
  trilho.addEventListener("keydown", e => { if (e.key === "ArrowRight") { e.preventDefault(); ir(atual + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); ir(atual - 1); } });

  function reserva() {
    if (G.notaReserva) { notaEl.hidden = false; notaEl.innerHTML = `<b>${esc(G.notaReserva)}</b>${estrelas(parseFloat(String(G.notaReserva).replace(",", ".")), "grande")}<small>no Google</small>`; }
    montarPontos(); reiniciar();
  }
  if (DEMO) return reserva();
  fetch((C.api && C.api.base || "/api/") + "site?modulo=avaliacoes").then(r => r.json()).then(j => {
    if (!j || !j.ok || !j.reviews || !j.reviews.length) return reserva();
    trilho.innerHTML = j.reviews.map(r => `<figure class="aval-card">
      <div class="aval-autor">${r.foto ? `<img class="aval-avatar" src="${esc(r.foto)}" alt="Foto de ${esc(r.nome)}" width="48" height="48" loading="lazy" referrerpolicy="no-referrer" data-ini="${esc(iniciais(r.nome))}">` : `<span class="aval-avatar">${esc(iniciais(r.nome))}</span>`}
        <div><b translate="no">${r.perfil ? `<a href="${esc(r.perfil)}" target="_blank" rel="noopener nofollow">${esc(r.nome)}</a>` : esc(r.nome)}</b><small>${estrelas(r.nota)} <span title="${esc(dataBR(r.data))}">${esc(r.relativo || dataBR(r.data))}</span></small></div></div>
      <blockquote translate="no" lang="pt-BR"><p>${esc(r.texto).replace(/\n+/g, "</p><p>")}</p></blockquote>
      ${r.link ? `<a class="aval-ver" href="${esc(r.link)}" target="_blank" rel="noopener">Ver no Google</a>` : ""}</figure>`).join("");
    trilho.querySelectorAll("img.aval-avatar").forEach(im => im.addEventListener("error", () => { const s = document.createElement("span"); s.className = "aval-avatar"; s.textContent = im.dataset.ini || "?"; im.replaceWith(s); }, { once: true }));   // foto indisponível: iniciais
    if (j.nota) { notaEl.hidden = false; notaEl.innerHTML = `<b>${String(j.nota.toFixed(1)).replace(".", ",")}</b>${estrelas(j.nota, "grande")}<small>${j.total ? `${j.total} avaliações no Google` : "no Google"}</small>`; }
    fonte.innerHTML = `Avaliações reais publicadas no perfil oficial no <a href="${esc(j.url || G.url || "#")}" target="_blank" rel="noopener">Google</a>, atualizadas automaticamente.`;
    montarPontos(); reiniciar();
  }).catch(reserva);
})();
