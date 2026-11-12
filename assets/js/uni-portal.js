/* UniLTS · base dos portais Empresa e Parceiro: acesso, troca obrigatória de senha, sessão e chamadas ao servidor */
(function () {
  "use strict";
  const C = window.LTS_CONFIG, DEMO = !!(C.api && C.api.modoDemonstracao);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = { olho: s('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'), cadeado: s('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>') };

  window.UNI_PORTAL = function (op) {
    const app = document.getElementById("ava-app");
    let usuario = null;
    async function api(acao, { corpo, query = {} } = {}) {
      if (DEMO) {
        const r = await window.UNI_DEMO[op.tipo](acao, { corpo, query });
        if (!r.ok && r.status === 401 && acao !== "sessao") telaLogin(r.mensagem);
        if (!r.ok && r.trocar_senha) telaTroca();
        return r;
      }
      const qs = new URLSearchParams({ acao, ...query }).toString();
      const opt = { credentials: "same-origin", headers: { Accept: "application/json" } };
      if (corpo) { opt.method = "POST"; opt.headers["Content-Type"] = "application/json"; opt.headers["X-UniLTS"] = "1"; opt.body = JSON.stringify(corpo); }
      try {
        const r = await fetch(`${C.api.base}${op.tipo}?${qs}`, opt);
        const j = await r.json().catch(() => ({ ok: false, mensagem: "Resposta inválida do servidor." }));
        if (r.status === 401 && !["login", "esqueci", "sessao"].includes(acao)) telaLogin(j.mensagem);
        if (r.status === 403 && j.trocar_senha) telaTroca();
        return j;
      } catch (e) { return { ok: false, mensagem: "Sem conexão com o servidor. Verifique a internet." }; }
    }
    const aviso = (id, tipo, msg) => { const el = document.getElementById(id); if (!el) return; el.hidden = !msg; el.className = "ava-aviso " + tipo; el.textContent = msg || ""; };
    function topo() { const u = document.getElementById("ava-usuario"); u.hidden = !usuario; if (usuario) document.getElementById("ava-nome").textContent = usuario.nome; }
    document.getElementById("ava-sair").onclick = async () => { await api("logout", { corpo: {} }); usuario = null; location.hash = ""; telaLogin(); };
    const olho = id => `<button type="button" class="ava-olho" data-olho="${id}" aria-label="Mostrar senha" aria-pressed="false">${IC.olho}</button>`;
    const ligarOlhos = () => app.querySelectorAll("[data-olho]").forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.olho); const v = i.type === "password"; i.type = v ? "text" : "password"; b.setAttribute("aria-pressed", v); });

    function telaLogin(msg) {
      usuario = null; topo();
      app.innerHTML = `<section class="ava-acesso">
        <div class="ava-acesso-lado"><p class="ava-acesso-marca">Uni<b>LTS</b></p><h1>${esc(op.titulo)}</h1><p>${esc(op.descricao)}</p>
          <ul>${op.itens.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <form class="ava-cartao" id="f-login" novalidate>
          <h2>Entrar</h2>
          <label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="username" required>
          <label for="l-senha">Senha</label><div class="ava-senha"><input id="l-senha" type="password" autocomplete="current-password" required>${olho("l-senha")}</div>
          <p class="ava-aviso" id="l-msg" hidden></p>
          <button class="btn btn-primario" type="submit">Acessar</button>
          <button class="ava-link" type="button" id="l-esqueci">Esqueci minha senha</button>
          ${DEMO ? `<p class="ava-demo"><b>Demonstração:</b> use <b>${esc(op.demo)}</b> e a senha provisória <b>Demo2026</b>.</p>` : ""}
          <p class="ava-mini" style="text-align:center">O acesso é criado pela LIPPMANN. Não tem acesso? <a href="https://wa.me/5511940138792" target="_blank" rel="noopener">Fale conosco</a>.</p>
        </form></section>`;
      ligarOlhos(); if (msg) aviso("l-msg", "erro", msg);
      document.getElementById("f-login").onsubmit = async e => {
        e.preventDefault(); const bt = e.target.querySelector("[type=submit]"); bt.disabled = true;
        const r = await api("login", { corpo: { email: document.getElementById("l-email").value.trim(), senha: document.getElementById("l-senha").value } });
        bt.disabled = false;
        if (!r.ok) return aviso("l-msg", "erro", r.mensagem || "Não foi possível entrar.");
        usuario = r.usuario; topo(); r.usuario.trocar_senha ? telaTroca() : op.entrar(api);
      };
      document.getElementById("l-esqueci").onclick = async () => {
        const email = document.getElementById("l-email").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return aviso("l-msg", "info", "Digite o seu e-mail no campo acima e clique de novo em “Esqueci minha senha”.");
        const r = await api("esqueci", { corpo: { email } }); aviso("l-msg", r.ok ? "ok" : "erro", r.mensagem);
      };
    }
    function telaTroca() {
      topo();
      app.innerHTML = `<section class="ava-acesso ava-acesso-unico"><form class="ava-cartao" id="f-troca" novalidate>
        <span class="ava-icone">${IC.cadeado}</span><h2>Crie a sua senha</h2>
        <p class="ava-sub">Por segurança e em conformidade com a LGPD, troque a senha provisória recebida por e-mail antes de continuar.</p>
        <label for="t-atual">Senha provisória</label><div class="ava-senha"><input id="t-atual" type="password">${olho("t-atual")}</div>
        <label for="t-nova">Nova senha</label><div class="ava-senha"><input id="t-nova" type="password" autocomplete="new-password">${olho("t-nova")}</div>
        <small class="ava-dica">Mínimo de 8 caracteres, com letras e números.</small>
        <label for="t-conf">Confirme a nova senha</label><div class="ava-senha"><input id="t-conf" type="password" autocomplete="new-password">${olho("t-conf")}</div>
        <p class="ava-aviso" id="t-msg" hidden></p><button class="btn btn-primario" type="submit">Salvar e continuar</button></form></section>`;
      ligarOlhos();
      document.getElementById("f-troca").onsubmit = async e => {
        e.preventDefault(); const nova = document.getElementById("t-nova").value;
        if (nova !== document.getElementById("t-conf").value) return aviso("t-msg", "erro", "A confirmação não confere com a nova senha.");
        const r = await api("trocar_senha", { corpo: { atual: document.getElementById("t-atual").value, nova } });
        if (!r.ok) return aviso("t-msg", "erro", r.mensagem);
        usuario.trocar_senha = false; op.entrar(api);
      };
    }
    (async () => { const r = await api("sessao"); if (r.ok) { usuario = r.usuario; topo(); r.usuario.trocar_senha ? telaTroca() : op.entrar(api); } else telaLogin(); })();
    return { api, esc };
  };
})();
