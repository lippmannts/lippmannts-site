/* UniLTS · validação pública de certificados (destino do QR Code) */
(function () {
  const C = window.LTS_CONFIG, I = window.LTS_ICON || {};
  const DEMO = C.api && C.api.modoDemonstracao;
  const form = document.getElementById("val-form"), inp = document.getElementById("val-codigo"), out = document.getElementById("val-resultado");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const data = d => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const SIT = { valido: ["Certificado válido", "ok"], vencido: ["Certificado autêntico, porém vencido", "alerta"], cancelado: ["Certificado cancelado", "erro"] };
  async function consultar(codigo) {
    if (DEMO && window.UNI_DEMO) return window.UNI_DEMO.validar(codigo);
    try { const r = await fetch(C.api.base + "site?modulo=certificado&c=" + encodeURIComponent(codigo)); return await r.json(); } catch (e) { return { ok: false, mensagem: "Não foi possível consultar agora. Tente novamente." }; }
  }
  async function validar(codigo) {
    codigo = String(codigo || "").trim().toUpperCase(); if (!codigo) return;
    out.innerHTML = `<p class="vazio">Consultando…</p>`;
    const r = await consultar(codigo);
    if (!r.ok) { out.innerHTML = `<div class="val-card val-erro"><div class="val-selo">${I.close || "✕"}</div><div><h2>Certificado não encontrado</h2><p>${esc(r.mensagem || "")}</p><p>Em caso de dúvida, fale com a LIPPMANN: (11) 94013-8792 · atendimento@lippmannts.com</p></div></div>`; return; }
    const c = r.certificado, [tit, cls] = SIT[c.status] || SIT.cancelado;
    if (c.status === "revogado") {   // compra cancelada/estornada: alerta crítico
      out.innerHTML = `<div class="val-card val-revogado" role="alert">
        <div class="val-selo">${I.close || "✕"}</div>
        <div style="min-width:0">
          <p class="val-tarja">ALERTA · CERTIFICADO REVOGADO</p>
          <h2>Certificado revogado por cancelamento</h2>
          <p class="val-cod">${esc(c.codigo)}</p>
          <p><b>Este certificado foi revogado porque a compra do curso foi cancelada${c.revogacao && c.revogacao.em ? " em " + data(c.revogacao.em) : ""}.</b></p>
          <p><b>Não possui validade legal e não tem autorização de uso da LIPPMANN Treinamentos e Soluções.</b> Não aceite este documento como comprovação de capacitação.</p>
          <table class="tabela-info"><tbody>
            <tr><th scope="row">Titular</th><td>${esc(c.nome)}${c.cpf ? ` · CPF ${esc(c.cpf)}` : ""}</td></tr>
            <tr><th scope="row">Curso</th><td>${esc(c.curso)}${c.nr ? ` (${esc(c.nr)})` : ""}</td></tr>
            <tr><th scope="row">Emissor</th><td>${esc(c.emissor)}</td></tr>
          </tbody></table>
          <p>Para denunciar o uso indevido: atendimento@lippmannts.com · WhatsApp (11) 94013-8792.</p>
        </div></div>`;
      try { history.replaceState(null, "", "?c=" + encodeURIComponent(codigo)); } catch (e) {}
      return;
    }
    out.innerHTML = `<div class="val-card val-${cls}">
      <div class="val-selo">${I.escudo || ""}</div>
      <div style="min-width:0">
        <h2>${tit}</h2>
        <p class="val-cod">${esc(c.codigo)}</p>
        <table class="tabela-info"><tbody>
          <tr><th scope="row">Aluno</th><td>${esc(c.nome)}${c.cpf ? ` · CPF ${esc(c.cpf)}` : ""}</td></tr>
          <tr><th scope="row">Curso</th><td>${esc(c.curso)}${c.nr ? ` (${esc(c.nr)})` : ""}</td></tr>
          <tr><th scope="row">Carga horária</th><td>${esc(String(c.carga_horaria).replace(".", ","))} horas · ${esc(c.modalidade || "EaD")}</td></tr>
          <tr><th scope="row">Turma</th><td>${esc(c.turma)}</td></tr>
          <tr><th scope="row">Conclusão</th><td>${data(c.concluido_em)}</td></tr>
          <tr><th scope="row">Validade</th><td>${c.valido_ate ? "até " + data(c.valido_ate) : "Indeterminada (conforme norma e política do empregador)"}</td></tr>
          <tr><th scope="row">Responsável técnico</th><td>${esc(c.rt_nome || "")}</td></tr>
          <tr><th scope="row">Emissor</th><td>${esc(c.emissor)}</td></tr>
        </tbody></table>
      </div></div>`;
    try { history.replaceState(null, "", "?c=" + encodeURIComponent(codigo)); } catch (e) {}
  }
  form.addEventListener("submit", e => { e.preventDefault(); validar(inp.value); });
  const q = new URLSearchParams(location.search).get("c");
  if (q) { inp.value = q; validar(q); }
})();
