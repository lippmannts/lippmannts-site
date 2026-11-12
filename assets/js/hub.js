/* LIPPMANN · HUB (lista de publicações + leitura do artigo em hub.html#slug) */
(function () {
  const C = window.LTS_CONFIG, I = window.LTS_ICON || {};
  const DEMO = C.api && C.api.modoDemonstracao;
  const TIPOS = { noticia: "Notícia", artigo: "Artigo técnico", transparencia: "Transparência" };
  const grid = document.getElementById("hub-grid"), lista = document.getElementById("hub-lista");
  const blocoArtigo = document.getElementById("hub-artigo"), artigo = document.getElementById("artigo");
  const filtros = document.getElementById("hub-filtros"), busca = document.getElementById("hub-busca");
  let itens = [], tipo = "todos";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const data = d => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const demoLS = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  /* no modo demonstração, mostra o que foi editado no painel deste navegador */
  const reserva = () => { const d = DEMO && demoLS("l3_demo_hub"); return d ? d.filter(x => x.publicado) : (window.LTS_HUB || []).slice(); };

  async function api(caminho) {
    const r = await fetch(C.api.base + caminho, { headers: { Accept: "application/json" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.erro || "falha");
    return j;
  }
  async function carregarLista() {
    if (DEMO) return reserva();
    try { return (await api("site?modulo=hub")).itens || []; } catch (e) { return reserva(); }
  }
  async function carregarItem(slug) {
    const local = reserva().find(x => x.slug === slug);
    if (DEMO) return local || null;
    try { return (await api("site?modulo=hub&slug=" + encodeURIComponent(slug))).item; } catch (e) { return local || null; }
  }

  function capa(p, cls) {
    return p.capa ? `<img src="${esc(p.capa)}" alt="" loading="lazy" width="640" height="360">`
      : p.youtube ? `<img src="https://i.ytimg.com/vi/${esc(p.youtube)}/hqdefault.jpg" alt="" loading="lazy" width="640" height="360">`
      : `<span class="sem"></span>`;
  }
  function card(p) {
    return `<a class="post" href="#${esc(p.slug)}" data-track="hub:${esc(p.slug)}">
      <span class="post-capa">${capa(p)}<span class="chip post-tipo">${TIPOS[p.tipo] || "Publicação"}</span></span>
      <span class="post-txt">
        <time datetime="${esc(p.publicado_em || "")}">${data(p.publicado_em)}</time>
        <h3>${esc(p.titulo)}</h3>
        ${p.resumo ? `<p>${esc(p.resumo)}</p>` : ""}
        ${(p.tags || []).length ? `<span class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</span>` : ""}
      </span></a>`;
  }
  function desenharFiltros() {
    const presentes = Object.keys(TIPOS).filter(k => itens.some(p => p.tipo === k));
    filtros.innerHTML = [["todos", "Todas"], ...presentes.map(k => [k, TIPOS[k]])].map(([k, v]) =>
      `<button class="filtro" type="button" data-tipo="${k}" aria-pressed="${k === tipo}">${v}</button>`).join("");
  }
  function desenharLista() {
    const q = semAcento(busca.value.trim());
    const vis = itens.filter(p => (tipo === "todos" || p.tipo === tipo) &&
      (!q || semAcento([p.titulo, p.resumo, ...(p.tags || [])].join(" ")).includes(q)));
    grid.innerHTML = vis.length ? vis.map(card).join("")
      : `<p class="vazio" style="grid-column:1/-1">${itens.length ? "Nenhuma publicação encontrada." : "Em breve, novas publicações por aqui. Cadastre-se na newsletter para ser avisado."}</p>`;
  }
  filtros.addEventListener("click", e => {
    const b = e.target.closest("[data-tipo]"); if (!b) return;
    tipo = b.dataset.tipo;
    filtros.querySelectorAll("[data-tipo]").forEach(x => x.setAttribute("aria-pressed", x === b));
    desenharLista();
  });
  busca.addEventListener("input", desenharLista);

  async function abrir(slug) {
    lista.hidden = true; blocoArtigo.hidden = false;
    artigo.innerHTML = `<p class="vazio">Carregando…</p>`;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    const p = await carregarItem(slug);
    if (!p) {
      artigo.innerHTML = `<p class="vazio">Publicação não encontrada.</p><p><a class="btn btn-contorno" href="hub.html">Voltar ao HUB</a></p>`;
      return;
    }
    const url = `${C.urlOficial || "https://lippmannts.com"}/hub.html#${p.slug}`;
    const txt = encodeURIComponent(`${p.titulo} · ${url}`);
    document.title = `${p.titulo} | HUB LIPPMANN`;
    artigo.innerHTML = `
      <p class="artigo-voltar"><a href="hub.html">← Todas as publicações</a></p>
      <header style="display:grid;gap:14px">
        <span class="chip" style="justify-self:start">${TIPOS[p.tipo] || "Publicação"}</span>
        <h1 style="color:var(--azul-lippmann);font-size:clamp(2.1rem,5vw,3.2rem);line-height:1.05">${esc(p.titulo)}</h1>
        ${p.resumo ? `<p class="lead" style="color:var(--cinza-aco)">${esc(p.resumo)}</p>` : ""}
        <div class="artigo-meta">${I.relogio || ""}<time datetime="${esc(p.publicado_em || "")}">${data(p.publicado_em)}</time>${p.autor ? `<span>Por <strong>${esc(p.autor)}</strong></span>` : ""}</div>
      </header>
      ${p.youtube ? `<div class="artigo-corpo"><iframe src="https://www.youtube.com/embed/${esc(p.youtube)}" title="Vídeo: ${esc(p.titulo)}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
        : p.capa ? `<figure class="artigo-capa"><img src="${esc(p.capa)}" alt="" width="1280" height="720"></figure>` : ""}
      <p class="so-pt-aviso">Este artigo está disponível somente em português.</p><div class="artigo-corpo" translate="no" lang="pt-BR">${p.corpo_html || ""}</div>
      ${(p.tags || []).length ? `<div class="tags">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="compartilhar">
        <strong style="font:600 .82rem var(--f-rotulo);margin-right:6px">${I.compartilhar || ""} Compartilhar</strong>
        <a class="btn btn-whats" href="https://wa.me/?text=${txt}" target="_blank" rel="noopener">${I.whatsapp || ""} WhatsApp</a>
        <a class="btn btn-contorno" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}" target="_blank" rel="noopener">${I.linkedin || ""} LinkedIn</a>
        <button class="btn btn-contorno" type="button" id="copiar-link">Copiar link</button>
      </div>`;
    const bt = document.getElementById("copiar-link");
    bt.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(url); bt.textContent = "Link copiado"; } catch (e) { prompt("Copie o link:", url); }
    });
  }
  function fechar() {
    blocoArtigo.hidden = true; lista.hidden = false;
    document.title = "HUB | LIPPMANN Treinamentos e Soluções";
  }
  function rota() {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (slug) abrir(slug); else fechar();
  }
  window.addEventListener("hashchange", rota);

  carregarLista().then(l => { itens = l; desenharFiltros(); desenharLista(); });
  rota();
})();
