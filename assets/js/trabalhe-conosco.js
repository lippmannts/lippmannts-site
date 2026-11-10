/* LIPPMANN · Trabalhe Conosco — currículo vai para o banco de talentos do L³ INTEGRA */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  const $ = id => document.getElementById(id);
  const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cargos = C.cargosTrabalheConosco || [];
  $("t-cargo").insertAdjacentHTML("beforeend", cargos.map(c => `<option>${esc(c)}</option>`).join(""));
  $("cargos-lista").innerHTML = cargos.map(c => `<span class="chip chip-claro">${esc(c)}</span>`).join("");

  const form = $("form-trabalhe"), aviso = form.querySelector(".form-aviso"), cv = $("t-cv"), up = $("upload");
  const MAX = 5 * 1024 * 1024;
  function mostrarArquivo() {
    const f = cv.files[0];
    $("cv-nome").textContent = f ? `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)` : "Clique ou arraste o arquivo aqui";
    if (f) cv.closest(".campo").classList.remove("erro");
  }
  cv.addEventListener("change", mostrarArquivo);
  ["dragenter", "dragover"].forEach(ev => up.addEventListener(ev, e => { e.preventDefault(); up.classList.add("arrastando"); }));
  ["dragleave", "drop"].forEach(ev => up.addEventListener(ev, () => up.classList.remove("arrastando")));
  up.addEventListener("drop", e => { e.preventDefault(); if (e.dataTransfer.files.length) { cv.files = e.dataTransfer.files; mostrarArquivo(); } });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!window.LTS_VALIDAR(form)) { window.LTS_AVISO(aviso, "falha", "Confira os campos destacados em vermelho."); return; }
    const f = cv.files[0];
    if (!/\.(pdf|docx?)$/i.test(f.name)) { cv.closest(".campo").classList.add("erro"); window.LTS_AVISO(aviso, "falha", "Envie o currículo em PDF, DOC ou DOCX."); return; }
    if (f.size > MAX) { cv.closest(".campo").classList.add("erro"); window.LTS_AVISO(aviso, "falha", "O currículo deve ter no máximo 5 MB."); return; }
    const bt = form.querySelector("button[type=submit]");
    bt.disabled = true; bt.textContent = "Enviando…";
    let extras = {};
    if (!C.api.modoDemonstracao) {
      try {
        bt.textContent = "Enviando currículo…";
        extras = { _arquivo: await window.LTS_API.enviarArquivo(f), _arquivo_nome: f.name };
      } catch (err) {
        bt.disabled = false; bt.textContent = "Enviar currículo";
        window.LTS_AVISO(aviso, "falha", esc(err.message)); return;
      }
    }
    const r = await window.LTS_API.registrar("candidato", form, extras);
    bt.disabled = false; bt.textContent = "Enviar currículo";
    if (r.ok) { form.reset(); mostrarArquivo(); window.LTS_AVISO(aviso, "ok", "Currículo recebido. Enviamos uma confirmação para o seu e-mail. Boa sorte!"); }
    else window.LTS_AVISO(aviso, "falha", r.mensagem ? esc(r.mensagem) : "Não foi possível enviar agora. Tente novamente em alguns minutos.");
  });
})();
