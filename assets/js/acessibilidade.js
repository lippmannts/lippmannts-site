/* =====================================================================
   LIPPMANN · ACESSIBILIDADE
   Barra flutuante (padrão de portais institucionais): tamanho da fonte,
   alto contraste, destaque de links, leitura em voz alta e VLibras (Libras).
   As escolhas ficam salvas no navegador do visitante.
   ===================================================================== */
(function () {
  "use strict";
  const html = document.documentElement;
  const get = (k, p) => { try { const v = localStorage.getItem("a11y_" + k); return v === null ? p : JSON.parse(v); } catch (e) { return p; } };
  const set = (k, v) => { try { localStorage.setItem("a11y_" + k, JSON.stringify(v)); } catch (e) {} };
  const st = { escala: get("escala", 100), contraste: get("contraste", false), links: get("links", false) };
  function aplicar() {
    html.style.setProperty("--escala", st.escala + "%");
    html.classList.toggle("a11y-contraste", !!st.contraste);
    html.classList.toggle("a11y-links", !!st.links);
  }
  aplicar();

  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONE = ic('<circle cx="12" cy="4" r="2"/><path d="M4 8l8 2 8-2M12 10v5m0 0l-3 6m3-6l3 6"/>');

  /* "Ir para o conteúdo" (primeiro item do teclado) */
  const pular = document.createElement("a");
  pular.href = "#conteudo-principal"; pular.className = "a11y-pular"; pular.textContent = "Ir para o conteúdo";
  document.body.prepend(pular);

  const raiz = document.createElement("div");
  raiz.className = "a11y";
  raiz.innerHTML = `
    <button type="button" class="a11y-abrir" aria-expanded="false" aria-controls="a11y-painel" title="Acessibilidade">${ICONE}<span>Acessibilidade</span></button>
    <div class="a11y-painel" id="a11y-painel" role="dialog" aria-label="Opções de acessibilidade" hidden>
      <p class="a11y-tit">Acessibilidade</p>
      <div class="a11y-grupo" role="group" aria-label="Tamanho do texto">
        <button type="button" data-a="menos" aria-label="Diminuir texto">A−</button>
        <button type="button" data-a="normal" aria-label="Texto em tamanho normal">A</button>
        <button type="button" data-a="mais" aria-label="Aumentar texto">A+</button>
      </div>
      <button type="button" class="a11y-op" data-a="contraste" aria-pressed="false">${ic('<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>')}Alto contraste</button>
      <button type="button" class="a11y-op" data-a="links" aria-pressed="false">${ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>')}Destacar links</button>
      <button type="button" class="a11y-op" data-a="ler" aria-pressed="false">${ic('<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>')}<span>Ler em voz alta</span></button>
      <button type="button" class="a11y-op" data-a="libras">${ic('<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 15a1.5 1.5 0 0 1 2.5-1.7L7 15"/>')}Libras (VLibras)</button>
      <button type="button" class="a11y-restaurar" data-a="restaurar">Restaurar padrão</button>
    </div>`;
  document.body.appendChild(raiz);
  const painel = raiz.querySelector(".a11y-painel"), abrir = raiz.querySelector(".a11y-abrir");
  const marcar = () => {
    raiz.querySelector('[data-a="contraste"]').setAttribute("aria-pressed", !!st.contraste);
    raiz.querySelector('[data-a="links"]').setAttribute("aria-pressed", !!st.links);
  };
  marcar();
  abrir.addEventListener("click", () => { const a = painel.hidden; painel.hidden = !a; abrir.setAttribute("aria-expanded", a); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !painel.hidden) { painel.hidden = true; abrir.setAttribute("aria-expanded", "false"); abrir.focus(); } });
  document.addEventListener("click", e => { if (!raiz.contains(e.target) && !painel.hidden) { painel.hidden = true; abrir.setAttribute("aria-expanded", "false"); } });

  /* leitura em voz alta (texto selecionado ou conteúdo principal) */
  let lendo = false;
  function ler(botao) {
    const sintese = window.speechSynthesis;
    if (!sintese) { botao.querySelector("span").textContent = "Leitura indisponível neste navegador"; return; }
    if (lendo) { sintese.cancel(); lendo = false; botao.setAttribute("aria-pressed", "false"); botao.querySelector("span").textContent = "Ler em voz alta"; return; }
    const sel = String(window.getSelection() || "").trim();
    const alvo = document.getElementById("conteudo-principal") || document.querySelector("main") || document.body;
    const texto = (sel || alvo.innerText || "").replace(/\s+/g, " ").slice(0, 30000);
    const partes = texto.match(/[^.!?]+[.!?]*/g) || [texto];
    const voz = sintese.getVoices().find(v => /pt(-|_)BR/i.test(v.lang)) || sintese.getVoices().find(v => /^pt/i.test(v.lang));
    lendo = true; botao.setAttribute("aria-pressed", "true"); botao.querySelector("span").textContent = "Parar leitura";
    partes.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t.trim());
      u.lang = "pt-BR"; if (voz) u.voice = voz; u.rate = 1;
      if (i === partes.length - 1) u.onend = () => { lendo = false; botao.setAttribute("aria-pressed", "false"); botao.querySelector("span").textContent = "Ler em voz alta"; };
      sintese.speak(u);
    });
  }

  /* VLibras (Governo Federal) — carregado sob demanda e lembrado para as próximas páginas */
  let vlibrasCarregado = false;
  function carregarVLibras(abrirJanela) {
    if (vlibrasCarregado) { if (abrirJanela) clicarVLibras(); return; }
    vlibrasCarregado = true;
    const box = document.createElement("div");
    box.setAttribute("vw", ""); box.className = "enabled";
    box.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(box);
    const sc = document.createElement("script");
    sc.src = "https://vlibras.gov.br/app/vlibras-plugin.js"; sc.async = true;
    sc.onload = () => { try { new window.VLibras.Widget("https://vlibras.gov.br/app"); if (abrirJanela) setTimeout(clicarVLibras, 1500); } catch (e) {} };
    document.body.appendChild(sc);
  }
  function clicarVLibras() { const b = document.querySelector("[vw-access-button]"); if (b) b.click(); }
  if (get("libras", false)) window.addEventListener("load", () => carregarVLibras(false));

  painel.addEventListener("click", e => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "mais") st.escala = Math.min(150, st.escala + 10);
    if (a === "menos") st.escala = Math.max(90, st.escala - 10);
    if (a === "normal") st.escala = 100;
    if (a === "contraste") st.contraste = !st.contraste;
    if (a === "links") st.links = !st.links;
    if (a === "ler") return ler(b);
    if (a === "libras") { set("libras", true); carregarVLibras(true); return; }
    if (a === "restaurar") { st.escala = 100; st.contraste = false; st.links = false; set("libras", false); }
    set("escala", st.escala); set("contraste", st.contraste); set("links", st.links);
    aplicar(); marcar();
  });
})();
