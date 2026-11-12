/* =====================================================================
   LIPPMANN · MULTI-IDIOMAS (pt-BR, pt-PT, en-US, en-GB, es-ES)
   - O site é escrito em português do Brasil (idioma de origem).
   - Ao escolher outro idioma, este script troca os textos da página usando
     os dicionários de /data/i18n/ e as traduções editadas no L³ INTEGRA
     (Site e conteúdo › Traduções). O que não tiver tradução fica em português.
   - Carregue no <head> de cada página: <script src="/assets/js/i18n.js"></script>
   - Para não traduzir um trecho, use translate="no" no elemento.
   ===================================================================== */
(function () {
  "use strict";
  const IDIOMAS = {
    "pt-BR": { nome: "Português (Brasil)", sigla: "PT-BR", og: "pt_BR", arquivo: null },
    "pt-PT": { nome: "Português (Portugal)", sigla: "PT-PT", og: "pt_PT", arquivo: "pt-pt" },
    "en-US": { nome: "English (US)", sigla: "EN-US", og: "en_US", arquivo: "en" },
    "en-GB": { nome: "English (UK)", sigla: "EN-GB", og: "en_GB", arquivo: "en" },
    "es-ES": { nome: "Español (España)", sigla: "ES", og: "es_ES", arquivo: "es" },
  };
  const ORIGEM = "pt-BR", CHAVE = "lts_idioma", VERSAO = "7.0.0";
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- 1. Qual idioma usar ---------- */
  function normalizar(c) {
    if (!c) return null;
    const x = String(c).replace("_", "-").toLowerCase();
    if (x === "pt-pt" || x === "pt-ao" || x === "pt-mz") return "pt-PT";
    if (x.startsWith("pt")) return "pt-BR";
    if (x === "en-gb" || x === "en-ie" || x === "en-au" || x === "en-nz" || x === "en-in" || x === "en-za") return "en-GB";
    if (x.startsWith("en")) return "en-US";
    if (x.startsWith("es")) return "es-ES";
    return IDIOMAS[c] ? c : null;
  }
  let idioma = null;
  try { const q = new URLSearchParams(location.search).get("lang"); if (q && normalizar(q)) { idioma = normalizar(q); ls.set(CHAVE, idioma); } } catch (e) {}
  if (!idioma) idioma = normalizar(ls.get(CHAVE));
  if (!idioma) idioma = normalizar((navigator.languages || [navigator.language || ""]).find(normalizar)) || ORIGEM;
  const INFO = IDIOMAS[idioma];
  const html = document.documentElement;
  html.setAttribute("data-idioma", idioma);

  const API = {
    idioma, idiomas: IDIOMAS, origem: ORIGEM, faltando: new Set(), pronto: null,
    t: (texto) => texto, // substituída abaixo quando o dicionário carrega
    trocar(novo) { if (!IDIOMAS[novo]) return; ls.set(CHAVE, novo); const u = new URL(location.href); u.searchParams.delete("lang"); location.href = u.toString(); },
    seletor, ligarSeletores,
  };
  window.LTS_I18N = API;

  /* ---------- 2. Seletor de idioma ---------- */
  const GLOBO = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
  function seletor(extraClasse) {
    return `<div class="idioma ${extraClasse || ""}" translate="no">
      <button type="button" class="idioma-bt" aria-haspopup="listbox" aria-expanded="false" title="Idioma / Language / Idioma">${GLOBO}<span>${INFO.sigla}</span></button>
      <ul class="idioma-lista" role="listbox" aria-label="Idioma / Language" hidden>
        ${Object.entries(IDIOMAS).map(([c, i]) => `<li role="option" aria-selected="${c === idioma}" data-idioma="${c}" tabindex="-1" lang="${c}">${i.nome}</li>`).join("")}
      </ul></div>`;
  }
  function ligarSeletores(raiz) {
    (raiz || document).querySelectorAll(".idioma:not([data-ligado])").forEach((el) => {
      el.setAttribute("data-ligado", "1");
      const bt = el.querySelector(".idioma-bt"), lista = el.querySelector(".idioma-lista");
      const abrir = (sim) => { lista.hidden = !sim; bt.setAttribute("aria-expanded", sim); if (sim) (lista.querySelector('[aria-selected="true"]') || lista.firstElementChild).focus(); };
      bt.addEventListener("click", (e) => { e.stopPropagation(); abrir(lista.hidden); });
      lista.addEventListener("click", (e) => { const li = e.target.closest("[data-idioma]"); if (li) API.trocar(li.dataset.idioma); });
      lista.addEventListener("keydown", (e) => {
        const itens = [...lista.children], i = itens.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); (itens[i + 1] || itens[0]).focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); (itens[i - 1] || itens[itens.length - 1]).focus(); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (itens[i]) API.trocar(itens[i].dataset.idioma); }
        else if (e.key === "Escape") { abrir(false); bt.focus(); }
      });
      document.addEventListener("click", () => abrir(false));
    });
  }
  const css = document.createElement("style");
  css.textContent = `.idioma{position:relative;display:inline-flex}
.idioma-bt{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:transparent;color:inherit;font:600 .74rem/1 Montserrat,Inter,system-ui,sans-serif;letter-spacing:.06em;cursor:pointer}
.idioma-bt:hover,.idioma-bt:focus-visible{background:rgba(255,255,255,.12);outline:none;border-color:#fff}
.idioma-lista{position:absolute;right:0;top:calc(100% + 6px);z-index:200;min-width:200px;margin:0;padding:6px;list-style:none;background:#fff;border-radius:12px;box-shadow:0 14px 34px rgba(0,30,80,.22);color:#0F1B2D}
.idioma-lista li{padding:10px 12px;border-radius:8px;font:500 .86rem/1.2 Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap;letter-spacing:0;text-transform:none}
.idioma-lista li:hover,.idioma-lista li:focus{background:#EEF3FC;outline:none}
.idioma-lista li[aria-selected="true"]{color:#0A3490;font-weight:700}
.idioma-lista li[aria-selected="true"]::after{content:" ✓"}
.ava-topo .idioma-ava{margin-left:auto}
.ava-topo .ava-usuario{margin-left:0}
@media (max-width:480px){.idioma-bt span{display:none}.idioma-bt{padding:0 8px}}
.idioma-claro .idioma-bt{border-color:#C9D3E6;color:#0A3490}
.idioma-claro .idioma-bt:hover,.idioma-claro .idioma-bt:focus-visible{background:#EEF3FC;border-color:#0A3490}
html.i18n-espera body{opacity:0}
.so-pt-aviso{display:none}
html:not([data-idioma="pt-BR"]) .so-pt-aviso{display:block}
p.so-pt-aviso:not(.ava-aviso){margin:0 0 18px;padding:12px 16px;border-radius:10px;background:#EEF3FC;color:#0A3490;font-size:.92rem}
body{transition:opacity .12s}`;
  (document.head || html).appendChild(css);

  function inserirSeletores() {   // barra superior do site e cabeçalho dos portais (AVA, Empresa, Parceiro)
    const u = document.querySelector(".util-redes"); if (u && !u.querySelector(".idioma")) u.insertAdjacentHTML("afterbegin", seletor());
    const a = document.querySelector(".ava-topo"); if (a && !a.querySelector(".idioma")) { const alvo = a.querySelector(".ava-usuario"); alvo ? alvo.insertAdjacentHTML("beforebegin", seletor("idioma-ava")) : a.insertAdjacentHTML("beforeend", seletor("idioma-ava")); }
    ligarSeletores();
  }
  document.readyState !== "loading" ? setTimeout(inserirSeletores) : document.addEventListener("DOMContentLoaded", inserirSeletores);
  if (idioma === ORIGEM) { API.pronto = Promise.resolve(); return; }

  /* ---------- 3. Carrega dicionário (sem piscar o português) ---------- */
  html.classList.add("i18n-espera");
  const mostrar = () => html.classList.remove("i18n-espera");
  setTimeout(mostrar, 2500);
  const base = (document.currentScript && document.currentScript.src || "").replace(/\bassets\/js\/i18n\.js.*$/, "");
  const DIC = (window.LTS_I18N_DIC = window.LTS_I18N_DIC || {});
  function carregarScript(src) { return new Promise((ok) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ok; (document.head || html).appendChild(s); }); }
  function extras() {   // traduções editadas no L³ INTEGRA (Site e conteúdo › Traduções)
    const C = window.LTS_CONFIG || {};
    const demo = (C.api && C.api.modoDemonstracao) || /claude\.ai|claudeusercontent|localhost:89/.test(location.host);
    if (demo) { try { return Promise.resolve((JSON.parse(ls.get("l3_demo_i18n") || "{}") || {})[idioma] || {}); } catch (e) { return Promise.resolve({}); } }
    return fetch((C.api && C.api.base || "/api/") + "i18n?l=" + idioma).then((r) => (r.ok ? r.json() : null)).then((j) => (j && j.ok && j.textos) || {}).catch(() => ({}));
  }
  const dom = new Promise((ok) => (document.readyState !== "loading" ? ok() : document.addEventListener("DOMContentLoaded", ok)));
  API.pronto = Promise.all([carregarScript(base + "data/i18n/" + INFO.arquivo + ".js?v=" + VERSAO), dom.then(extras)]).then(([, ext]) => {
    const fam = INFO.arquivo === "en" ? "en" : INFO.arquivo;
    const pacote = DIC[fam] || { textos: {}, padroes: [] };
    let textos = pacote.textos || {};
    if (idioma === "en-GB") textos = Object.assign({}, textos, pacote.gb || {});
    textos = Object.assign({}, textos, ext);
    let ajustar = (s) => s;
    if (idioma === "en-GB") ajustar = britanico;
    if (idioma === "pt-PT") ajustar = europeu;
    const padroes = (pacote.padroes || []).map(([re, sub]) => [new RegExp("^" + re + "$", "u"), sub]);
    const cache = new Map();
    let minusc = null;
    function numero(n) {   // inglês: 1.234,56 → 1,234.56 · en-US: 25/12/2026 → 12/25/2026
      if (INFO.arquivo !== "en") return n;
      if (/^\d{1,3}(\.\d{3})*,\d+$/.test(n)) return n.replace(/\./g, "#").replace(",", ".").replace(/#/g, ",");
      if (/^\d+,\d+$/.test(n)) return n.replace(",", ".");
      if (idioma === "en-US" && /^\d{2}\/\d{2}\/\d{4}$/.test(n)) { const [d, m, a] = n.split("/"); return `${m}/${d}/${a}`; }
      return n;
    }
    function t(original) {
      const k = String(original).replace(/\s+/g, " ").trim();
      if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return null;
      if (cache.has(k)) return cache.get(k);
      let r = Object.prototype.hasOwnProperty.call(textos, k) ? textos[k] : null;
      if (r == null) for (const [re, sub] of padroes) { const m = k.match(re); if (m) { r = typeof sub === "function" ? sub(m, t) : k.replace(re, sub); break; } }
      if (r == null) {
        const sem = k.replace(/[.:!?…]+$/, ""), fim = k.slice(sem.length);   // tenta sem a pontuação final
        if (fim && Object.prototype.hasOwnProperty.call(textos, sem)) r = textos[sem] + fim;
      }
      if (r == null && /\d/.test(k)) {   // textos com números: "3 de 8 aulas" usa a chave "{0} de {1} aulas"
        const nums = []; const modelo = k.replace(/\d+(?:[.,:/]\d+)*/g, (n) => "{" + (nums.push(n) - 1) + "}");
        if (Object.prototype.hasOwnProperty.call(textos, modelo)) r = textos[modelo].replace(/\{(\d+)\}/g, (m, i) => numero(nums[+i] ?? ""));
      }
      if (r == null && /^[/›·•|]\s/.test(k)) { const x = t(k.slice(2)); if (x != null) return k.slice(0, 2) + x; }   // "/ Soluções" (trilha)
      if (r == null && k.length > 3 && k === k.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(k)) {   // TÍTULOS EM CAIXA ALTA
        if (!minusc) { minusc = new Map(); for (const c in textos) minusc.set(c.toLocaleLowerCase("pt-BR"), textos[c]); }
        const x = minusc.get(k.toLocaleLowerCase("pt-BR")); if (x != null) r = x.toLocaleUpperCase(idioma);
      }
      if (r == null && idioma === "pt-PT") r = k;  // pt-PT parte do original e só aplica as adaptações
      if (r == null) { API.faltando.add(k); cache.set(k, null); return null; }
      r = ajustar(r); cache.set(k, r); return r;
    }
    API.t = (s) => t(s) || s;
    const ATRIBUTOS = ["placeholder", "title", "aria-label", "alt"];
    traduzirTudo();
    observar();
    ligarSeletores();
    mostrar();
    // título, descrição e idioma da página
    html.lang = idioma;
    document.querySelectorAll('meta[property="og:locale"]').forEach((m) => m.setAttribute("content", INFO.og));

    /* ---------- 4. Tradução do DOM ---------- */
    function pular(el) { return !el || el.closest('script,style,noscript,textarea,code,pre,[translate="no"],.notranslate,[contenteditable="true"]'); }
    function noTexto(n) {
      const atual = n.nodeValue; if (!atual || !/[A-Za-zÀ-ÿ]/.test(atual)) return;
      const reg = n.__lts;
      const orig = reg && atual === reg.tr ? reg.pt : atual;
      if (reg && atual === reg.tr) return;
      if (pular(n.parentElement)) return;
      const r = t(orig); if (r == null) return;
      const ini = orig.match(/^\s*/)[0], fim = orig.match(/\s*$/)[0], novo = ini + r + fim;
      n.__lts = { pt: orig, tr: novo };
      if (novo !== atual) n.nodeValue = novo;
    }
    function noElemento(el) {
      if (pular(el.tagName === "TEXTAREA" ? el.parentElement : el)) return;
      for (const a of ATRIBUTOS) {
        if (!el.hasAttribute(a)) continue;
        const v = el.getAttribute(a), marca = "__lts_" + a, reg = el[marca];
        if (reg && v === reg.tr) continue;
        const r = t(v); if (r == null) continue;
        el[marca] = { pt: v, tr: r }; el.setAttribute(a, r);
      }
      if (el.tagName === "INPUT" && /^(submit|button|reset)$/i.test(el.type) && el.value) { const r = t(el.value); if (r) el.value = r; }
    }
    function percorrer(raiz) {
      if (raiz.nodeType === 3) return noTexto(raiz);
      if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
      if (raiz.nodeType === 1) { if (raiz.tagName === "TEXTAREA") return noElemento(raiz); if (pular(raiz)) return; noElemento(raiz); }
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.nodeType === 1 && n.tagName === "TEXTAREA" && (noElemento(n), false)) || (n.nodeType === 1 && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE)$/.test(n.tagName)) || (n.nodeType === 1 && n.getAttribute("translate") === "no") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      let n; while ((n = w.nextNode())) n.nodeType === 3 ? noTexto(n) : noElemento(n);
    }
    function traduzirTudo() {
      percorrer(document.body);
      const tt = document.querySelector("title"); if (tt) { const r = t(tt.textContent); if (r) document.title = r; }
      const d = document.querySelector('meta[name="description"]'); if (d) { const r = t(d.content); if (r) d.content = r; }
    }
    function observar() {
      let fila = new Set(), agendado = false;
      const processar = () => { agendado = false; const f = fila; fila = new Set(); f.forEach((n) => n.isConnected && percorrer(n)); };
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === "characterData") fila.add(m.target);
          else if (m.type === "attributes") fila.add(m.target);
          else m.addedNodes.forEach((n) => fila.add(n));
        }
        if (!agendado) { agendado = true; (window.queueMicrotask || setTimeout)(processar); }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
      new MutationObserver(() => { const tt = document.querySelector("title"); if (tt && tt.__lts !== document.title) { const r = t(tt.textContent); if (r && r !== document.title) { tt.__lts = r; document.title = r; } } })
        .observe(document.querySelector("title") || document.head, { childList: true, characterData: true, subtree: true });
    }
  });

  /* ---------- 5. Variantes regionais ---------- */
  function trocaPalavras(s, mapa) {
    return s.replace(mapa.re, (w) => {
      const k = w.toLowerCase(), r = mapa.dic[k]; if (!r) return w;
      if (w === w.toUpperCase() && w.length > 1) return r.toUpperCase();
      if (w[0] === w[0].toUpperCase()) return r[0].toUpperCase() + r.slice(1);
      return r;
    });
  }
  function criarMapa(dic) { const ks = Object.keys(dic).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); return { dic, re: new RegExp("(?<![\\p{L}\\-])(" + ks.join("|") + ")(?![\\p{L}])", "giu") }; }
  /* inglês britânico a partir do americano */
  let GB = null;
  function britanico(s) {
    if (!GB) {
      const d = { center: "centre", centers: "centres", centered: "centred", color: "colour", colors: "colours", behavior: "behaviour", behaviors: "behaviours", behavioral: "behavioural", labor: "labour", favor: "favour", favorable: "favourable", honor: "honour", catalog: "catalogue", catalogs: "catalogues", program: "programme", programs: "programmes", license: "licence", licenses: "licences", enroll: "enrol", enrolls: "enrols", enrollment: "enrolment", enrollments: "enrolments", canceled: "cancelled", canceling: "cancelling", cancelation: "cancellation", defense: "defence", fulfill: "fulfil", fulfillment: "fulfilment", gray: "grey", aluminum: "aluminium", inquiry: "enquiry", inquiries: "enquiries", "zip code": "postcode", "cell phone": "mobile phone", cellphone: "mobile phone", "e-mail": "email", analyze: "analyse", analyzed: "analysed", analyzes: "analyses", analyzing: "analysing", paralyze: "paralyse", traveled: "travelled", traveling: "travelling", modeling: "modelling", labeled: "labelled", labeling: "labelling", fueled: "fuelled", jewelry: "jewellery", meter: "metre", meters: "metres", liter: "litre", liters: "litres", practicing: "practising", "check out": "check out", math: "maths", resume: "CV", résumé: "CV", résumés: "CVs" };
      GB = criarMapa(d);
    }
    let r = trocaPalavras(s, GB);
    // -ize/-ization → -ise/-isation (exceto size, seize, prize, capsize…)
    r = r.replace(/\b([A-Za-z]{2,})iz(e|es|ed|ing|ation|ations|ational|ationally|er|ers)\b/g, (w, raiz, suf) => (/^(s|se|pr|caps)$/i.test(raiz) ? w : raiz + "is" + suf));
    return r;
  }
  /* "treinamento" (masculino) vira "formação" (feminino): ajusta artigos e pronomes junto */
  function generoTreinamento() {
    const m = { "": "", o: "a", os: "as", do: "da", dos: "das", no: "na", nos: "nas", ao: "à", aos: "às", um: "uma", uns: "umas", este: "esta", estes: "estas", esse: "essa", esses: "essas", deste: "desta", destes: "destas", desse: "dessa", nesse: "nessa", neste: "nesta", nosso: "nossa", nossos: "nossas", seu: "sua", seus: "suas", pelo: "pela", pelos: "pelas", qual: "qual", próximo: "próxima", próximos: "próximas", novo: "nova", novos: "novas", "o seu": "a sua", "os seus": "as suas", "do seu": "da sua", "no seu": "na sua" };
    const r = {};
    for (const [a, b] of Object.entries(m)) { const p = a ? a + " " : "", q = b ? b + " " : ""; r[p + "treinamento"] = q + "formação"; if (!/^(um|este|esse|deste|desse|nesse|neste|nosso|seu|qual|próximo|novo|o seu|do seu|no seu)$/.test(a)) r[p + "treinamentos"] = q + "formações"; }
    r["treinamento"] = "formação"; r["treinamentos"] = "formações";
    return r;
  }
  /* português europeu a partir do brasileiro (vocabulário e acentuação) */
  let PT = null;
  function europeu(s) {
    const pacote = (window.LTS_I18N_DIC || {})["pt-pt"] || {};
    if (!PT) PT = criarMapa(Object.assign({
      equipe: "equipa", equipes: "equipas", cadastro: "registo", cadastros: "registos", cadastrar: "registar", cadastre: "registe", "cadastre-se": "registe-se", cadastrado: "registado", cadastrada: "registada", cadastrados: "registados", cadastradas: "registadas",
      registro: "registo", registros: "registos", registrar: "registar", registrado: "registado", registrada: "registada", registrados: "registados", registre: "registe", registra: "regista",
      celular: "telemóvel", celulares: "telemóveis", arquivo: "ficheiro", arquivos: "ficheiros", tela: "ecrã", telas: "ecrãs", usuário: "utilizador", usuários: "utilizadores", usuária: "utilizadora",
      senha: "palavra-passe", senhas: "palavras-passe", baixar: "descarregar", baixe: "descarregue", contato: "contacto", contatos: "contactos", fato: "facto", fatos: "factos", conosco: "connosco",
      ...generoTreinamento(), gerenciamento: "gestão", gerenciar: "gerir", planejamento: "planeamento", planejar: "planear", planejado: "planeado", planejados: "planeados", planejadas: "planeadas",
      planilha: "folha de cálculo", planilhas: "folhas de cálculo", "a tela": "o ecrã", "na tela": "no ecrã", "da tela": "do ecrã", "nesta tela": "neste ecrã", "esta tela": "este ecrã", estresse: "stress", câmera: "câmara", aluguel: "aluguer", ônibus: "autocarro", "a gente": "nós",
      "baixar pdf": "descarregar PDF", "site oficial": "site oficial", ótimo: "ótimo", econômico: "económico", "e-mail": "e-mail", mouse: "rato", deletar: "eliminar", "salvar em pdf": "guardar em PDF", salvar: "guardar", salvo: "guardado", salva: "guardada",
      acessar: "aceder", acesse: "aceda", acessa: "acede", acessam: "acedem", tchau: "adeus", gramado: "relvado", trem: "comboio", geladeira: "frigorífico", banheiro: "casa de banho",
      parabéns: "parabéns", sanduíche: "sandes", suco: "sumo", xícara: "chávena", "café da manhã": "pequeno-almoço", carteira: "carteira", "carteira de motorista": "carta de condução",
    }, pacote.palavras || {}));
    const marcas = []; // protege o nome da empresa: "LIPPMANN Treinamentos e Soluções"
    let r = s.replace(/(LIPPMANN|Lippmann)\s+(Treinamentos|TREINAMENTOS)(\s+(e|E)\s+(Soluções|SOLUÇÕES)(\s+LTDA)?)?/g, (m) => "\u0000" + (marcas.push(m) - 1) + "\u0000");
    r = trocaPalavras(r, PT);
    // acentuação: gênero → género, econômico → económico (ê/ô antes de m/n + vogal)
    r = r.replace(/([êô])([mn])(?=[aeiouáéíóú])/g, (m, v, c) => (v === "ê" ? "é" : "ó") + c).replace(/([ÊÔ])([MN])(?=[AEIOUÁÉÍÓÚ])/g, (m, v, c) => (v === "Ê" ? "É" : "Ó") + c);
    // gerúndio com "estar": estamos trabalhando → estamos a trabalhar
    r = r.replace(/\b(est(?:ou|á|amos|ão|ava|avam|ar|eja|ejam))\s+([a-zà-ú]+?)(ando|endo|indo)\b/g, (m, aux, raiz, suf) => `${aux} a ${raiz}${suf === "ando" ? "ar" : suf === "endo" ? "er" : "ir"}`);
    return r.replace(/\u0000(\d+)\u0000/g, (m, i) => marcas[+i]);
  }
})();
