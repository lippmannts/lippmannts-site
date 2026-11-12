/* =====================================================================
   UniLTS · Área do Aluno (AVA EaD)
   Telas: acesso · troca obrigatória de senha · meus cursos · curso
   (visão geral, plano de ensino, mapa mental, aulas, avaliação, certificado)
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  const DEMO = !!(C.api && C.api.modoDemonstracao);
  const app = document.getElementById("ava-app");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nota = n => n === null || n === undefined || n === "" ? "—" : Number(n).toFixed(2).replace(".", ",");
  const dataBR = d => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const horas = h => `${String(Number(h) || 0).replace(".", ",")} h`;
  const s = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    play: s('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>'), ok: s('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    plano: s('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
    mapa: s('<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><path d="m6 6 4 4M18 6l-4 4M6 18l4-4M18 18l-4-4"/>'),
    prova: s('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'),
    cert: s('<circle cx="12" cy="9" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/>'), casa: s('<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'),
    cadeado: s('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'), volta: s('<path d="M15 18 9 12l6-6"/>'),
    baixar: s('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>'), imprimir: s('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
    olho: s('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'), menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>')
  };
  const st = { aluno: null, painel: null, curso: null };

  /* ---------- servidor ---------- */
  async function api(acao, { corpo, query = {} } = {}) {
    if (DEMO) {
      const r = await window.UNI_DEMO.aluno(acao, { corpo, query });
      if (!r.ok && r.status === 401 && acao !== "sessao") { st.aluno = null; telaLogin("Sua sessão expirou. Entre novamente."); }
      if (!r.ok && r.trocar_senha) telaTroca();
      return r;
    }
    const qs = new URLSearchParams({ acao, ...query }).toString();
    const opt = { credentials: "same-origin", headers: { Accept: "application/json" } };
    if (corpo) { opt.method = "POST"; opt.headers["Content-Type"] = "application/json"; opt.headers["X-UniLTS"] = "1"; opt.body = JSON.stringify(corpo); }
    try {
      const r = await fetch(`${C.api.base}uni?${qs}`, opt);
      const j = await r.json().catch(() => ({ ok: false, mensagem: "Resposta inválida do servidor." }));
      if (r.status === 401 && !["login", "esqueci", "sessao"].includes(acao)) { st.aluno = null; telaLogin(j.mensagem); }
      if (r.status === 403 && j.trocar_senha) telaTroca();
      return j;
    } catch (e) { return { ok: false, mensagem: "Sem conexão com o servidor. Verifique a internet." }; }
  }
  function aviso(id, tipo, msg) { const el = document.getElementById(id); if (!el) return; el.hidden = !msg; el.className = "ava-aviso " + tipo; el.textContent = msg || ""; }
  function topo() {
    const u = document.getElementById("ava-usuario");
    u.hidden = !st.aluno; if (st.aluno) document.getElementById("ava-nome").textContent = st.aluno.nome;
  }
  document.getElementById("ava-sair").onclick = async () => { await api("logout", { corpo: {} }); st.aluno = null; location.hash = ""; telaLogin(); };
  const olho = (id) => `<button type="button" class="ava-olho" data-olho="${id}" aria-label="Mostrar senha" aria-pressed="false">${IC.olho}</button>`;
  function ligarOlhos() {
    app.querySelectorAll("[data-olho]").forEach(b => b.onclick = () => { const i = document.getElementById(b.dataset.olho); const v = i.type === "password"; i.type = v ? "text" : "password"; b.setAttribute("aria-pressed", v); });
  }

  /* ---------- acesso ---------- */
  function telaLogin(msg) {
    topo();
    app.innerHTML = `<section class="ava-acesso">
      <div class="ava-acesso-lado">
        <p class="ava-acesso-marca">Uni<b>LTS</b></p>
        <h1>Área do Aluno</h1>
        <p>Aulas, plano de ensino, mapa mental, avaliações e certificados dos seus cursos EaD com a LIPPMANN.</p>
        <ul><li>${IC.play} Estude no seu ritmo, de qualquer dispositivo</li><li>${IC.prova} Avaliação on-line com até 3 tentativas</li><li>${IC.cert} Certificado com QR Code de validação</li></ul>
      </div>
      <form class="ava-cartao" id="f-login" novalidate>
        <h2>Entrar</h2>
        <label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="username" required>
        <label for="l-senha">Senha</label><div class="ava-senha"><input id="l-senha" type="password" autocomplete="current-password" required>${olho("l-senha")}</div>
        <p class="ava-aviso" id="l-msg" hidden></p>
        <button class="btn btn-primario" type="submit">Acessar</button>
        <button class="ava-link" type="button" id="l-esqueci">Esqueci minha senha</button>
        ${DEMO ? `<p class="ava-demo"><b>Demonstração:</b> use <b>aluno@demo.com</b> e a senha provisória <b>Demo2026</b>. A troca de senha será solicitada no primeiro acesso.</p>` : ""}
      </form>
    </section>`;
    ligarOlhos();
    if (msg) aviso("l-msg", "erro", msg);
    document.getElementById("f-login").onsubmit = async e => {
      e.preventDefault();
      const bt = e.target.querySelector("[type=submit]"); bt.disabled = true;
      const r = await api("login", { corpo: { email: document.getElementById("l-email").value.trim(), senha: document.getElementById("l-senha").value } });
      bt.disabled = false;
      if (!r.ok) return aviso("l-msg", "erro", r.mensagem || "Não foi possível entrar.");
      st.aluno = r.aluno; topo();
      r.aluno.trocar_senha ? telaTroca() : rotear();
    };
    document.getElementById("l-esqueci").onclick = async () => {
      const email = document.getElementById("l-email").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return aviso("l-msg", "info", "Digite o seu e-mail no campo acima e clique de novo em “Esqueci minha senha”.");
      const r = await api("esqueci", { corpo: { email } });
      aviso("l-msg", r.ok ? "ok" : "erro", r.mensagem);
    };
    document.getElementById("l-email").focus();
  }
  function telaTroca() {
    topo();
    app.innerHTML = `<section class="ava-acesso ava-acesso-unico">
      <form class="ava-cartao" id="f-troca" novalidate>
        <span class="ava-icone">${IC.cadeado}</span>
        <h2>Crie a sua senha</h2>
        <p class="ava-sub">Por segurança e em conformidade com a LGPD, troque a senha provisória recebida por e-mail antes de continuar.</p>
        <label for="t-atual">Senha provisória</label><div class="ava-senha"><input id="t-atual" type="password" autocomplete="current-password">${olho("t-atual")}</div>
        <label for="t-nova">Nova senha</label><div class="ava-senha"><input id="t-nova" type="password" autocomplete="new-password">${olho("t-nova")}</div>
        <small class="ava-dica">Mínimo de 8 caracteres, com letras e números.</small>
        <label for="t-conf">Confirme a nova senha</label><div class="ava-senha"><input id="t-conf" type="password" autocomplete="new-password">${olho("t-conf")}</div>
        <p class="ava-aviso" id="t-msg" hidden></p>
        <button class="btn btn-primario" type="submit">Salvar e continuar</button>
      </form></section>`;
    ligarOlhos();
    document.getElementById("f-troca").onsubmit = async e => {
      e.preventDefault();
      const nova = document.getElementById("t-nova").value;
      if (nova !== document.getElementById("t-conf").value) return aviso("t-msg", "erro", "A confirmação não confere com a nova senha.");
      const r = await api("trocar_senha", { corpo: { atual: document.getElementById("t-atual").value, nova } });
      if (!r.ok) return aviso("t-msg", "erro", r.mensagem);
      st.aluno.trocar_senha = false; location.hash = "cursos"; rotear();
    };
  }

  /* ---------- meus cursos ---------- */
  const SIT = { em_andamento: ["Em andamento", "and"], aprovado: ["Aprovado", "ok"], reprovado: ["Reprovado", "erro"] };
  const barra = p => `<div class="ava-barra" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso"><span style="width:${p}%"></span></div>`;
  async function telaCursos() {
    app.innerHTML = `<p class="vazio" style="padding:40px">Carregando seus cursos…</p>`;
    const r = await api("painel"); if (!r.ok) return;
    st.painel = r.matriculas;
    const primeiro = st.aluno.nome.split(" ")[0];
    app.innerHTML = `<section class="ava-wrap">
      <div class="ava-boas"><div><p class="ava-eyebrow">Área do Aluno</p><h1>Olá, ${esc(primeiro)}!</h1><p>Continue de onde parou. O progresso é salvo automaticamente.</p></div></div>
      <div class="ava-cursos">${r.matriculas.length ? r.matriculas.map(m => {
        const [rot, cls] = SIT[m.status] || SIT.em_andamento;
        return `<article class="ava-curso">
          <div class="ava-curso-img">${m.curso.imagem ? `<img src="${esc(m.curso.imagem)}" alt="" width="96" height="96">` : ""}</div>
          <div class="ava-curso-txt">
            <div class="ava-chips"><span class="ava-sit ${cls}">${rot}</span><span>Turma ${esc(m.turma.codigo)}</span>${m.turma.modalidade && m.turma.modalidade !== "ead" ? `<span>${m.turma.modalidade === "presencial" ? "Presencial" : "Híbrida (Blended Learning)"}</span>` : ""}<span>${horas(m.curso.carga_horaria)}</span></div>
            <h2>${esc(m.curso.titulo)}</h2>
            ${barra(m.progresso.pct)}
            <p class="ava-mini">${m.turma.modalidade === "presencial" ? "Treinamento presencial" : `${m.progresso.feitas} de ${m.progresso.total} aulas concluídas · ${m.progresso.pct}%`}${m.nota !== null && m.nota !== undefined ? ` · Nota ${nota(m.nota)}` : ""}</p>
            ${m.dias_restantes !== null && m.dias_restantes !== undefined ? `<p class="ava-prazo ${m.dias_restantes <= 5 ? "urgente" : ""}">Prazo: ${m.dias_restantes} ${m.dias_restantes === 1 ? "dia restante" : "dias restantes"} para concluir (até ${dataBR(m.prazo_ate)})</p>` : ""}
          </div>
          <div class="ava-curso-acao">
            ${m.turma.modalidade === "presencial" ? "" : `<a class="btn btn-primario" href="#c/${m.id}">${m.status === "aprovado" ? "Rever curso" : m.progresso.feitas ? "Continuar" : "Começar"}</a>`}
            ${m.certificado ? `<a class="btn btn-contorno" href="/unilts/certificado.html?c=${encodeURIComponent(m.certificado)}" target="_blank" rel="noopener">${IC.cert} Certificado</a>` : ""}
          </div></article>`;
      }).join("") : `<p class="vazio">Você ainda não tem matrículas ativas. Fale com a LIPPMANN pelo WhatsApp (11) 94013-8792.</p>`}</div>
      <div id="ava-pedidos"></div>
    </section>`;
    meusPedidos();
  }

  /* ---------- meus pedidos (compras on-line e reembolso em 7 dias) ---------- */
  async function meusPedidos() {
    const r = await api("pedidos"); const el = document.getElementById("ava-pedidos");
    if (!r.ok || !el || !r.pedidos.length) return;
    const brl = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const SITP = { aprovado: ["Pago", "ok"], estornado: ["Compra cancelada pelo usuário", "erro"], pendente: ["Aguardando pagamento", "and"], recusado: ["Recusado", "erro"], expirado: ["Expirado", "erro"], cancelado: ["Cancelado", "erro"] };
    el.innerHTML = `<h2 class="ava-h2">Meus pedidos</h2><table class="ava-tabela"><thead><tr><th>Pedido</th><th>Curso</th><th>Valor</th><th>Situação</th><th></th></tr></thead><tbody>
      ${r.pedidos.map(p => `<tr><td><b>${esc(p.codigo)}</b><br><small>${dataBR(p.pago_em || p.criado)} · ${p.metodo === "pix" ? "PIX" : "Cartão"}</small></td><td>${esc(p.curso)}</td><td>${brl(p.valor)}</td><td><span class="ava-sit ${(SITP[p.status] || [])[1] || ""}">${(SITP[p.status] || [p.status])[0]}</span></td>
        <td>${p.reembolsavel ? `<button class="btn btn-contorno" type="button" data-reemb="${esc(p.codigo)}">Como cancelar (até ${dataBR(p.reembolso_ate)})</button>` : ""}<a class="btn btn-contorno" href="/pedido.html?c=${encodeURIComponent(p.codigo)}">Rastrear</a></td></tr>`).join("")}
    </tbody></table><div id="pd-cancel"></div>`;
    el.querySelectorAll("[data-reemb]").forEach(b => b.onclick = () => {
      const p = r.pedidos.find(x => x.codigo === b.dataset.reemb); const box = document.getElementById("pd-cancel");
      box.innerHTML = window.LTS_CANCELAMENTO ? window.LTS_CANCELAMENTO.html({ ...p, nome: st.aluno && st.aluno.nome, email: st.aluno && st.aluno.email }) : ""; box.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- curso ---------- */
  async function abrirCurso(id, vista, aulaId) {
    if (!st.curso || String(st.curso.id) !== String(id) || vista === "avaliacao" || !vista) {
      const r = await api("curso", { query: { m: id } }); if (!r.ok) { app.innerHTML = `<p class="ava-aviso erro" style="margin:40px">${esc(r.mensagem)}</p>`; return; }
      st.curso = r;
    }
    const m = st.curso, cont = m.conteudo;
    const aulas = (cont.modulos || []).flatMap((mod, i) => (mod.aulas || []).map(a => ({ ...a, modulo: i })));
    const feita = a => !!(m.aulas && m.aulas[a.id]);
    const liberadaAval = m.progresso.total > 0 && m.progresso.feitas === m.progresso.total;
    const item = (href, ic, txt, ativo, extra = "") => `<a href="${href}" class="ava-nav-item${ativo ? " ativo" : ""}"${ativo ? ' aria-current="page"' : ""}>${ic}<span>${txt}</span>${extra}</a>`;
    const v = vista || "inicio";
    app.innerHTML = `<div class="ava-curso-tela">
      <aside class="ava-lateral" id="ava-lateral">
        <a class="ava-voltar" href="#cursos">${IC.volta} Meus cursos</a>
        <h2>${esc(m.curso.titulo)}</h2>
        <p class="ava-mini">Turma ${esc(m.turma.codigo)} · ${horas(m.curso.carga_horaria)}</p>
        ${barra(m.progresso.pct)}<p class="ava-mini">${m.progresso.pct}% concluído</p>
        <nav aria-label="Conteúdo do curso">
          ${item(`#c/${m.id}`, IC.casa, "Visão geral", v === "inicio")}
          ${item(`#c/${m.id}/plano`, IC.plano, "Plano de ensino", v === "plano")}
          ${item(`#c/${m.id}/mapa`, IC.mapa, "Mapa mental", v === "mapa")}
          ${(cont.modulos || []).map((mod, i) => `<p class="ava-mod">${esc(mod.titulo)}</p>${(mod.aulas || []).map(a => item(`#c/${m.id}/aula/${a.id}`, feita(a) ? `<span class="ava-check feito">${IC.ok}</span>` : `<span class="ava-check">${IC.play}</span>`, esc(a.titulo), v === "aula" && aulaId === a.id, a.duracao ? `<small>${esc(a.duracao)}</small>` : "")).join("")}`).join("")}
          <p class="ava-mod">Conclusão</p>
          ${item(`#c/${m.id}/avaliacao`, liberadaAval ? IC.prova : IC.cadeado, "Avaliação", v === "avaliacao", m.status === "aprovado" ? `<small class="ok">${nota(m.nota)}</small>` : "")}
          ${item(`#c/${m.id}/certificado`, m.certificado ? IC.cert : IC.cadeado, "Certificado", v === "certificado")}
        </nav>
      </aside>
      <section class="ava-conteudo" id="ava-conteudo" tabindex="-1"></section>
    </div>`;
    const alvo = document.getElementById("ava-conteudo");
    const proxima = (atual) => { const i = aulas.findIndex(a => a.id === atual); return aulas[i + 1]; };

    if (v === "inicio") {
      const seguinte = aulas.find(a => !feita(a));
      alvo.innerHTML = `<p class="so-pt-aviso ava-aviso info">O conteúdo do curso, a avaliação e o certificado são em português (Brasil), conforme a legislação brasileira.</p><p class="ava-eyebrow">${esc(cont.norma || m.curso.nr || "")}</p><h1>${esc(m.curso.titulo)}</h1>
        <p class="ava-lead">${esc(m.curso.resumo || "")}</p>
        ${m.dias_restantes !== null && m.dias_restantes !== undefined ? `<p class="ava-aviso ${m.dias_restantes <= 5 ? "erro" : "info"}"><b>Prazo de conclusão: ${m.dias_restantes} ${m.dias_restantes === 1 ? "dia" : "dias"}</b> (até ${dataBR(m.prazo_ate)}). São ${m.turma.prazo_dias || 30} dias corridos para concluir aulas e avaliação; se o prazo terminar, o progresso volta a 0% automaticamente.${m.resets ? ` Seu progresso já foi zerado ${m.resets} vez(es) por prazo.` : ""}</p>` : ""}
        ${m.turma.modalidade === "hibrido" ? `<p class="ava-aviso info">Curso híbrido: a teoria é feita aqui no AVA e a avaliação prática é presencial, com o instrutor.${m.nota_teorica !== null && m.nota_teorica !== undefined ? ` Teórica aprovada com nota ${nota(m.nota_teorica)}: aguarde a prática.` : ""}</p>` : ""}
        <div class="ava-kpis">
          <div><b>${m.progresso.pct}%</b><span>concluído</span></div>
          <div><b>${m.progresso.feitas}/${m.progresso.total}</b><span>aulas</span></div>
          <div><b>${m.tentativas_restantes}</b><span>tentativas restantes</span></div>
          <div><b>${nota(m.curso.nota_corte)}</b><span>nota mínima</span></div>
        </div>
        <div class="ava-acoes">${m.status === "aprovado" ? `<a class="btn btn-primario" href="#c/${m.id}/certificado">${IC.cert} Ver certificado</a>` : seguinte ? `<a class="btn btn-primario" href="#c/${m.id}/aula/${seguinte.id}">${IC.play} ${m.progresso.feitas ? "Continuar" : "Começar"}: ${esc(seguinte.titulo)}</a>` : `<a class="btn btn-primario" href="#c/${m.id}/avaliacao">${IC.prova} Fazer a avaliação</a>`}
          <a class="btn btn-contorno" href="#c/${m.id}/plano">${IC.plano} Plano de ensino</a></div>
        <h2 class="ava-h2">Conteúdo programático</h2>
        <ul class="lista-losango" translate="no" lang="pt-BR">${(cont.conteudo_programatico || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <p class="ava-mini" style="margin-top:18px">Instrutor: ${esc(cont.instrutor_nome || "")} · Modalidade: ${esc(cont.modalidade || "EaD")} · Período da turma: ${dataBR(m.turma.inicio)} a ${dataBR(m.turma.fim)}</p>`;
    }
    if (v === "plano") {
      alvo.innerHTML = `<div class="ava-titulo-acoes"><div><p class="ava-eyebrow">Plano de ensino</p><h1>${esc(m.curso.titulo)}</h1></div></div>
        <div class="artigo-corpo ava-texto ava-protegido" translate="no" lang="pt-BR">${cont.plano_ensino || "<p>Plano de ensino em elaboração.</p>"}</div>`;
    }
    if (v === "mapa") {
      const arq = cont.mapa_mental || "";
      const pdf = /\.pdf($|\?)/i.test(arq);
      alvo.innerHTML = `<div class="ava-titulo-acoes"><div><p class="ava-eyebrow">Mapa mental</p><h1>Revise o curso em uma página</h1></div>
</div>
        <p class="ava-mini">Material de uso exclusivo do aluno, para leitura na tela. Download, impressão e cópia estão desativados (propriedade intelectual da LIPPMANN).</p>
        ${arq ? (pdf ? `<div class="ava-pdf ava-protegido" id="ava-pdf" data-src="${esc(arq)}"><p class="vazio">Carregando material…</p></div>` : `<div class="ava-protegido"><img class="ava-mapa-img" src="${esc(arq)}" alt="Mapa mental do curso" draggable="false"></div>`) : `<p class="vazio">O mapa mental deste curso ainda não foi publicado.</p>`}`;
    }
    if (v === "aula") {
      const a = aulas.find(x => x.id === aulaId) || aulas[0]; if (!a) { alvo.innerHTML = `<p class="vazio">Nenhuma aula cadastrada.</p>`; return; }
      const prox = proxima(a.id);
      alvo.innerHTML = `<p class="so-pt-aviso ava-aviso info">O conteúdo do curso, a avaliação e o certificado são em português (Brasil), conforme a legislação brasileira.</p><p class="ava-eyebrow" translate="no">${esc((cont.modulos[a.modulo] || {}).titulo || "")}</p><h1 translate="no">${esc(a.titulo)}</h1>
        ${a.youtube ? `<div class="ava-video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(a.youtube)}?rel=0&modestbranding=1" title="Vídeo da aula: ${esc(a.titulo)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
          : `<div class="ava-video ava-video-vazio">${IC.play}<p>O vídeo desta aula será publicado em breve.<br><small>Enquanto isso, estude pelo texto de apoio abaixo.</small></p></div>`}
        <div class="artigo-corpo ava-texto ava-protegido" translate="no" lang="pt-BR">${a.texto || ""}</div>
        <div class="ava-aula-pe">
          ${feita(a) ? `<span class="ava-feita">${IC.ok} Aula concluída</span>` : `<button class="btn btn-primario" type="button" id="bt-concluir">${IC.ok} Marcar como concluída</button>`}
          ${prox ? `<a class="btn btn-contorno" href="#c/${m.id}/aula/${prox.id}">Próxima aula →</a>` : `<a class="btn btn-contorno" href="#c/${m.id}/avaliacao">Ir para a avaliação →</a>`}
        </div>`;
      const bt = document.getElementById("bt-concluir");
      if (bt) bt.onclick = async () => {
        bt.disabled = true;
        const r = await api("aula", { corpo: { m: m.id, aula: a.id } });
        if (!r.ok) { bt.disabled = false; return alert(r.mensagem); }
        m.aulas = r.aulas; m.progresso = r.progresso;
        location.hash = prox ? `c/${m.id}/aula/${prox.id}` : `c/${m.id}/avaliacao`;
      };
    }
    if (v === "avaliacao") telaAvaliacao(alvo, m, liberadaAval);
    if (v === "certificado") {
      alvo.innerHTML = m.certificado ? `<p class="ava-eyebrow">Certificado</p><h1>Parabéns, você foi aprovado!</h1>
        <div class="ava-cert-cartao">${IC.cert}<div><b>${esc(m.curso.titulo)}</b><span>Nota final ${nota(m.nota)} · Conclusão em ${dataBR(m.concluido_em)}</span><span>Código ${esc(m.certificado)}</span></div></div>
        <div class="ava-acoes"><a class="btn btn-primario" href="/unilts/certificado.html?c=${encodeURIComponent(m.certificado)}" target="_blank" rel="noopener">${IC.baixar} Abrir certificado (PDF)</a>
        <a class="btn btn-contorno" href="/validar.html?c=${encodeURIComponent(m.certificado)}" target="_blank" rel="noopener">Validar autenticidade</a></div>`
        : `<p class="ava-eyebrow">Certificado</p><h1>Certificado bloqueado</h1><p class="ava-lead">O certificado é liberado automaticamente quando você é aprovado na avaliação, com nota mínima ${nota(m.curso.nota_corte)}.</p>`;
    }
    protegerConteudo(alvo);
    document.getElementById("ava-conteudo").focus({ preventScroll: true });
  }

  /* ---------- Blindagem dos materiais didáticos (propriedade intelectual) ----------
     Sem download, sem impressão/salvar em PDF (@media print), sem cópia e com marca d'água
     dinâmica com o nome e o CPF mascarado do aluno. */
  function marcaDagua() {
    const a = st.aluno || {}, txt = `${a.nome || "Aluno UniLTS"} · CPF ${a.cpf || "***.***.***-**"} · UniLTS · LIPPMANN · ${new Date().toLocaleDateString("pt-BR")}`;
    const e = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="230"><text x="20" y="130" transform="rotate(-24 230 115)" font-family="Inter,Arial,sans-serif" font-size="14" font-weight="600" fill="rgba(10,52,144,0.13)">${e(txt)}</text></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }
  async function protegerConteudo(alvo) {
    const wm = marcaDagua();
    alvo.querySelectorAll(".ava-protegido").forEach(el => { el.style.setProperty("--wm", wm); el.setAttribute("oncontextmenu", "return false"); });
    const pdf = alvo.querySelector("#ava-pdf"); if (!pdf) return;
    try {
      if (!window.pdfjsLib) await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const doc = await window.pdfjsLib.getDocument({ url: pdf.dataset.src, disableAutoFetch: true }).promise;
      pdf.innerHTML = "";
      for (let n = 1; n <= doc.numPages; n++) {
        const pg = await doc.getPage(n), larg = Math.min(pdf.clientWidth || 800, 1100), vp0 = pg.getViewport({ scale: 1 }), esc2 = (larg / vp0.width) * (window.devicePixelRatio || 1), vp = pg.getViewport({ scale: esc2 });
        const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; cv.style.width = "100%"; cv.setAttribute("aria-label", `Página ${n} de ${doc.numPages}`);
        const box = document.createElement("div"); box.className = "ava-pdf-pag"; box.appendChild(cv); pdf.appendChild(box);
        await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      }
    } catch (e) { pdf.innerHTML = `<p class="vazio">Não foi possível abrir este material agora.</p>`; }
  }
  document.addEventListener("keydown", e => {   // atalhos de salvar, imprimir, copiar e código-fonte
    if (!document.body.classList.contains("ava") || document.body.classList.contains("portal")) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(k) || ((e.ctrlKey || e.metaKey) && ["c", "x", "a"].includes(k) && e.target.closest && e.target.closest(".ava-protegido"))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener("dragstart", e => { if (e.target.closest && e.target.closest(".ava-protegido")) e.preventDefault(); });
  document.addEventListener("copy", e => { const s = document.getSelection(); if (s && s.anchorNode && s.anchorNode.parentElement && s.anchorNode.parentElement.closest(".ava-protegido")) e.preventDefault(); });

  function telaAvaliacao(alvo, m, liberadaAval) {
    const hist = (m.tentativas || []).length ? `<h2 class="ava-h2">Suas tentativas</h2><table class="ava-tabela"><thead><tr><th>Tentativa</th><th>Data</th><th>Acertos</th><th>Nota</th></tr></thead><tbody>${m.tentativas.map((t, i) => `<tr><td>${i + 1}ª</td><td>${dataBR(t.t)}</td><td>${t.acertos}/${t.total}</td><td><b class="${t.nota >= m.curso.nota_corte ? "ok" : "erro"}">${nota(t.nota)}</b></td></tr>`).join("")}</tbody></table>` : "";
    const cab = `<p class="ava-eyebrow">Avaliação de aprendizagem</p><h1>${esc(m.curso.titulo)}</h1>
      <div class="ava-regras"><span><b>${m.curso.tentativas_max}</b> tentativas no total</span><span><b>${m.tentativas_restantes}</b> restantes</span><span>Nota mínima <b>${nota(m.curso.nota_corte)}</b></span></div>`;
    if (m.status === "aprovado") { alvo.innerHTML = cab + `<p class="ava-aviso ok">Você foi aprovado com nota ${nota(m.nota)}.</p><div class="ava-acoes"><a class="btn btn-primario" href="#c/${m.id}/certificado">Ver certificado</a></div>` + hist; return; }
    if (m.status === "reprovado" || !m.tentativas_restantes) { alvo.innerHTML = cab + `<p class="ava-aviso erro">Você utilizou todas as tentativas. Fale com a coordenação pelo WhatsApp (11) 94013-8792 para reorientação e liberação de nova tentativa.</p>` + hist; return; }
    if (!liberadaAval || !m.avaliacao) { alvo.innerHTML = cab + `<p class="ava-aviso info">A avaliação será liberada quando você concluir todas as aulas (${m.progresso.feitas} de ${m.progresso.total}).</p>` + hist; return; }
    alvo.innerHTML = cab + `<form id="f-aval" class="ava-prova" novalidate>
      ${m.avaliacao.map((q, i) => `<fieldset class="ava-questao" translate="no" lang="pt-BR"><legend><span>${i + 1}</span>${esc(q.pergunta)}</legend>
        ${q.alternativas.map((alt, j) => `<label class="ava-alt"><input type="radio" name="q${i}" value="${j}"><span class="ava-letra">${"ABCDEF"[j]}</span><span>${esc(alt)}</span></label>`).join("")}</fieldset>`).join("")}
      <p class="ava-aviso" id="a-msg" hidden></p>
      <div class="ava-acoes"><button class="btn btn-primario" type="submit">Enviar respostas</button><span class="ava-mini" id="a-cont">0 de ${m.avaliacao.length} respondidas</span></div>
    </form>` + hist;
    const f = document.getElementById("f-aval");
    f.onchange = () => { document.getElementById("a-cont").textContent = `${f.querySelectorAll("input:checked").length} de ${m.avaliacao.length} respondidas`; };
    f.onsubmit = async e => {
      e.preventDefault();
      const resp = m.avaliacao.map((_, i) => { const x = f.querySelector(`input[name="q${i}"]:checked`); return x ? Number(x.value) : null; });
      const falta = resp.findIndex(x => x === null);
      if (falta >= 0) { aviso("a-msg", "erro", `Responda a questão ${falta + 1} antes de enviar.`); f.querySelectorAll(".ava-questao")[falta].scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      if (!confirm(`Enviar as respostas? Esta será a sua ${m.tentativas.length + 1}ª tentativa de ${m.curso.tentativas_max}.`)) return;
      const bt = f.querySelector("[type=submit]"); bt.disabled = true;
      const r = await api("avaliacao", { corpo: { m: m.id, respostas: resp } });
      bt.disabled = false;
      if (!r.ok) return aviso("a-msg", "erro", r.mensagem);
      st.curso = null;
      alvo.innerHTML = `<div class="ava-resultado ${r.aprovado ? "ok" : "erro"}">
        <p class="ava-eyebrow">Resultado</p><div class="ava-nota">${nota(r.nota)}</div>
        <h1>${r.aguardando_pratica ? "Teoria aprovada!" : r.aprovado ? "Aprovado!" : "Não foi desta vez"}</h1>
        <p>${r.acertos} de ${r.total} questões corretas · nota mínima ${nota(r.nota_corte)}.</p>
        <p>${r.aguardando_pratica ? "Agora falta a avaliação prática presencial com o instrutor. O certificado é emitido após a prática." : r.aprovado ? "Seu certificado já está disponível." : r.restantes ? `Revise as aulas e tente novamente. Você ainda tem ${r.restantes} ${r.restantes === 1 ? "tentativa" : "tentativas"}.` : "Você utilizou todas as tentativas. A coordenação entrará em contato."}</p>
        <div class="ava-acoes" style="justify-content:center">${r.aprovado && r.certificado ? `<a class="btn btn-primario" href="/unilts/certificado.html?c=${encodeURIComponent(r.certificado)}" target="_blank" rel="noopener">${IC.cert} Abrir certificado</a>` : ""}<a class="btn btn-contorno" href="#c/${m.id}">Voltar ao curso</a></div></div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  /* ---------- rotas ---------- */
  function rotear() {
    if (!st.aluno) return telaLogin();
    if (st.aluno.trocar_senha) return telaTroca();
    const p = location.hash.replace(/^#/, "").split("/");
    if (p[0] === "c" && p[1]) abrirCurso(p[1], p[2], p[3]);
    else { st.curso = null; telaCursos(); }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", rotear);
  // links internos do AVA (#cursos, #c/...) tratados aqui: funcionam mesmo com <base> no documento
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#c/"], a[href="#cursos"]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); location.hash = a.getAttribute("href").slice(1);
  });
  (async () => {
    const r = await api("sessao");
    if (r.ok) { st.aluno = r.aluno; topo(); rotear(); } else telaLogin();
  })();
})();
