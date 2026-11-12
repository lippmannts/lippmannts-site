/* LIPPMANN · Políticas corporativas em cartões de pré-visualização (a-lippmann.html#politicas) */
(function () {
  const C = window.LTS_CONFIG, I = window.LTS_ICON || {};
  const grid = document.getElementById("politicas-grid");
  if (!grid) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const demoLS = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const DEMO = C.api && C.api.modoDemonstracao, editadas = DEMO && demoLS("l3_demo_pol");
  const reserva = () => (editadas ? editadas.filter(p => p.ativo !== false) : (window.LTS_POLITICAS || [])).map(p => ({ ...p, corpo: undefined }));

  function card(p) {
    const slug = esc(p.id);
    if (p.protegido) {
      return `<article class="doc doc-protegido">
        <a class="doc-capa" href="/termo-compromisso-social.html" data-track="politica:${slug}" aria-label="Ler: ${esc(p.titulo)}">
          <img src="${esc(p.capa || "/assets/img/previews/politicas/termo-compromisso-social.webp")}" alt="Capa: ${esc(p.titulo)}" width="420" height="594" loading="lazy">
          <span class="doc-selo">Protegido</span><span class="doc-olho">${I.eye || ""}</span>
        </a>
        <div class="doc-info">
          <span class="doc-ref">${esc(p.codigo || "")}${p.revisao ? " · " + esc(p.revisao) : ""}</span>
          <h3>${esc(p.titulo)}</h3>
          ${p.resumo ? `<p class="doc-meta" style="display:block">${esc(p.resumo)}</p>` : ""}
          <p class="doc-meta"><span>${I.escudo || ""} somente leitura em tela</span></p>
          <div class="doc-acoes"><a class="doc-bt doc-bt-pri" href="/termo-compromisso-social.html" data-track="politica:${slug}">${I.eye || ""} Ler o Termo</a></div>
        </div></article>`;
    }
    const arq = esc(p.arquivo || "#");
    return `<article class="doc">
      <a class="doc-capa" href="${arq}" target="_blank" rel="noopener" data-track="arquivo:${slug}" aria-label="Visualizar ${esc(p.titulo)} (PDF)">
        <img src="${esc(p.capa || "")}" alt="Capa: ${esc(p.titulo)}" width="420" height="594" loading="lazy">
        <span class="doc-selo">PDF</span><span class="doc-olho">${I.eye || ""}</span>
      </a>
      <div class="doc-info">
        <span class="doc-ref">${esc(p.codigo || "")}${p.revisao ? " · " + esc(p.revisao) : ""}</span>
        <h3>${esc(p.titulo)}</h3>
        ${p.resumo ? `<p class="doc-meta" style="display:block">${esc(p.resumo)}</p>` : ""}
        ${p.paginas ? `<p class="doc-meta"><span>${p.paginas} ${p.paginas == 1 ? "página" : "páginas"}</span></p>` : ""}
        <div class="doc-acoes">
          <a class="doc-bt doc-bt-pri" href="${arq}" download data-track="download:${slug}">${I.download || ""} Baixar PDF</a>
          <a class="doc-bt" href="${arq}" target="_blank" rel="noopener" data-track="arquivo:${slug}">${I.eye || ""} Visualizar</a>
        </div>
      </div></article>`;
  }
  function desenhar(lista) { grid.innerHTML = lista.map(card).join(""); }

  desenhar(reserva());
  if (!(C.api && C.api.modoDemonstracao)) {
    fetch(C.api.base + "site?modulo=politicas").then(r => r.json()).then(j => {
      if (j && j.ok && j.politicas && j.politicas.length) desenhar(j.politicas);
    }).catch(() => {});
  }
})();
