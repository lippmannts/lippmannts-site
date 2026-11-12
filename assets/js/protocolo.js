/* Ouvidoria LIPPMANN · consulta pública de protocolo */
(function () {
  const C = window.LTS_CONFIG, DEMO = C.api && C.api.modoDemonstracao;
  const $ = id => document.getElementById(id), out = $("pr-resultado"), aviso = $("pr-aviso");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dh = d => d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  const ETAPAS = [["recebido", "Recebido"], ["em_analise", "Em análise"], ["respondido", "Respondido"], ["concluido", "Concluído"]];
  const AUTOR = { lippmann: "Resposta da LIPPMANN", solicitante: "Você", sistema: "Registro" };
  let atual = null;
  async function chamar(corpo) {
    if (DEMO && window.LTS_OUV_DEMO) return window.LTS_OUV_DEMO.consultar(corpo.protocolo, corpo.chave, corpo.acao === "complementar" ? corpo.texto : undefined);
    try { const r = await fetch(C.api.base + "protocolo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }); return await r.json(); }
    catch (e) { return { ok: false, mensagem: "Não foi possível consultar agora. Tente novamente." }; }
  }
  function desenhar(p) {
    const i = ETAPAS.findIndex(e => e[0] === p.status);
    out.innerHTML = `<div class="prot-card">
      <div class="prot-topo"><div><p class="eyebrow">${esc(p.tipo)}</p><h2 translate="no">${esc(p.protocolo)}</h2><p class="prot-mini">Aberto em ${dh(p.criado)} · última atualização ${dh(p.atualizado)}</p></div><span class="prot-status st-${esc(p.status)}">${esc(p.status_rotulo)}</span></div>
      <ol class="prot-etapas">${ETAPAS.map((e, n) => `<li class="${n < i ? "feita" : n === i ? "atual" : ""}"><span>${n + 1}</span>${e[1]}</li>`).join("")}</ol>
      <h3>Mensagem enviada</h3><p class="prot-msg">${esc(p.mensagem)}</p>
      <h3>Histórico</h3>
      <ul class="prot-hist">${p.historico.map(m => `<li class="a-${esc(m.autor)}"><div class="prot-hist-cab"><b>${AUTOR[m.autor] || m.autor}</b><small>${dh(m.criado)}</small></div><p>${esc(m.texto)}</p></li>`).join("")}</ul>
      ${p.status !== "concluido" ? `<form id="pr-comp" class="prot-comp" novalidate><label for="pr-texto">Acrescentar informação</label><textarea id="pr-texto" maxlength="3000" placeholder="Escreva aqui uma informação complementar para a Ouvidoria."></textarea><button class="btn btn-contorno" type="submit">Enviar complemento</button><p class="form-aviso" id="pr-caviso" hidden></p></form>` : ""}
    </div>`;
    const f = $("pr-comp"); if (f) f.onsubmit = async e => {
      e.preventDefault(); const bt = f.querySelector("button"); bt.disabled = true;
      const r = await chamar({ acao: "complementar", protocolo: atual.protocolo, chave: atual.chave, texto: $("pr-texto").value }); bt.disabled = false;
      if (!r.ok) return window.LTS_AVISO($("pr-caviso"), "falha", esc(r.mensagem));
      desenhar(r.protocolo); window.LTS_AVISO($("pr-caviso"), "ok", "Complemento enviado à Ouvidoria.");
    };
  }
  $("pr-form").addEventListener("submit", async e => {
    e.preventDefault(); aviso.hidden = true;
    const protocolo = $("pr-protocolo").value.trim().toUpperCase(), chave = $("pr-chave").value.trim();
    if (!/^OUV-\d{4}-[A-Z0-9]{6}$/.test(protocolo) || !/^\d{6}$/.test(chave)) return window.LTS_AVISO(aviso, "falha", "Informe o protocolo (OUV-AAAA-XXXXXX) e o código de acesso de 6 dígitos.");
    out.innerHTML = `<p class="vazio">Consultando…</p>`;
    const r = await chamar({ acao: "consultar", protocolo, chave });
    if (!r.ok) { out.innerHTML = ""; return window.LTS_AVISO(aviso, "falha", esc(r.mensagem)); }
    atual = { protocolo, chave }; desenhar(r.protocolo);
  });
  const q = new URLSearchParams(location.search).get("p"); if (q) $("pr-protocolo").value = q.toUpperCase();
})();
