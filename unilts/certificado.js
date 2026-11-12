/* UniLTS · certificado (A4 paisagem, frente e verso) conforme a NR 01, com QR Code de validação.
   Busca os dados como aluno (CPF completo), como equipe do L³ INTEGRA (CPF completo) ou, sem login,
   pela validação pública (CPF mascarado). */
(function () {
  const C = window.LTS_CONFIG, DEMO = !!(C.api && C.api.modoDemonstracao);
  const codigo = new URLSearchParams(location.search).get("c") || "";
  const el = document.getElementById("cert"), status = document.getElementById("cert-status"), bt = document.getElementById("bt-pdf");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const data = d => d ? new Date(String(d).length === 10 ? d + "T12:00:00" : d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  const nota = n => n === null || n === undefined ? "—" : Number(n).toFixed(2).replace(".", ",");

  async function buscar() {
    if (DEMO) {
      const r = await window.UNI_DEMO.aluno("certificado", { query: { c: codigo } });
      if (r.ok) return r.certificado;
      for (const k of ["empresa", "parceiro"]) { const x = await window.UNI_DEMO[k]("certificado", { query: { c: codigo } }); if (x.ok) return x.certificado; }
      const p = await window.UNI_DEMO.painel("uni_certificado", {}, { c: codigo });
      if (p && p.ok && sessionStorage.getItem("l3_demo_sessao")) return p.certificado;
      const v = window.UNI_DEMO.validar(codigo); return v.ok ? v.certificado : null;
    }
    for (const u of [`uni?acao=certificado&c=`, `painel?acao=uni_certificado&c=`, `empresa?acao=certificado&c=`, `parceiro?acao=certificado&c=`, `certificado?c=`]) {
      try { const r = await fetch(C.api.base + u + encodeURIComponent(codigo), { credentials: "same-origin" }); if (r.ok) { const j = await r.json(); if (j.ok) return j.certificado; } } catch (e) {}
    }
    return null;
  }
  buscar().then(c => {
    if (!c) { status.textContent = "Certificado não encontrado."; el.innerHTML = `<p class="nao">Certificado não encontrado. Confira o código ou valide em lippmannts.com/validar.html.</p>`; return; }
    document.title = `Certificado ${c.codigo} | UniLTS`;
    el.innerHTML = window.UNI_CERT.html(c);
    status.textContent = c.status === "valido" ? `Certificado válido · ${c.codigo}` : c.status === "vencido" ? "Certificado vencido" : c.status === "revogado" ? "CERTIFICADO REVOGADO · compra cancelada · sem validade legal e sem autorização de uso da LIPPMANN" : "Certificado cancelado";
    if (c.status === "revogado") { status.classList.add("revogado"); el.classList.add("revogado"); }
    bt.disabled = c.status === "cancelado" || c.status === "revogado";
    const ajustar = () => { const z = Math.min(1, (window.innerWidth - 24) / 1123); el.querySelectorAll(".folha").forEach(f => f.style.zoom = z < 1 ? z : ""); };
    ajustar(); window.addEventListener("resize", ajustar);
    window.addEventListener("beforeprint", () => el.querySelectorAll(".folha").forEach(f => f.style.zoom = ""));
    window.addEventListener("afterprint", ajustar);
    if (c.status !== "valido") el.classList.add("invalido");
  });
  bt.onclick = () => window.print();
})();
