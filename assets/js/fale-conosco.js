/* LIPPMANN · Fale Conosco — grava no L³ INTEGRA e notifica a equipe por e-mail */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  const $ = id => document.getElementById(id);
  $("c-whats").textContent = C.contato.whatsappExibicao;
  $("c-com").textContent = C.contato.emailComercial;
  $("c-insta").href = C.redes.instagram.url; $("c-yt").href = C.redes.youtube.url; $("c-in").href = C.redes.linkedin.url;

  const form = $("form-contato"), sel = $("f-assunto"), nome = $("f-nome"), email = $("f-email");
  const aviso = form.querySelector(".form-aviso");

  // Pré-seleção vinda de outras páginas: fale-conosco.html?assunto=TREINAMENTOS&ref=NR%2035
  const qs = new URLSearchParams(location.search);
  if (qs.get("assunto")) sel.value = qs.get("assunto");
  if (qs.get("ref")) $("f-msg").value = `Tenho interesse em: ${qs.get("ref")}\n\n`;

  function modoDenuncia() {
    const d = sel.value === "DENÚNCIAS";
    $("nota-denuncia").hidden = !d;
    nome.required = !d; email.required = !d;
    form.querySelectorAll("[data-opc]").forEach(s => s.hidden = !d);
    if (d) form.querySelectorAll(".campo.erro").forEach(c => { if (c.contains(nome) || c.contains(email)) c.classList.remove("erro"); });
  }
  sel.addEventListener("change", modoDenuncia);
  modoDenuncia();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!window.LTS_VALIDAR(form)) { window.LTS_AVISO(aviso, "falha", "Confira os campos destacados em vermelho."); return; }
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { email.closest(".campo").classList.add("erro"); email.focus(); return; }
    const bt = form.querySelector("button[type=submit]");
    bt.disabled = true; bt.textContent = "Enviando…";
    const r = await window.LTS_API.registrar("contato", form);
    bt.disabled = false; bt.textContent = "Enviar mensagem";
    if (r.ok) {
      form.reset(); modoDenuncia();
      window.LTS_AVISO(aviso, "ok", "Mensagem enviada. A equipe LIPPMANN responderá pelo contato informado.");
    } else {
      window.LTS_AVISO(aviso, "falha", `Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp <b>${C.contato.whatsappExibicao}</b>.`);
    }
  });
})();
