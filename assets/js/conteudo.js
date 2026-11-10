/* =====================================================================
   LIPPMANN · CONTEÚDO — cadastro obrigatório + visualização integrada
   1. O visitante preenche o cadastro → gravado no L³ INTEGRA + aviso à equipe.
   2. O acesso fica liberado neste navegador.
   3. Vídeo em tamanho grande, com opção de miniatura (flutuante) ou expandido.
   4. PDFs abrem página a página na tela, sem opção de download.
   Observação: em um site, esta trava é de captação de leads. Áreas com
   proteção total virão com a plataforma EAD (etapa 2).
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG, I = window.LTS_ICON;
  let MATS = window.LTS_CONTEUDOS || [];   // substituída pela lista do Supabase (/api/materiais) quando o servidor responde
  const CHAVE = "lts_acesso_conteudo";
  const AREAS = { todos: "Todos os materiais", treinamentos: "Treinamentos", solucoes: "Soluções" };
  const $ = id => document.getElementById(id);
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const ler = () => { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } };
  const gravar = v => { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) {} };
  let acesso = ler();
  let area = "todos";

  $("l-como").insertAdjacentHTML("beforeend", C.comoConheceu.map(o => `<option>${esc(o)}</option>`).join(""));

  const abas = $("abas-area");
  abas.innerHTML = Object.entries(AREAS).map(([k, v]) => `<button class="filtro" type="button" data-area="${k}" aria-pressed="${k === area}">${v}</button>`).join("");
  abas.addEventListener("click", e => {
    const b = e.target.closest("[data-area]"); if (!b) return;
    area = b.dataset.area;
    abas.querySelectorAll("[data-area]").forEach(x => x.setAttribute("aria-pressed", x === b));
    render();
  });

  function render() {
    const liberado = !!acesso;
    $("area-cadastro").hidden = liberado;
    const sd = $("saudacao");
    sd.hidden = !liberado;
    if (liberado) sd.innerHTML = `Acesso liberado para <b>${esc(acesso.nome)}</b>. <button type="button" id="sair" style="border:0;background:none;color:var(--azul-sinal);font:inherit;text-decoration:underline;cursor:pointer;padding:0">Não é você?</button>`;
    const itens = MATS.filter(m => area === "todos" || (m.area || "treinamentos") === area);
    $("biblioteca").innerHTML = itens.map(m => `
      <article class="mat">
        <div class="tipo"><span class="chip">${esc(AREAS[m.area] || "Treinamentos")}</span><span class="chip chip-claro">${esc(m.tipo)}</span>${m.tema ? `<span class="chip chip-claro">${esc(m.tema)}</span>` : ""}</div>
        <div style="display:grid;gap:8px;align-content:start"><h3>${esc(m.titulo)}</h3><p>${esc(m.resumo)}</p>
          <p class="meta">${m.arquivo ? `<span>Apostila/apresentação${m.paginas ? ` · ${m.paginas} páginas` : ""}</span>` : ""}${m.youtube ? `<span>Com vídeo-aula</span>` : ""}</p></div>
        <div>${liberado
          ? `<button class="btn btn-primario" type="button" data-abrir="${esc(m.id)}">Visualizar material</button>`
          : `<a class="btn btn-contorno" href="#area-cadastro"><span class="cadeado" style="color:inherit">${I.lock} Cadastre-se para visualizar</span></a>`}</div>
      </article>`).join("") || `<p class="vazio" style="grid-column:1/-1">Novos materiais desta área em breve.</p>`;
    const s = $("sair");
    if (s) s.addEventListener("click", () => { try { localStorage.removeItem(CHAVE); } catch (e) {} acesso = null; fechar(); render(); });
  }

  /* ---------- Cadastro ---------- */
  const form = $("form-lead"), aviso = form.querySelector(".form-aviso");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!window.LTS_VALIDAR(form)) { window.LTS_AVISO(aviso, "falha", "Confira os campos destacados em vermelho."); return; }
    const bt = form.querySelector("button[type=submit]");
    bt.disabled = true; bt.textContent = "Enviando…";
    const r = await window.LTS_API.registrar("lead", form, { _material: "Biblioteca Técnica" });
    bt.disabled = false; bt.textContent = "Liberar acesso aos materiais";
    if (r.ok) {
      acesso = { nome: $("l-nome").value.trim().split(" ")[0], data: new Date().toISOString() };
      gravar(acesso);
      render();
      $("biblioteca").scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.LTS_AVISO(aviso, "falha", r.mensagem ? esc(r.mensagem) : `Não foi possível concluir o cadastro agora. Tente novamente ou fale pelo WhatsApp <b>${C.contato.whatsappExibicao}</b>.`);
    }
  });

  /* ---------- Vídeo: normal / miniatura / expandido ---------- */
  const player = $("player"), tela = $("player-tela");
  function idYoutube(v) {
    if (!v) return "";
    const m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
    return m ? m[1] : (/^[\w-]{11}$/.test(v) ? v : "");
  }
  function modo(novo) {
    const atual = novo && player.classList.contains(novo);
    player.classList.remove("mini", "expandido");
    if (novo && !atual) player.classList.add(novo);
    $("bt-mini").setAttribute("aria-pressed", player.classList.contains("mini"));
    $("bt-expandir").setAttribute("aria-pressed", player.classList.contains("expandido"));
    $("bt-expandir").innerHTML = player.classList.contains("expandido") ? `${I.shrink} Reduzir` : `${I.expand} Expandir`;
    document.body.style.overflow = player.classList.contains("expandido") ? "hidden" : "";
  }
  $("bt-mini").addEventListener("click", () => modo("mini"));
  $("bt-expandir").addEventListener("click", () => modo("expandido"));
  $("bt-restaurar").addEventListener("click", () => modo(null));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && player.classList.contains("expandido")) modo("expandido"); });

  /* ---------- PDF (somente visualização) ---------- */
  let pdf = null, pagina = 1, zoom = 1, renderizando = false;
  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  async function desenhar() {
    if (!pdf || renderizando) return;
    renderizando = true;
    try {
      const pg = await pdf.getPage(pagina);
      const caixa = $("pdf-pag");
      const largura = Math.max(280, Math.min(caixa.clientWidth - 32, 1000));
      const base = pg.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      const vp = pg.getViewport({ scale: (largura / base.width) * zoom * dpr });
      const cv = document.createElement("canvas");
      cv.width = vp.width; cv.height = vp.height;
      cv.style.width = (vp.width / dpr) + "px";
      await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      caixa.innerHTML = ""; caixa.appendChild(cv);
      $("pdf-num").textContent = `${pagina} / ${pdf.numPages}`;
      $("pdf-ant").disabled = pagina <= 1;
      $("pdf-prox").disabled = pagina >= pdf.numPages;
    } finally { renderizando = false; }
  }

  async function abrir(id) {
    const m = MATS.find(x => x.id === id);
    if (!m || !acesso) return;
    window.LTS_API.evento("material", m.id);
    $("visualizador").hidden = false;
    $("vis-titulo").textContent = m.titulo;
    $("vis-tipo").textContent = [AREAS[m.area] || "Treinamentos", m.tipo, m.tema].filter(Boolean).join(" · ");
    const yt = idYoutube(m.youtube);
    player.hidden = !m.youtube;
    player.classList.remove("mini", "expandido");
    tela.querySelectorAll("iframe, .vazio-video").forEach(x => x.remove());
    if (m.youtube) {
      tela.insertAdjacentHTML("beforeend", yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1" title="Vídeo: ${esc(m.titulo)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : m.youtube === "EXEMPLO"
          ? `<div class="vazio-video">${I.play}<b style="color:#fff">Espaço da vídeo-aula (exemplo)</b><span>Cadastre o link do YouTube em L³ INTEGRA › Configurações › Materiais. Teste os botões Miniatura e Expandir.</span></div>`
          : `<div class="vazio-video">${I.play}<b style="color:#fff">Vídeo indisponível</b><span>Confira o link do YouTube cadastrado para este material.</span></div>`);
      window.LTS_API.evento("video", m.id);
    }
    $("vis-material").hidden = !m.arquivo;
    $("visualizador").scrollIntoView({ behavior: "smooth", block: "start" });
    if (m.arquivo) {
      $("pdf-pag").innerHTML = `<p class="carregando">Carregando material…</p>`;
      try {
        pdf = await pdfjsLib.getDocument({ url: m.arquivo }).promise;
        pagina = 1; zoom = 1; await desenhar();
      } catch (e) {
        $("pdf-pag").innerHTML = `<p class="carregando">Não foi possível abrir este material agora.</p>`;
      }
    }
  }
  function fechar() {
    $("visualizador").hidden = true;
    player.classList.remove("mini", "expandido");
    document.body.style.overflow = "";
    tela.querySelectorAll("iframe").forEach(x => x.remove());
    pdf = null;
  }

  document.addEventListener("click", e => { const b = e.target.closest("[data-abrir]"); if (b) abrir(b.dataset.abrir); });
  $("vis-fechar").addEventListener("click", () => { fechar(); $("biblioteca").scrollIntoView({ behavior: "smooth" }); });
  $("pdf-ant").addEventListener("click", () => { if (pagina > 1) { pagina--; desenhar(); } });
  $("pdf-prox").addEventListener("click", () => { if (pdf && pagina < pdf.numPages) { pagina++; desenhar(); } });
  $("pdf-mais").addEventListener("click", () => { zoom = Math.min(2.5, zoom + 0.25); desenhar(); });
  $("pdf-menos").addEventListener("click", () => { zoom = Math.max(0.5, zoom - 0.25); desenhar(); });
  document.addEventListener("keydown", e => {
    if ($("visualizador").hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight") $("pdf-prox").click();
    if (e.key === "ArrowLeft") $("pdf-ant").click();
  });
  let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(desenhar, 200); });

  render();
  if (!(C.api && C.api.modoDemonstracao)) {
    fetch(C.api.base + "materiais").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.ok && Array.isArray(j.materiais) && j.materiais.length) { MATS = j.materiais; render(); }
    }).catch(() => {});
  }
})();
