/* UniLTS · desenho do certificado (frente e verso, A4 paisagem) · usado pela página do certificado e pelo relatório FR-DOC-18 */
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const data = d => d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const nota = n => n === null || n === undefined ? "—" : Number(n).toFixed(2).replace(".", ",");

  function qr(texto) {
    if (!window.qrcode) return "";
    const q = window.qrcode(0, "M"); q.addData(texto); q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }
  const assinatura = (img, nome, qual, papel) => `<div class="ass">
      <div class="ass-img">${img ? `<img src="${esc(img)}" alt="">` : ""}</div>
      <div class="ass-linha"></div><b>${esc(nome || "")}</b><span>${esc(qual || "")}</span><small>${papel}</small></div>`;

  function html(c) {
    const h = String(c.carga_horaria).replace(".", ",");
  return `
    <section class="folha frente">
      <div class="moldura">
        <div class="losangos" aria-hidden="true"><i></i><i></i><i></i></div>
        <header class="cab">
          <img class="logo" src="/assets/img/marca/LTS-LOGO-HOR-AZUL_REV01.svg" alt="LIPPMANN Treinamentos e Soluções">
          <div class="uni"><span>Uni<b>LTS</b></span><small>Ensino a distância</small></div>
        </header>
        <h1>Certificado</h1>
        <p class="sub">de conclusão de capacitação</p>
        <p class="texto">Certificamos que</p>
        <p class="nome">${esc(c.nome)}</p>
        <p class="texto">${c.cpf ? `inscrito(a) no CPF ${esc(c.cpf)}, ` : ""}concluiu com aproveitamento o curso
          <strong>${esc(c.curso)}</strong>${c.nr ? ` (${esc(c.nr)})` : ""}, na modalidade ${esc(c.modalidade || "EaD")}, com carga horária de <strong>${h} horas</strong>,
          realizado de ${data(c.inicio)} a ${data(c.concluido_em)}, no ${esc(c.local || "AVA UniLTS")}, obtendo nota final <strong>${nota(c.nota)}</strong>.</p>
        <div class="assinaturas">
          ${assinatura(c.instrutor_assinatura, c.instrutor_nome, c.instrutor_qualificacao, "Instrutor")}
          ${assinatura(c.rt_assinatura, c.rt_nome, c.rt_qualificacao, "Responsável técnico")}
          ${assinatura("", c.nome, "", "Trabalhador")}
        </div>
        <footer class="pe">
          <div class="qr">${qr(c.url_validacao)}</div>
          <div class="pe-txt">
            <b>Código de validação: ${esc(c.codigo)}</b>
            <span>Confira a autenticidade em lippmannts.com/validar.html ou pelo QR Code.</span>
            <span>Turma ${esc(c.turma)} · Emitido em ${data(c.concluido_em)} · ${esc(c.emissor)}</span>
          </div>
        </footer>
      </div>
    </section>
    <section class="folha verso">
      <div class="moldura">
        <header class="cab"><img class="logo" src="/assets/img/marca/LTS-LOGO-HOR-AZUL_REV01.svg" alt=""><div class="uni"><span>Uni<b>LTS</b></span><small>${esc(c.codigo)}</small></div></header>
        <div class="verso-grid">
          <div>
            <h2>Conteúdo programático</h2>
            <ol class="cp">${(c.conteudo_programatico || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          </div>
          <div>
            <h2>Dados da capacitação</h2>
            <table class="dados"><tbody>
              <tr><th>Curso</th><td>${esc(c.curso)}</td></tr>
              ${c.norma ? `<tr><th>Referência normativa</th><td>${esc(c.norma)}</td></tr>` : ""}
              <tr><th>Modalidade</th><td>${esc(c.modalidade || "EaD")}</td></tr>
              <tr><th>Carga horária</th><td>${h} horas</td></tr>
              <tr><th>Turma</th><td>${esc(c.turma)}</td></tr>
              <tr><th>Período</th><td>${data(c.inicio)} a ${data(c.concluido_em)}</td></tr>
              <tr><th>Local</th><td>${esc(c.local || "AVA UniLTS")}</td></tr>
              <tr><th>Avaliação</th><td>Nota final ${nota(c.nota)} (mínimo 7,00)</td></tr>
              <tr><th>Validade</th><td>${c.valido_ate ? "Até " + data(c.valido_ate) : "Conforme a norma aplicável e a política do empregador"}</td></tr>
              <tr><th>Instrutor</th><td>${esc(c.instrutor_nome || "")}${c.instrutor_qualificacao ? " · " + esc(c.instrutor_qualificacao) : ""}</td></tr>
              <tr><th>Responsável técnico</th><td>${esc(c.rt_nome || "")}${c.rt_qualificacao ? " · " + esc(c.rt_qualificacao) : ""}</td></tr>
            </tbody></table>
            <p class="nota-legal">Capacitação realizada em ambiente virtual de aprendizagem com registro de acessos, aulas concluídas e avaliações, conforme a NR 01 e seu Anexo II. Este certificado deve ser disponibilizado ao trabalhador e arquivado pela organização.</p>
          </div>
        </div>
        <footer class="pe pe-verso"><span>LIPPMANN Treinamentos e Soluções · CNPJ 53.000.126/0001-22 · lippmannts.com · (11) 94013-8792</span><span>Segurança não é prioridade. Segurança é valor.</span></footer>
      </div>
    </section>`;
  }
  window.UNI_CERT = { html };
})();
