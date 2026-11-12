/* UniLTS · página pública (cursos EaD disponíveis) */
(function () {
  const C = window.LTS_CONFIG, I = window.LTS_ICON || {};
  const DEMO = C.api && C.api.modoDemonstracao;
  const el = document.getElementById("uni-lista");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const horas = h => { const n = Number(h) || 0; return `${String(n).replace(".", ",")} ${n === 1 ? "hora" : "horas"}`; };
  async function carregar() {
    if (DEMO && window.UNI_DEMO) return (await window.UNI_DEMO.aluno("cursos")).cursos || [];
    try { const r = await fetch(C.api.base + "uni?acao=cursos"); const j = await r.json(); return j.ok ? j.cursos : []; } catch (e) { return []; }
  }
  carregar().then(lista => {
    el.innerHTML = lista.length ? lista.map(c => `
      <article class="uni-curso">
        <div class="uni-curso-img">${c.imagem ? `<img src="${esc(c.imagem)}" alt="" width="132" height="132" loading="lazy">` : ""}</div>
        <div class="uni-curso-txt">
          <div class="tags">${c.nr ? `<span class="chip">${esc(c.nr)}</span>` : ""}<span class="chip chip-claro">EaD</span><span class="card-ch">${I.relogio || ""} ${horas(c.carga_horaria)}</span></div>
          <h3>${esc(c.titulo)}</h3>
          ${c.resumo ? `<p>${esc(c.resumo)}</p>` : ""}
          ${c.venda_online && Number(c.preco) > 0 ? `<p class="uni-preco">${Number(c.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} <small>à vista no PIX ou em até 12x no cartão</small></p>` : ""}
          <div class="uni-curso-acoes">
            ${c.venda_online && Number(c.preco) > 0 ? `<a class="btn btn-primario" href="/checkout.html?curso=${encodeURIComponent(c.id)}" data-track="unilts:comprar:${esc(c.id)}">${I.lock || ""} Matricular-se agora</a>` : ""}
            <a class="btn btn-whats" href="${window.LTS_WA("Olá! Vim pela UniLTS do site oficial da LIPPMANN e quero me matricular no curso EaD: " + c.titulo)}" target="_blank" rel="noopener" data-track="unilts:matricula:${esc(c.id)}">${I.whatsapp || ""} ${c.venda_online && Number(c.preco) > 0 ? "Dúvidas" : "Quero me matricular"}</a>
            <a class="btn btn-contorno" href="/unilts/index.html">Já sou aluno</a>
          </div>
        </div>
      </article>`).join("") : `<p class="vazio">Novos cursos EaD em breve. Fale com a nossa equipe pelo WhatsApp.</p>`;
  });
})();
