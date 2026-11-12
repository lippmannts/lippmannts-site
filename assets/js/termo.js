/* LIPPMANN · Termo de Compromisso Social em exibição protegida
   Medidas de dissuasão: sem seleção, cópia, menu de contexto, arrastar, impressão
   ou salvar página; marca d'água com data e hora; véu quando a janela perde o foco.
   Observação: nenhum site consegue impedir 100% uma foto ou captura de tela do sistema. */
(function () {
  const C = window.LTS_CONFIG;
  const box = document.getElementById("termo");
  if (!box) return;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function marca() {
    const agora = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const t = `LIPPMANN · lippmannts.com<br>Somente leitura · ${agora}`;
    return `<div class="termo-marca" aria-hidden="true">${Array.from({ length: 24 }, () => `<span>${t}</span>`).join("")}</div>`;
  }
  function desenhar(p) {
    if (!p) { box.innerHTML = `<p class="vazio">Termo indisponível no momento.</p>`; return; }
    box.innerHTML = marca() + `
      <p class="doc-ref" style="margin-bottom:6px">${esc(p.codigo || "")}${p.revisao ? " · " + esc(p.revisao) : ""}</p>
      <h1 style="color:var(--azul-lippmann);font-size:clamp(2rem,4.5vw,2.8rem);line-height:1.05;margin-bottom:12px">${esc(p.titulo)}</h1>
      <div class="termo-corpo">${p.corpo || ""}</div>`;
  }
  const demoLS = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const editadas = C.api && C.api.modoDemonstracao && demoLS("l3_demo_pol");
  const local = editadas ? (x => x && { ...x, corpo: x.corpo_html })(editadas.find(p => p.protegido)) : (window.LTS_POLITICAS || []).find(p => p.protegido);
  desenhar(local);
  if (!(C.api && C.api.modoDemonstracao)) {
    fetch(C.api.base + "site?modulo=politicas").then(r => r.json()).then(j => {
      const p = j && j.ok && (j.politicas || []).find(x => x.protegido && x.corpo);
      if (p) desenhar(p);
    }).catch(() => {});
  }
  setInterval(() => { const m = box.querySelector(".termo-marca"); if (m) m.outerHTML = marca(); }, 60000);

  /* bloqueios */
  ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(ev =>
    document.addEventListener(ev, e => { if (box.contains(e.target) || ev !== "selectstart") e.preventDefault(); }));
  document.addEventListener("keydown", e => {
    const k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === "printscreen") { cobrir(); try { navigator.clipboard.writeText(""); } catch (x) {} e.preventDefault(); }
    if ((mod && ["c", "x", "s", "p", "a", "u"].includes(k)) || (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k)) || k === "f12") {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);
  window.addEventListener("beforeprint", cobrir);
  window.addEventListener("afterprint", descobrir);

  /* véu quando a página perde o foco (troca de aba, ferramentas de captura) */
  let veu = null;
  function cobrir() {
    if (veu) return;
    veu = document.createElement("div");
    veu.className = "termo-veu";
    veu.innerHTML = `<div><strong style="font-family:var(--f-rotulo);color:var(--azul-lippmann)">Documento protegido</strong><p style="margin-top:6px;color:var(--cinza-aco)">Clique aqui para continuar a leitura.</p></div>`;
    veu.addEventListener("click", descobrir);
    box.appendChild(veu);
  }
  function descobrir() { if (veu) { veu.remove(); veu = null; } }
  window.addEventListener("blur", cobrir);
  document.addEventListener("visibilitychange", () => { if (document.hidden) cobrir(); });
})();
