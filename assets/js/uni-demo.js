/* =====================================================================
   UniLTS · MODO DEMONSTRAÇÃO
   Simula, no próprio navegador, as funções /api/uni, /api/empresa, /api/parceiro,
   /api/certificado e as ações UniLTS do painel. Usado somente com
   "modoDemonstracao": true. Dados fictícios no localStorage deste navegador.
   ===================================================================== */
(function () {
  "use strict";
  const C = window.LTS_CONFIG;
  if (!C || !C.api || !C.api.modoDemonstracao) return;
  const CHAVE = "l3_demo_uni_v4";
  const DIA = 86400000;
  const agora = () => new Date().toISOString();
  const dias = n => new Date(Date.now() + n * DIA).toISOString();
  const ok = (x = {}) => ({ ok: true, ...x });
  const nao = (m, x = {}) => ({ ok: false, mensagem: m, ...x });
  const soDig = v => String(v || "").replace(/\D/g, "");
  const fmtCpf = c => { c = soDig(c); return c.length === 11 ? `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}` : c; };
  const mascCpf = c => { c = soDig(c); return c.length === 11 ? `${c.slice(0, 3)}.***.***-**` : ""; };
  const fmtCnpj = c => { c = soDig(c); return c.length === 14 ? `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}` : c; };
  const cpfValido = cpf => { const c = soDig(cpf); if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false; const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +c[9] && dv(10) === +c[10]; };
  const cnpjValido = v => { const c = soDig(v); if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false; const calc = n => { const p = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; const s = p.reduce((a, w, i) => a + +c[i] * w, 0) % 11; return s < 2 ? 0 : 11 - s; }; return calc(12) === +c[12] && calc(13) === +c[13]; };
  const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ""));
  const senhaAleatoria = () => { const A = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; let s; do { s = Array.from(crypto.getRandomValues(new Uint8Array(10)), x => A[x % A.length]).join(""); } while (!(/[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s))); return s; };
  const senhaFraca = n => { n = String(n || ""); if (n.length < 8) return "A nova senha deve ter ao menos 8 caracteres."; if (!/[A-Za-z]/.test(n) || !/\d/.test(n)) return "A nova senha deve misturar letras e números."; return ""; };
  const sufixo = () => Array.from(crypto.getRandomValues(new Uint8Array(2)), x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  const slug = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "curso";
  const idYt = u => { const m = String(u || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || String(u || "").match(/^([\w-]{11})$/); return m ? m[1] : ""; };
  const proxId = l => Math.max(0, ...l.map(x => +x.id || 0)) + 1;
  const DOCS = { "FR-DOC-02": "FR-DOC-02 · Lista de Presença", "FR-DOC-04": "FR-DOC-04 · Avaliação de Reação", "FR-DOC-09": "FR-DOC-09 · Avaliação Prática", "FR-DOC-11": "FR-DOC-11 · Avaliação Teórica", "TERMO-IMAGEM": "Termos de autorização de uso de imagem", "CREDENCIAL": "Credencial do instrutor (MTE/CREA)" };
  const FOTOS = { "1-selfie": "1. Selfie com o Grupo", "2-teorico": "2. Exercício Teórico", "3-pratico": "3. Exercício Prático", "4-final": "4. Foto Final com a Turma" };
  const TIPOS_ASO = ["Admissional", "Periódico", "Retorno ao trabalho", "Mudança de risco ocupacional", "Demissional"];

  /* ---------- dados de exemplo ---------- */
  function semente() {
    const modelo = JSON.parse(JSON.stringify(window.UNI_CURSO_MODELO || {})); modelo.ativo = true; modelo.preco = 89.9; modelo.venda_online = true;
    const extra = (id, titulo, nr, ch, preco, imagem, resumo) => ({ ...JSON.parse(JSON.stringify(modelo)), id, titulo, nr, carga_horaria: ch, preco, imagem, resumo, venda_online: true });
    const todas = {}; (modelo.modulos || []).forEach(m => m.aulas.forEach(a => { todas[a.id] = dias(-6); }));
    const db = { cursos: [modelo,
      extra("nr35-teoria-ead", "NR 35 · Trabalho em Altura (módulo teórico EaD)", "NR 35", 8, 149.9, "/assets/img/treinamentos/nr35-trabalho-altura.webp", "Parte teórica da capacitação em trabalho em altura: análise de risco, sistemas de proteção, EPI e resgate. A prática é presencial."),
      extra("assedio-ead", "Prevenção e Combate ao Assédio Sexual e Outras Violências", "NR 01 / NR 05", 2, 59.9, "/assets/img/treinamentos/assedio.webp", "Conceitos, canais de denúncia e responsabilidades, conforme a Lei 14.457/2022 e a NR 05."),
      ...(window.UNI_CURSO_TRILHA ? [{ ...JSON.parse(JSON.stringify(window.UNI_CURSO_TRILHA)), ativo: true }] : [])],
      pedidos: [], lancamentos: [], historico: [], contador: 38, alunos: [], turmas: [], matriculas: [], registros: [], empresas: [], empresa_usuarios: [], parceiros: [], colaboradores: [], arquivos: [], seq: 1 };
    const T = (id, numero, extra) => db.turmas.push({ id, numero, codigo: `T${String(numero).padStart(5, "0")}-E2026`, curso_id: modelo.id, tipo: "b2c", modalidade: "ead", prazo_dias: 30, local: "AVA UniLTS · lippmannts.com (EaD)", instrutor_nome: modelo.instrutor_nome, status: "aberta", criado: dias(-15), empresa_id: null, parceiro_id: null, ...extra });
    T(1, 33, { inicio: dias(-14).slice(0, 10), fim: dias(16).slice(0, 10) });
    T(2, 34, { inicio: dias(-1).slice(0, 10), fim: dias(29).slice(0, 10) });
    db.empresas.push({ id: 1, razao_social: "Metalúrgica Alfa Indústria e Comércio Ltda", nome_fantasia: "Metalúrgica Alfa", cnpj: "11222333000181", contato_nome: "Fernanda Rocha", contato_email: "rh@metalurgicaalfa.com.br", contato_telefone: "(11) 4000-1000", ativo: true, criado: dias(-30) });
    db.empresa_usuarios.push({ id: 1, empresa_id: 1, nome: "Fernanda Rocha", email: "empresa@demo.com", senha: "Demo2026", trocar_senha: true, ativo: true, ultimo_acesso: null });
    db.parceiros.push({ id: 1, nome: "Ricardo Mendes Pereira", cpf: "71428793860", email: "instrutor@demo.com", telefone: "(11) 98888-7777", qualificacao: "Técnico de Segurança do Trabalho · Instrutor NR 35 e NR 33", registro: "MTE 0012345/SP", senha: "Demo2026", trocar_senha: true, ativo: true, ultimo_acesso: null });
    T(3, 35, { tipo: "b2b", empresa_id: 1, inicio: dias(-28).slice(0, 10), fim: dias(30).slice(0, 10) });
    T(4, 36, { tipo: "b2b", empresa_id: 1, parceiro_id: 1, modalidade: "presencial", instrutor_nome: "Ricardo Mendes Pereira", local: "Metalúrgica Alfa · Rua das Indústrias, 500 · Jundiaí/SP", inicio: dias(-10).slice(0, 10), fim: dias(-10).slice(0, 10), status: "encerrada", encerrada_em: dias(-9), concluida_parceiro: dias(-9) });
    T(5, 37, { tipo: "b2b", empresa_id: 1, parceiro_id: 1, modalidade: "presencial", instrutor_nome: "Ricardo Mendes Pereira", local: "Metalúrgica Alfa · Galpão 2 · Jundiaí/SP", inicio: dias(3).slice(0, 10), fim: dias(3).slice(0, 10) });
    const pessoas = [
      ["Mariana Alves Ribeiro", "52998224725", "mariana.ribeiro@exemplo.com.br", "Metalúrgica Alfa", [8.0]],
      ["Carlos Henrique Souza", "11144477735", "carlos.souza@exemplo.com.br", "Construtora Beta", [6.0, 9.0]],
      ["Patrícia Gomes Lima", "39053344705", "patricia.lima@exemplo.com.br", "", [10.0]],
      ["Rafael Martins Costa", "15350946056", "rafael.costa@exemplo.com.br", "Logística Gama", [5.0, 6.0, 6.0]],
      ["Juliana Pereira Santos", "71428793860", "juliana.santos@exemplo.com.br", "Metalúrgica Alfa", [7.0]],
      ["Bruno Oliveira Nunes", "86288366757", "bruno.nunes@exemplo.com.br", "", null]
    ];
    let cert = 0;
    const log = (aid, mid, acao, t, det = "") => db.registros.push({ aluno_id: aid, matricula_id: mid, acao, detalhe: det, t });
    pessoas.forEach(([nome, cpf, email, empresa, notas], i) => {
      const a = { id: i + 1, nome, cpf, email, empresa, telefone: `(11) 9${8000 + i}-12${10 + i}`, senha: "Exemplo2026", trocar_senha: false, ativo: true, criado: dias(-14), ultimo_acesso: dias(-3 + (i % 3)) };
      db.alunos.push(a);
      const m = { id: db.seq++, aluno_id: a.id, turma_id: 1, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: dias(-14), prazo_ate: dias(16), resets: 0 };
      log(a.id, null, "login", dias(-13)); log(a.id, m.id, "acesso_curso", dias(-13)); log(a.id, null, "logout", dias(-13 + 0.05));
      if (notas) {
        m.aulas = { ...todas }; Object.keys(todas).forEach((id, k) => log(a.id, m.id, "aula_concluida", dias(-12 + k * 0.5), id));
        notas.forEach((n, k) => { m.tentativas.push({ n: k + 1, nota: n, acertos: n, total: 10, t: dias(-5 + k) }); log(a.id, m.id, "avaliacao", dias(-5 + k), `tentativa ${k + 1}: nota ${n.toFixed(2)}`); });
        const ult = notas[notas.length - 1]; m.nota = Math.max(...notas);
        if (ult >= 7) { m.status = "aprovado"; m.concluido_em = dias(-5 + notas.length - 1); m.certificado = `T00033-E2026-${String(++cert).padStart(3, "0")}-${["A7F2", "C93D", "1BE8", "D45C"][cert - 1]}`; }
        else if (notas.length >= 3) m.status = "reprovado";
      } else Object.keys(todas).slice(0, 5).forEach(id => { m.aulas[id] = dias(-2); log(a.id, m.id, "aula_concluida", dias(-2), id); });
      db.matriculas.push(m);
    });
    db.alunos.push({ id: 99, nome: "Aluno Demonstração", cpf: "12345678909", email: "aluno@demo.com", empresa: "", telefone: "", senha: "Demo2026", trocar_senha: true, ativo: true, criado: dias(-1), ultimo_acesso: null });
    db.matriculas.push({ id: db.seq++, aluno_id: 99, turma_id: 2, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: dias(-1), prazo_ate: dias(29), resets: 0 });
    // colaboradores da Metalúrgica Alfa
    const cols = [
      ["Mariana Alves Ribeiro", "52998224725", "M-1001", "Operadora de Produção", "Jundiaí", "Matriz", "Produção", "CC-1020", true, false, false, "mariana.ribeiro@exemplo.com.br", 1],
      ["Juliana Pereira Santos", "71428793860", "M-1002", "Técnica de Manutenção", "Jundiaí", "Matriz", "Manutenção", "CC-1030", true, true, true, "juliana.santos@exemplo.com.br", 5],
      ["Anderson Lima Ferreira", "45317828791", "M-1003", "Eletricista Industrial", "Jundiaí", "Matriz", "Manutenção", "CC-1030", true, false, true, "anderson.ferreira@exemplo.com.br", null],
      ["Beatriz Costa Moreira", "84434895885", "M-1004", "Analista de RH", "Campinas", "Filial Campinas", "Recursos Humanos", "CC-2010", false, false, false, "beatriz.moreira@exemplo.com.br", null],
      ["Diego Rodrigues Alves", "17758361005", "M-1005", "Operador de Empilhadeira", "Campinas", "Filial Campinas", "Logística", "CC-2050", false, false, false, "diego.alves@exemplo.com.br", null],
      ["Eduardo Santos Prado", "62648716050", "M-1006", "Soldador", "Jundiaí", "Matriz", "Produção", "CC-1020", true, true, false, "", null],
      ["Gabriela Nunes Teixeira", "43321684020", "M-1007", "Supervisora de Produção", "Jundiaí", "Matriz", "Produção", "CC-1020", true, false, false, "gabriela.teixeira@exemplo.com.br", null],
      ["Henrique Barros Castro", "26412362061", "M-1008", "Mecânico de Manutenção", "Campinas", "Filial Campinas", "Manutenção", "CC-2030", true, true, false, "henrique.castro@exemplo.com.br", null]
    ];
    cols.forEach(([nome, cpf, mat, cargo, unidade, filial, area, cc, alt, conf, ele, email, aid], i) => db.colaboradores.push({ id: i + 1, empresa_id: 1, nome, cpf, matricula: mat, rg: `${30 + i}.456.789-${i}`, admissao: dias(-400 - i * 60).slice(0, 10), aso_data: dias(-60 - i * 20).slice(0, 10), aso_tipo: i % 3 ? "Periódico" : "Admissional", apto_altura: alt, apto_confinado: conf, apto_eletricidade: ele, cargo, unidade, filial, centro_custo: cc, area, telefone: `(11) 9${7000 + i}-55${10 + i}`, email, aluno_id: aid, criado: dias(-20) }));
    db.colaboradores[0].aluno_id = 1; db.colaboradores[1].aluno_id = 5;
    // turma T00035 (EaD B2B): um aprovado, um com prazo quase no fim e um com prazo já estourado (será zerado ao abrir)
    const novoAluno = (col, extra = {}) => { const a = { id: proxId(db.alunos), nome: col.nome, cpf: col.cpf, email: col.email || null, empresa: "Metalúrgica Alfa", telefone: col.telefone, senha: "Exemplo2026", trocar_senha: false, ativo: true, criado: dias(-28), ultimo_acesso: dias(-2), ...extra }; db.alunos.push(a); col.aluno_id = a.id; return a; };
    const a3 = novoAluno(db.colaboradores[2]), a7 = novoAluno(db.colaboradores[6]);
    db.matriculas.push({ id: db.seq++, aluno_id: 5, turma_id: 3, colaborador_id: 2, status: "aprovado", aulas: { ...todas }, tentativas: [{ n: 1, nota: 9, acertos: 9, total: 10, t: dias(-20) }], nota: 9, certificado: "T00035-E2026-001-7A3E", concluido_em: dias(-20), criado: dias(-28), prazo_ate: dias(2), resets: 0 });
    const mA = { id: db.seq++, aluno_id: a3.id, turma_id: 3, colaborador_id: 3, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: dias(-26), prazo_ate: dias(4), resets: 0 };
    Object.keys(todas).slice(0, 6).forEach(id => mA.aulas[id] = dias(-10)); db.matriculas.push(mA);
    const mG = { id: db.seq++, aluno_id: a7.id, turma_id: 3, colaborador_id: 7, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: dias(-33), prazo_ate: dias(-3), resets: 0 };
    Object.keys(todas).slice(0, 3).forEach(id => mG.aulas[id] = dias(-25)); db.matriculas.push(mG);
    [a3, a7].forEach(a => { log(a.id, null, "login", dias(-20)); log(a.id, null, "logout", dias(-20 + 0.04)); });
    // turma T00036 (presencial concluída) com notas, documentos e fotos
    const presentes = [db.colaboradores[1], db.colaboradores[5], db.colaboradores[7]];
    presentes.forEach((col, i) => {
      const a = col.aluno_id ? db.alunos.find(x => x.id === col.aluno_id) : novoAluno(col, { email: col.email || null });
      const te = [9.5, 8, 6.5][i], pr = [10, 8.5, 9][i], aprov = te >= 7 && pr >= 7;
      const ent = new Date(new Date(dias(-10)).setHours(8, 0, 0, 0)).toISOString(), sai = new Date(new Date(dias(-10)).setHours(17, 10, 0, 0)).toISOString();
      const m = { id: db.seq++, aluno_id: a.id, turma_id: 4, colaborador_id: col.id, status: aprov ? "aprovado" : "reprovado", aulas: {}, tentativas: [], nota: (te + pr) / 2, nota_teorica: te, nota_pratica: pr, presenca_entrada: ent, presenca_saida: sai, certificado: aprov ? `T00036-E2026-00${i + 1}-${["B2C1", "E9F0", ""][i]}` : null, concluido_em: aprov ? dias(-10) : null, criado: dias(-12), resets: 0 };
      db.matriculas.push(m);
      log(a.id, m.id, "notas_presenca", dias(-9), `teórica ${te} · prática ${pr} · entrada ${ent} · saída ${sai} (parceiro:instrutor@demo.com)`);
      log(a.id, m.id, "resultado_presencial", dias(-9), `${aprov ? "aprovado" : "reprovado"} (parceiro:instrutor@demo.com)`);
    });
    Object.keys(DOCS).forEach((k, i) => db.arquivos.push({ id: i + 1, turma_id: 4, categoria: "documento", tipo: k, legenda: DOCS[k], caminho: "demo", url: "/downloads/fichas/nr35-trabalho-altura.pdf", nome_original: `${k}-digitalizado.pdf`, criado: dias(-9), enviado_por: "parceiro:instrutor@demo.com" }));
    const legs = ["Instrutor com os 3 participantes na abertura do treinamento", "Avaliação teórica individual na sala de treinamento", "Prática de ancoragem e inspeção de cinto paraquedista", "Encerramento com a turma e entrega dos certificados"];
    Object.keys(FOTOS).forEach((k, i) => db.arquivos.push({ id: 10 + i, turma_id: 4, categoria: "foto", tipo: k, legenda: `${FOTOS[k]} · ${legs[i]}`, caminho: "demo", url: `/assets/img/demo/evidencia-${i + 1}.jpg`, nome_original: `IMG_20${i}.jpg`, largura: 1600, altura: 1200, bytes: 4200000 + i * 150000, criado: dias(-9), enviado_por: "parceiro:instrutor@demo.com" }));
    // turma T00037 (presencial aberta) com um participante e uma foto enviada
    const a4 = novoAluno(db.colaboradores[3]);
    db.matriculas.push({ id: db.seq++, aluno_id: a4.id, turma_id: 5, colaborador_id: 4, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: dias(-1), resets: 0 });
    // vendas on-line, histórico de aprovações (ESG) e lançamentos dos últimos 6 meses
    let sementeAle = 7; const ale = () => (sementeAle = (sementeAle * 9301 + 49297) % 233280) / 233280;
    const nomesV = ["Ana Paula Ramos", "Bruno Henrique Dias", "Camila Souza Prado", "Daniel Ferreira Lopes", "Elaine Cristina Mota", "Felipe Augusto Reis", "Gisele Martins Luz", "Hugo Carvalho Neto", "Isabela Duarte Faria", "João Victor Pires", "Karina Lopes Rocha", "Leandro Silva Couto", "Marcos Vinícius Teles", "Natália Gomes Braga"];
    for (let i = 0; i < 58; i++) {
      const c = db.cursos[ale() < .45 ? 0 : ale() < .65 ? 1 : 2], dd = -Math.floor(ale() * 175) - 1, met = ale() < .62 ? "pix" : "cartao", nome = nomesV[i % nomesV.length];
      const st = i === 3 || i === 17 || i === 41 ? "estornado" : i === 9 || i === 30 ? "recusado" : "aprovado";
      const quando = dias(dd);
      db.pedidos.push({ id: i + 1, codigo: `PED-${quando.slice(0, 10).replace(/-/g, "")}-${(1000 + i * 37).toString(16).toUpperCase()}`, curso_id: c.id, nome, cpf: "52998224725", email: nome.split(" ")[0].toLowerCase() + i + "@exemplo.com.br", valor: c.preco, metodo: met, parcelas: met === "cartao" ? 1 + Math.floor(ale() * 6) : 1, cartao_final: met === "cartao" ? String(1000 + Math.floor(ale() * 8999)) : null, status: st, taxa: st === "recusado" ? 0 : Math.round(c.preco * (met === "pix" ? .0099 : .0499) * 100) / 100, ambiente: "sandbox", pago_em: st === "recusado" ? null : quando, estornado_em: st === "estornado" ? dias(dd + 2) : null, estorno_motivo: st === "estornado" ? "Direito de arrependimento (7 dias)" : null, criado: quando, mp_id: `TEST-${100000 + i}` });
      if (st === "aprovado" && ale() < .8) db.historico.push({ data: dias(Math.min(-1, dd + 3 + Math.floor(ale() * 10))), curso_id: c.id });
    }
    db.pedidos.push({ id: 59, codigo: `PED-${agora().slice(0, 10).replace(/-/g, "")}-PIX01`, curso_id: modelo.id, nome: "Rodrigo Alves Pinto", cpf: "11144477735", email: "rodrigo@exemplo.com.br", valor: modelo.preco, metodo: "pix", parcelas: 1, status: "pendente", taxa: 0, ambiente: "sandbox", pix_copia_cola: "00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-PIX015204000053039865405" + modelo.preco.toFixed(2) + "5802BR5925LIPPMANN TREINAMENTOS6009SAO PAULO6304ABCD", pix_expira: dias(1 / 48), criado: agora() });
    for (let m = 0; m < 6; m++) {
      const d0 = new Date(); d0.setMonth(d0.getMonth() - m, 5); const dia = n => { const x = new Date(d0); x.setDate(n); return (x > new Date() ? new Date() : x).toISOString().slice(0, 10); };
      if (new Date(dia(5)) > new Date()) continue;
      [["Pró-labore e salários", 6500, "Pró-labore da Direção"], ["Aluguel e estrutura", 1800, "Sala de treinamento"], ["Software e sistemas", 480, "Hospedagem, e-mail e domínio"], ["Marketing e publicidade", 700 + Math.round(ale() * 900), "Anúncios e redes sociais"], ["Contabilidade e jurídico", 650, "Escritório contábil"], ["Instrutores parceiros", 1500 + Math.round(ale() * 2500), "Repasse de turmas presenciais"], ["Impostos e tributos", 900 + Math.round(ale() * 900), "Simples Nacional"], ["Materiais, EPIs e equipamentos", Math.round(ale() * 1200), "Cintos, talabartes e material didático"]]
        .forEach(([categoria, valor, descricao], k) => valor && db.lancamentos.push({ id: db.lancamentos.length + 1, tipo: "despesa", data: dia(5 + k * 2), categoria, descricao, valor, criado_por: "admin" }));
      db.lancamentos.push({ id: db.lancamentos.length + 1, tipo: "receita", data: dia(20), categoria: "Contrato B2B / in company", descricao: ["Metalúrgica Alfa · NR 35 e NR 33", "Construtora Beta · Integração SSMA", "Logística Gama · NR 11", "Indústria Delta · Brigada"][m % 4], valor: 17000 + Math.round(ale() * 12000), criado_por: "admin" });
      if (m % 3 !== 1) db.lancamentos.push({ id: db.lancamentos.length + 1, tipo: "receita", data: dia(25), categoria: "Consultoria e soluções técnicas", descricao: "Laudo técnico / PGR", valor: 4500 + Math.round(ale() * 5000), criado_por: "admin" });
      for (let k = 0; k < 6 + Math.floor(ale() * 10); k++) db.historico.push({ data: dia(10 + k), curso_id: ["nr35-teoria-ead", modelo.id][k % 2] });
    }
    db.arquivos.push({ id: 30, turma_id: 5, categoria: "foto", tipo: "1-selfie", legenda: `${FOTOS["1-selfie"]} · Abertura da turma no galpão 2`, caminho: "demo", url: "/assets/img/demo/evidencia-1.jpg", nome_original: "IMG_100.jpg", largura: 1600, altura: 1200, bytes: 3900000, criado: dias(-1), enviado_por: "parceiro:instrutor@demo.com" });
    return db;
  }
  const ler = () => { try { const d = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (d) return d; } catch (e) {} const d = semente(); gravar(d); return d; };
  const gravar = d => { try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) { alert("A demonstração atingiu o limite de armazenamento do navegador. Use imagens menores ou limpe os dados do site."); } };

  const curso = (db, id) => db.cursos.find(c => c.id === id);
  const turma = (db, id) => db.turmas.find(t => t.id === +id);
  const ids = c => (c.modulos || []).flatMap(m => (m.aulas || []).map(a => a.id));
  const progresso = (c, aulas) => { const t = ids(c), f = t.filter(i => aulas && aulas[i]).length; return { total: t.length, feitas: f, pct: t.length ? Math.round(f / t.length * 100) : 0 }; };
  const validas = m => (m.tentativas || []).filter(t => !t.descartada);
  const validadeAte = (c, d) => { if (!d || !+c.validade_meses) return null; const x = new Date(d); x.setMonth(x.getMonth() + +c.validade_meses); return x.toISOString(); };
  const registrar = (db, aid, mid, acao, det = "") => db.registros.push({ aluno_id: aid, matricula_id: mid, acao, detalhe: det, t: agora() });
  const diasRest = m => m.prazo_ate ? Math.max(0, Math.ceil((new Date(m.prazo_ate) - Date.now()) / DIA)) : null;
  function regras(db, m) {   // mesmas regras do servidor: prazo EaD e revogação após 12 meses
    const t = turma(db, m.turma_id); if (!t || m.status === "cancelado") return m;
    const fim = t.encerrada_em ? new Date(t.encerrada_em) : t.fim ? new Date(t.fim + "T23:59:59") : null;
    if (fim && !m.acesso_revogado && !m.reabilitado_por) { const rv = new Date(fim); rv.setMonth(rv.getMonth() + 12); if (new Date() > rv) { m.acesso_revogado = agora(); registrar(db, m.aluno_id, m.id, "acesso_revogado", "12 meses após o encerramento"); } }
    if (t.modalidade !== "presencial" && m.status === "em_andamento" && !m.acesso_revogado) {
      const d = +t.prazo_dias || 30;
      if (!m.prazo_ate) m.prazo_ate = new Date(Date.now() + d * DIA).toISOString();
      else if (new Date() > new Date(m.prazo_ate)) { registrar(db, m.aluno_id, m.id, "prazo_expirado_reset", `prazo de ${d} dias encerrado em ${m.prazo_ate}; progresso zerado`); m.aulas = {}; m.tentativas = (m.tentativas || []).map(x => ({ ...x, descartada: true, motivo: "prazo" })); m.nota = null; m.resets = (m.resets || 0) + 1; m.prazo_ate = new Date(Date.now() + d * DIA).toISOString(); }
    }
    return m;
  }
  function resumo(db, m) {
    const t = turma(db, m.turma_id), c = curso(db, t.curso_id), max = +c.tentativas_max || 3;
    return { id: m.id, status: m.status, nota: m.nota, nota_teorica: m.nota_teorica, nota_pratica: m.nota_pratica, certificado: m.certificado, concluido_em: m.concluido_em, aulas: m.aulas || {},
      prazo_ate: t.modalidade !== "presencial" ? m.prazo_ate : null, dias_restantes: t.modalidade !== "presencial" && m.status === "em_andamento" ? diasRest(m) : null, resets: m.resets || 0,
      tentativas: validas(m), tentativas_restantes: Math.max(0, max - validas(m).length), progresso: progresso(c, m.aulas),
      turma: { codigo: t.codigo, inicio: t.inicio, fim: t.fim, status: t.status, modalidade: t.modalidade || "ead", prazo_dias: t.prazo_dias || 30 },
      curso: { id: c.id, titulo: c.titulo, nr: c.nr, carga_horaria: +c.carga_horaria, imagem: c.imagem, resumo: c.resumo, nota_corte: +c.nota_corte, tentativas_max: max } };
  }
  function certificado(db, codigo, modo) {
    const m = db.matriculas.find(x => x.certificado && x.certificado === String(codigo || "").trim().toUpperCase());
    if (!m) return null;
    const a = db.alunos.find(x => x.id === m.aluno_id), t = turma(db, m.turma_id), c = curso(db, t.curso_id), ate = validadeAte(c, m.concluido_em), p = t.parceiro_id ? db.parceiros.find(x => x.id === t.parceiro_id) : null;
    const ped = m.pedido_id && db.pedidos.find(x => x.id === m.pedido_id), rev = m.status === "cancelado" && ped && ["estornado", "cancelado"].includes(ped.status);
    return { codigo: m.certificado, status: rev ? "revogado" : m.status !== "aprovado" ? "cancelado" : ate && new Date(ate) < new Date() ? "vencido" : "valido", revogacao: rev ? { em: ped.estornado_em, motivo: "Cancelamento da compra (reembolso)" } : null, aluno_id: a.id,
      nome: a.nome, cpf: modo === "completo" ? fmtCpf(a.cpf) : mascCpf(a.cpf), curso: c.titulo, nr: c.nr, norma: c.norma, modalidade: t.modalidade === "presencial" ? "Presencial" : t.modalidade === "hibrido" ? "Híbrida (Blended Learning)" : c.modalidade, carga_horaria: +c.carga_horaria,
      conteudo_programatico: c.conteudo_programatico || [], instrutor_nome: t.instrutor_nome || c.instrutor_nome, instrutor_qualificacao: p ? [p.qualificacao, p.registro].filter(Boolean).join(" · ") : c.instrutor_qualificacao, instrutor_assinatura: c.instrutor_assinatura,
      rt_nome: c.rt_nome, rt_qualificacao: c.rt_qualificacao, rt_assinatura: c.rt_assinatura, turma: t.codigo, inicio: t.inicio, local: t.local, nota: m.nota, concluido_em: m.concluido_em, valido_ate: ate,
      emissor: "LIPPMANN TREINAMENTOS E SOLUÇÕES LTDA · CNPJ 53.000.126/0001-22", url_validacao: `${C.urlOficial || "https://lippmannts.com"}/validar.html?c=${encodeURIComponent(m.certificado)}` };
  }
  function dadosTurma(db, id, op = {}) {
    const t = turma(db, id); if (!t) return null;
    const c = curso(db, t.curso_id), e = t.empresa_id ? db.empresas.find(x => x.id === t.empresa_id) : null, p = t.parceiro_id ? db.parceiros.find(x => x.id === t.parceiro_id) : null;
    const ms = db.matriculas.filter(m => m.turma_id === t.id).map(m => regras(db, m));
    const matriculas = ms.map(m => { const a = db.alunos.find(x => x.id === m.aluno_id) || {};
      return { id: m.id, status: m.status, nota: m.nota, nota_teorica: m.nota_teorica ?? null, nota_pratica: m.nota_pratica ?? null, certificado: m.certificado, concluido_em: m.concluido_em, criado: m.criado, presenca_entrada: m.presenca_entrada || null, presenca_saida: m.presenca_saida || null,
        prazo_ate: m.prazo_ate, dias_restantes: t.modalidade !== "presencial" && m.status === "em_andamento" ? diasRest(m) : null, resets: m.resets || 0, acesso_revogado: m.acesso_revogado || null,
        tentativas: validas(m).length, tentativas_max: +c.tentativas_max || 3, progresso: progresso(c, m.aulas),
        logs: db.registros.filter(r => r.aluno_id === m.aluno_id && (!r.matricula_id || r.matricula_id === m.id) && new Date(r.t) >= new Date(m.criado) - DIA).sort((x, y) => String(x.t).localeCompare(String(y.t))),
        aluno: { id: a.id, nome: a.nome, cpf: op.mascarar ? mascCpf(a.cpf) : fmtCpf(a.cpf), email: a.email, telefone: a.telefone, empresa: a.empresa, primeiro_acesso_pendente: a.trocar_senha, ultimo_acesso: a.ultimo_acesso } }; });
    gravar(db);
    return { turma: t, curso: c, empresa: e ? { ...e, cnpj: fmtCnpj(e.cnpj) } : null, parceiro: p ? { id: p.id, nome: p.nome, qualificacao: p.qualificacao, registro: p.registro } : null, matriculas,
      arquivos: db.arquivos.filter(a => a.turma_id === t.id), certificados: ms.filter(m => m.status === "aprovado" && m.certificado).map(m => certificado(db, m.certificado, op.mascarar ? "mascarado" : "completo")),
      documentos: DOCS, fotos: FOTOS, emissao: agora() };
  }
  const novoCert = (db, t) => `${t.codigo}-${String(db.matriculas.filter(x => x.turma_id === t.id && x.status === "aprovado").length + 1).padStart(3, "0")}-${sufixo()}`;
  function garantirAluno(db, { nome, cpf, email, empresa, telefone }) {
    let a = email ? db.alunos.find(x => x.email === email) : null, senha = "";
    if (!a) { if (email) senha = senhaAleatoria(); a = { id: proxId(db.alunos), nome, cpf: soDig(cpf), email: email || null, telefone: telefone || "", empresa: empresa || "", senha: senha || null, trocar_senha: true, ativo: true, criado: agora(), ultimo_acesso: null }; db.alunos.push(a); }
    else if (a.trocar_senha && email) { senha = senhaAleatoria(); a.senha = senha; }
    return { a, senha };
  }

  /* ---------- sessões dos portais (empresa e parceiro) ---------- */
  const sess = k => ({ get() { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }, set(v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} } });
  const sessaoAluno = sess("uni_demo_aluno"), sessaoEmp = sess("uni_demo_empresa"), sessaoPar = sess("uni_demo_parceiro");
  function portal(lista, sessao, acao, b) {   // login, logout, esqueci, sessao, trocar_senha
    const db = ler(), L = db[lista];
    if (acao === "login") { const u = L.find(x => x.email === String(b.email || "").trim().toLowerCase()); if (!u || !u.ativo || u.senha !== String(b.senha || "").trim()) return { r: nao("E-mail ou senha incorretos.") }; sessao.set(u.id); u.ultimo_acesso = agora(); gravar(db); return { r: ok({ usuario: { nome: u.nome, email: u.email, trocar_senha: u.trocar_senha } }) }; }
    if (acao === "logout") { sessao.set(0); return { r: ok() }; }
    if (acao === "esqueci") { const u = L.find(x => x.email === String(b.email || "").trim().toLowerCase()); if (u) { u.senha = senhaAleatoria(); u.trocar_senha = true; gravar(db); return { r: ok({ mensagem: `Demonstração: nova senha provisória: ${u.senha}` }) }; } return { r: ok({ mensagem: "Se o e-mail estiver cadastrado, você receberá uma nova senha provisória." }) }; }
    const u = L.find(x => x.id === sessao.get() && x.ativo);
    if (!u) return { r: nao("Sua sessão expirou. Entre novamente.", { status: 401 }) };
    if (acao === "sessao") return { r: ok({ usuario: { nome: u.nome, email: u.email, trocar_senha: u.trocar_senha } }) };
    if (acao === "trocar_senha") { if (String(b.atual || "").trim() !== u.senha) return { r: nao("A senha atual não confere.") }; const f = senhaFraca(b.nova); if (f) return { r: nao(f) }; if (b.nova === u.senha) return { r: nao("A nova senha deve ser diferente da provisória.") }; u.senha = b.nova; u.trocar_senha = false; gravar(db); return { r: ok({ mensagem: "Senha alterada com sucesso." }) }; }
    if (u.trocar_senha) return { r: nao("Troque a senha provisória para continuar.", { trocar_senha: true }) };
    return { db, u };
  }

  /* ---------- Área do aluno ---------- */
  async function aluno(acao, { corpo: b = {}, query = {} } = {}) {
    const db = ler();
    if (acao === "cursos") return ok({ cursos: db.cursos.filter(c => c.ativo !== false && !c.interno).map(c => ({ id: c.id, titulo: c.titulo, nr: c.nr, carga_horaria: c.carga_horaria, resumo: c.resumo, imagem: c.imagem, modalidade: c.modalidade, preco: c.preco, venda_online: c.venda_online })) });
    if (acao === "login") {
      const a = db.alunos.find(x => x.email && x.email === String(b.email || "").trim().toLowerCase());
      if (!a || !a.ativo || !a.senha || a.senha !== String(b.senha || "").trim()) return nao("E-mail ou senha incorretos.");
      const mats = db.matriculas.filter(m => m.aluno_id === a.id && m.status !== "cancelado").map(m => regras(db, m));
      if (!mats.length && db.matriculas.some(m => m.aluno_id === a.id)) return nao(db.matriculas.some(m => m.aluno_id === a.id && m.pedido_id) ? "Acesso bloqueado: a compra deste curso foi cancelada pelo usuário (reembolso). As aulas, apostilas e avaliações não estão mais disponíveis e o certificado, se emitido, foi revogado. Dúvidas: WhatsApp (11) 94013-8792." : "Você não tem matrículas ativas na UniLTS (o curso foi cancelado). Dúvidas: WhatsApp (11) 94013-8792.");
      if (mats.length && mats.every(m => m.acesso_revogado)) { gravar(db); return nao("Seu acesso à UniLTS expirou (12 meses após o encerramento da turma). Para reabilitá-lo, fale com a LIPPMANN pelo WhatsApp (11) 94013-8792."); }
      sessaoAluno.set(a.id); a.ultimo_acesso = agora(); registrar(db, a.id, null, "login"); gravar(db);
      return ok({ aluno: { nome: a.nome, email: a.email, cpf: mascCpf(a.cpf), trocar_senha: a.trocar_senha } });
    }
    if (acao === "logout") { const id = sessaoAluno.get(); if (id) { registrar(db, id, null, "logout"); gravar(db); } sessaoAluno.set(0); return ok(); }
    if (acao === "esqueci") {
      const a = db.alunos.find(x => x.email && x.email === String(b.email || "").trim().toLowerCase());
      if (a) { a.senha = senhaAleatoria(); a.trocar_senha = true; gravar(db); return ok({ mensagem: `Demonstração: no servidor, a nova senha provisória seria enviada por e-mail. Use: ${a.senha}` }); }
      return ok({ mensagem: "Se o e-mail estiver cadastrado, você receberá uma nova senha provisória em instantes." });
    }
    const a = db.alunos.find(x => x.id === sessaoAluno.get());
    if (!a) return nao("Sua sessão expirou. Entre novamente.", { status: 401 });
    if (acao === "sessao") return ok({ aluno: { nome: a.nome, email: a.email, cpf: mascCpf(a.cpf), trocar_senha: a.trocar_senha } });
    if (acao === "trocar_senha") {
      if (String(b.atual || "").trim() !== a.senha) return nao("A senha atual não confere.");
      const f = senhaFraca(b.nova); if (f) return nao(f);
      if (b.nova === a.senha) return nao("A nova senha deve ser diferente da provisória.");
      a.senha = b.nova; a.trocar_senha = false; registrar(db, a.id, null, "senha_alterada"); gravar(db); return ok({ mensagem: "Senha alterada com sucesso." });
    }
    if (a.trocar_senha) return nao("Troque a senha provisória para continuar.", { trocar_senha: true });
    const minha = id => { const m = db.matriculas.find(m => m.id === +id && m.aluno_id === a.id && m.status !== "cancelado"); if (m) regras(db, m); return m && !m.acesso_revogado ? m : null; };
    let r;
    switch (acao) {
      case "painel": r = ok({ matriculas: db.matriculas.filter(m => m.aluno_id === a.id && m.status !== "cancelado").map(m => regras(db, m)).filter(m => !m.acesso_revogado).map(m => resumo(db, m)) }); break;
      case "curso": {
        const m = minha(query.m); if (!m) return nao("Matrícula não encontrada.");
        const t = turma(db, m.turma_id), c = curso(db, t.curso_id), rs = resumo(db, m);
        registrar(db, a.id, m.id, "acesso_curso");
        const lib = t.modalidade !== "presencial" && rs.progresso.total && rs.progresso.feitas === rs.progresso.total && m.status === "em_andamento" && rs.tentativas_restantes > 0 && !(t.modalidade === "hibrido" && m.nota_teorica != null);
        r = ok({ ...rs, conteudo: { plano_ensino: c.plano_ensino, mapa_mental: c.mapa_mental, conteudo_programatico: c.conteudo_programatico, modulos: t.modalidade === "presencial" ? [] : c.modulos, modalidade: t.modalidade === "presencial" ? "Presencial" : c.modalidade, norma: c.norma, instrutor_nome: t.instrutor_nome || c.instrutor_nome },
          avaliacao: lib ? c.avaliacao.map(q => ({ pergunta: q.pergunta, alternativas: q.alternativas })) : null }); break;
      }
      case "aula": {
        const m = minha(b.m); if (!m) return nao("Matrícula não encontrada.");
        const t = turma(db, m.turma_id), c = curso(db, t.curso_id);
        if (t.modalidade === "presencial") return nao("Turma presencial: as notas são lançadas pelo instrutor.");
        if (!ids(c).includes(b.aula)) return nao("Aula não encontrada.");
        m.aulas = m.aulas || {}; if (!m.aulas[b.aula]) { m.aulas[b.aula] = agora(); registrar(db, a.id, m.id, "aula_concluida", b.aula); }
        r = ok({ aulas: m.aulas, progresso: progresso(c, m.aulas) }); break;
      }
      case "avaliacao": {
        const m = minha(b.m); if (!m) return nao("Matrícula não encontrada.");
        const t = turma(db, m.turma_id), c = curso(db, t.curso_id), max = +c.tentativas_max || 3;
        if (t.modalidade === "presencial") return nao("Turma presencial: as notas são lançadas pelo instrutor.");
        if (t.modalidade === "hibrido" && m.nota_teorica != null && m.nota_teorica >= +c.nota_corte) return nao("Parte teórica já aprovada. Aguarde a avaliação prática presencial.");
        if (m.status !== "em_andamento") return nao(m.status === "aprovado" ? "Você já foi aprovado neste curso." : "Não há tentativas disponíveis. Fale com a coordenação.");
        const p = progresso(c, m.aulas); if (p.feitas < p.total) return nao("Conclua todas as aulas para liberar a avaliação.");
        const usadas = validas(m).length; if (usadas >= max) return nao("Você já utilizou todas as tentativas.");
        const rr = b.respostas || []; if (rr.length !== c.avaliacao.length || rr.some(x => x === null || x === undefined || x === "")) return nao("Responda todas as questões antes de enviar.");
        let ac = 0; c.avaliacao.forEach((q, i) => { if (+rr[i] === +q.correta) ac++; });
        const nota = Math.round(ac / c.avaliacao.length * 1000) / 100, aprovado = nota >= +c.nota_corte, restantes = max - usadas - 1;
        m.tentativas.push({ n: m.tentativas.length + 1, nota, acertos: ac, total: c.avaliacao.length, t: agora() });
        registrar(db, a.id, m.id, "avaliacao", `tentativa ${m.tentativas.length}: nota ${nota.toFixed(2)}`);
        m.nota = Math.max(+m.nota || 0, nota);
        if (aprovado && t.modalidade === "hibrido") { m.nota_teorica = nota; gravar(db); return ok({ nota, acertos: ac, total: c.avaliacao.length, aprovado: true, aguardando_pratica: true, restantes, certificado: null, nota_corte: +c.nota_corte }); }
        if (aprovado) { m.status = "aprovado"; m.nota = nota; m.concluido_em = agora(); m.certificado = novoCert(db, t); }
        else if (restantes <= 0) m.status = "reprovado";
        r = ok({ nota, acertos: ac, total: c.avaliacao.length, aprovado, restantes: Math.max(0, restantes), certificado: m.certificado, nota_corte: +c.nota_corte }); break;
      }
      case "certificado": { const d = certificado(db, query.c, "completo"); return d && d.aluno_id === a.id ? ok({ certificado: d }) : nao("Certificado não encontrado."); }
      case "pedidos": { const nomes = Object.fromEntries(db.cursos.map(c => [c.id, c.titulo])); return ok({ pedidos: db.pedidos.filter(p => p.aluno_id === a.id || p.email === a.email).map(p => ({ codigo: p.codigo, curso: nomes[p.curso_id], valor: p.valor, metodo: p.metodo, status: p.status, criado: p.criado, pago_em: p.pago_em, estornado_em: p.estornado_em, reembolso_ate: p.pago_em ? new Date(new Date(p.pago_em).getTime() + 7 * DIA).toISOString() : null, reembolsavel: p.status === "aprovado" && garantiaOk(p) })) }); }
      case "reembolso": return nao("Para cancelar, envie o pedido formal para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792 com: código da compra, nome completo, CPF, e-mail e forma de pagamento.");
      default: return nao("Ação indisponível na demonstração.");
    }
    gravar(db); return r;
  }

  /* ---------- Pagamentos (checkout) ---------- */
  const garantiaOk = p => p.pago_em && Date.now() - new Date(p.pago_em).getTime() <= 7 * DIA;
  const pedPub = p => ({ codigo: p.codigo, status: p.status, metodo: p.metodo, valor: +p.valor, parcelas: p.parcelas, cartao_final: p.cartao_final, pix_copia_cola: p.status === "pendente" ? p.pix_copia_cola : null, pix_expira: p.pix_expira, pago_em: p.pago_em, estornado_em: p.estornado_em, ambiente: "simulacao", email: p.email, mp_detalhe: p.mp_detalhe,
    reembolso_ate: p.pago_em ? new Date(new Date(p.pago_em).getTime() + 7 * DIA).toISOString() : null, reembolsavel: p.status === "aprovado" && garantiaOk(p) });
  function liberar(db, p) {
    if (p.matricula_id) return "";
    let t = db.turmas.filter(t => t.curso_id === p.curso_id && t.tipo === "b2c" && t.modalidade === "ead" && t.status === "aberta").sort((a, z) => z.numero - a.numero)[0];
    if (!t) { const n = db.contador++; t = { id: proxId(db.turmas), numero: n, codigo: `T${String(n).padStart(5, "0")}-E${agora().slice(0, 4)}`, curso_id: p.curso_id, tipo: "b2c", modalidade: "ead", prazo_dias: 30, inicio: agora().slice(0, 10), fim: null, local: "AVA UniLTS · lippmannts.com (EaD)", status: "aberta", criado: agora(), observacoes: "Turma contínua de vendas on-line" }; db.turmas.push(t); }
    const { a, senha } = garantirAluno(db, { nome: p.nome, cpf: p.cpf, email: p.email, telefone: p.telefone });
    const m = { id: db.seq++, aluno_id: a.id, turma_id: t.id, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: agora(), prazo_ate: new Date(Date.now() + 30 * DIA).toISOString(), resets: 0, pedido_id: p.id };
    db.matriculas.push(m); p.aluno_id = a.id; p.matricula_id = m.id; registrar(db, a.id, m.id, "pagamento_aprovado", `${p.codigo} · ${p.metodo}`);
    return senha ? ` Demonstração: login ${p.email} · senha provisória ${senha}` : "";
  }
  function bloquear(db, p, motivo, por) {
    p.status = "estornado"; p.estornado_em = agora(); p.estorno_motivo = motivo; p.estorno_por = por;
    const m = db.matriculas.find(x => x.id === p.matricula_id); if (m) { m.status = "cancelado"; registrar(db, m.aluno_id, m.id, "estorno_bloqueio", `${p.codigo}: acesso bloqueado e certificado invalidado (${motivo})`); }
  }
  async function pagamento(acao, { corpo: b = {}, query = {} } = {}) {
    const db = ler();
    if (acao === "curso") { const c = db.cursos.find(x => x.id === query.id && x.ativo !== false && x.venda_online && +x.preco > 0); return c ? ok({ curso: { ...c, preco: +c.preco }, ambiente: "simulacao", public_key: "", garantia_dias: 7 }) : nao("Curso indisponível para compra on-line."); }
    if (acao === "criar") {
      const c = db.cursos.find(x => x.id === b.curso_id); if (!c) return nao("Curso indisponível.");
      const id = proxId(db.pedidos), codigo = `PED-${agora().slice(0, 10).replace(/-/g, "")}-${sufixo()}${sufixo().slice(0, 2)}`;
      const p = { id, codigo, curso_id: c.id, nome: b.nome, cpf: soDig(b.cpf), email: String(b.email).toLowerCase(), telefone: b.telefone, valor: +c.preco, metodo: b.metodo, parcelas: (b.cartao && b.cartao.installments) || 1, status: "pendente", taxa: 0, ambiente: "simulacao", criado: agora() };
      if (b.metodo === "pix") { p.pix_copia_cola = `00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-${codigo}52040000530398654${String(c.preco.toFixed(2)).length.toString().padStart(2, "0")}${c.preco.toFixed(2)}5802BR5925LIPPMANN TREINAMENTOS6009SAO PAULO6304ABCD`; p.pix_expira = new Date(Date.now() + 30 * 60000).toISOString(); }
      else { const t = String(b.cartao.titular || "").toUpperCase(); p.cartao_final = String(b.cartao.numero || "").slice(-4); if (t === "OTHE") { p.status = "recusado"; p.mp_detalhe = "cc_rejected_other_reason"; } else { p.status = "aprovado"; p.pago_em = agora(); p.taxa = Math.round(c.preco * .0499 * 100) / 100; p.mp_detalhe = liberar(db, p).trim(); } }
      db.pedidos.push(p); gravar(db);
      return ok({ pedido: pedPub(p), chave: "demo" });
    }
    if (acao === "consultar") { const p = db.pedidos.find(x => x.codigo === String(b.codigo || "").trim().toUpperCase()); if (!p || String(p.email).toLowerCase() !== String(b.email || "").trim().toLowerCase()) return nao("Compra não encontrada. Confira o código e o e-mail usado na compra."); const c = db.cursos.find(x => x.id === p.curso_id); return ok({ pedido: { ...pedPub(p), pix_copia_cola: null, curso: c ? c.titulo : p.curso_id, nome: p.nome, cpf: mascCpf(p.cpf), criado: p.criado, estorno_motivo: p.status === "estornado" ? p.estorno_motivo : null } }); }
    const p = db.pedidos.find(x => x.codigo === (query.codigo || b.codigo));
    if (!p) return nao("Pedido não encontrado.");
    if (acao === "status") { if (p.status === "pendente" && new Date(p.pix_expira) < new Date()) { p.status = "expirado"; gravar(db); } return ok({ pedido: pedPub(p) }); }
    if (acao === "reembolso") return nao("Para cancelar, envie o pedido formal para atendimento@lippmannts.com e pelo WhatsApp (11) 94013-8792 com: código da compra, nome completo, CPF, e-mail e forma de pagamento.");
    return nao("Ação indisponível na demonstração.");
  }
  function simularPix(codigo) { const db = ler(), p = db.pedidos.find(x => x.codigo === codigo); if (p && p.status === "pendente") { p.status = "aprovado"; p.pago_em = agora(); p.taxa = Math.round(p.valor * .0099 * 100) / 100; p.mp_detalhe = liberar(db, p).trim(); gravar(db); } }

  /* ---------- Área da Empresa ---------- */
  const dataPlan = v => { if (v === null || v === undefined || v === "") return null; if (typeof v === "number") return new Date(Math.round((v - 25569) * DIA)).toISOString().slice(0, 10); const s = String(v).trim(); let m, iso; if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; else if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) iso = m[0]; else return undefined; const d = new Date(iso + "T12:00:00Z"); return !isNaN(d) && d.toISOString().slice(0, 10) === iso ? iso : undefined; };
  const simNao = v => { const s = String(v ?? "").trim().toLowerCase(); if (!s) return null; if (["sim", "s", "x", "true", "1"].includes(s)) return true; if (["não", "nao", "n", "false", "0"].includes(s)) return false; return undefined; };
  async function empresa(acao, { corpo: b = {}, query = {} } = {}) {
    const x = portal("empresa_usuarios", sessaoEmp, acao, b); if (x.r) return x.r;
    const { db, u } = x, emp = db.empresas.find(e => e.id === u.empresa_id);
    if (!emp || !emp.ativo) return nao("O acesso desta empresa está suspenso. Fale com a LIPPMANN.");
    const EID = emp.id, minhas = db.turmas.filter(t => t.empresa_id === EID);
    const cursosDe = c => db.matriculas.filter(m => m.colaborador_id === c.id && m.status !== "cancelado").map(m => regras(db, m)).map(m => { const t = turma(db, m.turma_id), cu = curso(db, t.curso_id); return { turma: t.codigo, curso: cu.titulo, nr: cu.nr, status: m.status, nota: m.nota, concluido_em: m.concluido_em, valido_ate: validadeAte(cu, m.concluido_em), certificado: m.certificado, progresso: progresso(cu, m.aulas).pct }; });
    switch (acao) {
      case "resumo": {
        const cols = db.colaboradores.filter(c => c.empresa_id === EID), ms = db.matriculas.filter(m => minhas.some(t => t.id === m.turma_id) && m.status !== "cancelado");
        const uniq = k => [...new Set(cols.map(c => c[k]).filter(Boolean))].sort((a, z) => a.localeCompare(z, "pt-BR"));
        return ok({ empresa: { razao_social: emp.razao_social, nome_fantasia: emp.nome_fantasia, cnpj: fmtCnpj(emp.cnpj) }, usuario: { nome: u.nome }, tipos_aso: TIPOS_ASO,
          totais: { colaboradores: cols.length, matriculas: ms.length, aprovados: ms.filter(m => m.status === "aprovado").length, em_andamento: ms.filter(m => m.status === "em_andamento").length },
          turmas: minhas.slice().sort((a, z) => z.numero - a.numero).map(t => { const y = ms.filter(m => m.turma_id === t.id); return { id: t.id, codigo: t.codigo, curso: curso(db, t.curso_id).titulo, modalidade: t.modalidade, inicio: t.inicio, fim: t.fim, status: t.status, prazo_dias: t.prazo_dias, total: y.length, aprovados: y.filter(m => m.status === "aprovado").length }; }),
          filtros: { unidade: uniq("unidade"), filial: uniq("filial"), area: uniq("area"), centro_custo: uniq("centro_custo"), cargo: uniq("cargo") } });
      }
      case "colaboradores": { const r = ok({ colaboradores: db.colaboradores.filter(c => c.empresa_id === EID).sort((a, z) => a.nome.localeCompare(z.nome)).map(c => ({ ...c, cpf: fmtCpf(c.cpf), cursos: cursosDe(c) })) }); gravar(db); return r; }
      case "importar": {
        const linhas = (b.linhas || []).slice(0, 3000), erros = [], vistos = new Set(); let novos = 0, atualizados = 0;
        linhas.forEach((l, i) => {
          const n = l._linha || i + 2, f = [], reg = { empresa_id: EID };
          reg.nome = String(l.nome || "").trim(); if (reg.nome.split(/\s+/).length < 2) f.push("nome completo");
          reg.cpf = soDig(l.cpf); if (!cpfValido(reg.cpf)) f.push("CPF inválido"); else if (vistos.has(reg.cpf)) f.push("CPF repetido na planilha");
          ["matricula", "rg", "cargo", "unidade", "filial", "centro_custo", "area", "telefone"].forEach(k => reg[k] = String(l[k] ?? "").trim() || null);
          reg.email = String(l.email || "").trim().toLowerCase() || null; if (reg.email && !emailOk(reg.email)) f.push("e-mail inválido");
          ["admissao", "aso_data"].forEach(k => { const d = dataPlan(l[k]); if (d === undefined) f.push(`${k === "admissao" ? "admissão" : "data do ASO"} (use DD/MM/AAAA)`); else reg[k] = d; });
          reg.aso_tipo = String(l.aso_tipo || "").trim() || null; if (reg.aso_tipo) { const t = TIPOS_ASO.find(x => x.toLowerCase() === reg.aso_tipo.toLowerCase()); if (!t) f.push("tipo do ASO"); else reg.aso_tipo = t; }
          ["apto_altura", "apto_confinado", "apto_eletricidade"].forEach(k => { const v = simNao(l[k]); if (v === undefined) f.push(`${k.replace("apto_", "aptidão ")} (Sim/Não)`); else reg[k] = v; });
          if (f.length) return erros.push({ linha: n, nome: reg.nome, erro: f.join(", ") });
          vistos.add(reg.cpf);
          const ex = db.colaboradores.find(c => c.empresa_id === EID && c.cpf === reg.cpf);
          if (ex) { Object.assign(ex, reg, { atualizado: agora() }); atualizados++; } else { db.colaboradores.push({ id: proxId(db.colaboradores), ...reg, aluno_id: null, criado: agora() }); novos++; }
        });
        gravar(db);
        return ok({ novos, atualizados, erros, mensagem: `${novos} colaborador(es) novo(s), ${atualizados} atualizado(s)${erros.length ? `, ${erros.length} linha(s) com erro` : ""}.` });
      }
      case "colaborador_excluir": db.colaboradores = db.colaboradores.filter(c => !(c.id === +b.id && c.empresa_id === EID)); gravar(db); return ok();
      case "vincular": {
        const t = minhas.find(x => x.id === +b.turma_id); if (!t) return nao("Turma não encontrada para a sua empresa."); if (t.status !== "aberta") return nao("A turma não está aberta para matrículas.");
        const cols = db.colaboradores.filter(c => c.empresa_id === EID && (b.colaboradores || []).map(Number).includes(c.id));
        if (!cols.length) return nao("Selecione ao menos um colaborador.");
        const res = { matriculados: 0, ja: 0, sem_email: [], senhas: [] };
        cols.forEach(col => {
          if (t.modalidade !== "presencial" && !col.email) return res.sem_email.push(col.nome);
          let al = col.aluno_id ? db.alunos.find(a => a.id === col.aluno_id) : null, senha = "";
          if (!al) { const g = garantirAluno(db, { nome: col.nome, cpf: col.cpf, email: col.email, empresa: emp.nome_fantasia, telefone: col.telefone }); al = g.a; senha = g.senha; }
          col.aluno_id = al.id;
          const ja = db.matriculas.find(m => m.aluno_id === al.id && m.turma_id === t.id && m.status !== "cancelado"); if (ja) return res.ja++;
          db.matriculas.push({ id: db.seq++, aluno_id: al.id, turma_id: t.id, colaborador_id: col.id, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: agora(), prazo_ate: t.modalidade !== "presencial" ? new Date(Date.now() + (+t.prazo_dias || 30) * DIA).toISOString() : null, resets: 0 });
          registrar(db, al.id, null, "matricula_empresa", `${t.codigo} por ${u.email}`); res.matriculados++;
          if (senha) res.senhas.push(`${col.email}: ${senha}`);
        });
        gravar(db);
        return ok({ ...res, mensagem: `${res.matriculados} colaborador(es) vinculado(s) à turma ${t.codigo}.${res.ja ? ` ${res.ja} já estava(m) matriculado(s).` : ""}${res.sem_email.length ? ` Sem e-mail (obrigatório para EaD): ${res.sem_email.join(", ")}.` : ""}${res.senhas.length ? ` Demonstração · senhas provisórias que seriam enviadas por e-mail: ${res.senhas.join(" · ")}` : ""}` });
      }
      case "relatorio": { const t = minhas.find(x => x.id === +query.id); return t ? ok({ ...dadosTurma(db, t.id), responsavel: u.nome }) : nao("Turma não encontrada para a sua empresa."); }
      case "certificado": { const d = certificado(db, query.c, "completo"); const m = d && db.matriculas.find(x => x.certificado === d.codigo); return d && m && (minhas.some(t => t.id === m.turma_id) || db.colaboradores.some(c => c.id === m.colaborador_id && c.empresa_id === EID)) ? ok({ certificado: d }) : nao("Certificado não encontrado."); }
    }
    return nao("Ação indisponível na demonstração.");
  }

  /* ---------- Painel do Parceiro ---------- */
  async function parceiro(acao, { corpo: b = {}, query = {} } = {}) {
    const x = portal("parceiros", sessaoPar, acao, b); if (x.r) return x.r;
    const { db, u: p } = x, quem = `parceiro:${p.email}`;
    const minha = id => db.turmas.find(t => t.id === +id && t.parceiro_id === p.id);
    const TRILHA = "trilha-instrutor-parceiro", TRAVA = "Conclua a Trilha de Capacitação do Instrutor Parceiro (curso obrigatório na UniLTS) para criar e concluir turmas.";
    const trilha = () => {
      if (p.trilha_dispensada) return { status: "dispensada" };
      const al = db.alunos.find(x => x.email === p.email), ms = al ? db.matriculas.filter(m => m.aluno_id === al.id && (turma(db, m.turma_id) || {}).curso_id === TRILHA) : [], m = ms.find(x => x.status === "aprovado") || ms[0];
      if (m && m.status === "aprovado") return { status: "aprovada", nota: m.nota, certificado: m.certificado, em: m.concluido_em };
      if (m) { const c = curso(db, TRILHA), tot = (c.modulos || []).reduce((s, x) => s + x.aulas.length, 0), f = Object.keys(m.aulas || {}).length; return { status: "em_andamento", progresso: { pct: tot ? Math.round(f / tot * 100) : 0 } }; }
      return { status: "pendente" };
    };
    const liberada = () => ["aprovada", "dispensada"].includes(trilha().status);
    switch (acao) {
      case "trilha_iniciar": {
        if (!curso(db, TRILHA)) return nao("A trilha do instrutor ainda não foi cadastrada.");
        let t = db.turmas.find(x => x.curso_id === TRILHA && x.status === "aberta");
        if (!t) { const n = db.contador++; t = { id: proxId(db.turmas), numero: n, codigo: `T${String(n).padStart(5, "0")}-E${agora().slice(0, 4)}`, curso_id: TRILHA, tipo: "b2c", modalidade: "ead", prazo_dias: 90, inicio: agora().slice(0, 10), fim: null, local: "AVA UniLTS · lippmannts.com (EaD)", status: "aberta", criado: agora(), observacoes: "Trilha interna obrigatória dos instrutores parceiros" }; db.turmas.push(t); }
        let al = db.alunos.find(x => x.email === p.email);
        if (!al) { al = { id: proxId(db.alunos), nome: p.nome, cpf: p.cpf, email: p.email, telefone: p.telefone, senha: p.senha, trocar_senha: false, ativo: true, criado: agora() }; db.alunos.push(al); }
        let m = db.matriculas.find(x => x.aluno_id === al.id && x.turma_id === t.id);
        if (!m) { m = { id: db.seq++, aluno_id: al.id, turma_id: t.id, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: agora(), prazo_ate: new Date(Date.now() + 90 * DIA).toISOString(), resets: 0 }; db.matriculas.push(m); registrar(db, al.id, m.id, "trilha_iniciada", quem); }
        sessaoAluno.set(al.id); gravar(db);
        return ok({ url: `/unilts/index.html#c/${m.id}` });
      }
      case "resumo": return ok({ parceiro: { nome: p.nome, qualificacao: p.qualificacao, registro: p.registro }, trilha: trilha(), cursos: db.cursos.filter(c => c.ativo !== false && c.id !== TRILHA), documentos: DOCS, fotos: FOTOS,
        turmas: db.turmas.filter(t => t.parceiro_id === p.id).sort((a, z) => z.numero - a.numero).map(t => { const ms = db.matriculas.filter(m => m.turma_id === t.id && m.status !== "cancelado"), a = db.arquivos.filter(y => y.turma_id === t.id), e = db.empresas.find(y => y.id === t.empresa_id);
          return { ...t, curso: curso(db, t.curso_id).titulo, empresa: e ? e.nome_fantasia : "", participantes: ms.length, aprovados: ms.filter(m => m.status === "aprovado").length, fotos_ok: Object.keys(FOTOS).filter(k => a.some(y => y.categoria === "foto" && y.tipo === k)).length, docs_ok: Object.keys(DOCS).filter(k => a.some(y => y.categoria === "documento" && y.tipo === k)).length }; }) });
      case "turma": case "relatorio": { const t = minha(query.id); if (!t) return nao("Turma não encontrada."); const d = dadosTurma(db, t.id); return ok({ ...d, responsavel: p.nome, colaboradores: t.empresa_id ? db.colaboradores.filter(c => c.empresa_id === t.empresa_id).map(c => ({ id: c.id, nome: c.nome, cpf: mascCpf(c.cpf), cargo: c.cargo, unidade: c.unidade })) : [] }); }
      case "turma_salvar": {
        if (b.id) { const t = minha(b.id); if (!t) return nao("Turma não encontrada."); if (t.concluida_parceiro) return nao("Turma já concluída."); Object.assign(t, { inicio: b.inicio, fim: b.fim, local: b.local, observacoes: b.observacoes }); gravar(db); return ok({ id: t.id }); }
        if (!liberada()) return nao(TRAVA);
        if (!curso(db, b.curso_id)) return nao("Escolha o curso."); if (!b.inicio) return nao("Informe a data de realização."); if (!String(b.local || "").trim()) return nao("Informe o local do treinamento.");
        const n = db.contador++; const t = { id: proxId(db.turmas), numero: n, codigo: `T${String(n).padStart(5, "0")}-E${b.inicio.slice(0, 4)}`, curso_id: b.curso_id, tipo: "b2b", modalidade: b.modalidade === "hibrido" ? "hibrido" : "presencial", prazo_dias: 30, inicio: b.inicio, fim: b.fim || b.inicio, local: b.local, instrutor_nome: p.nome, observacoes: b.observacoes || "", status: "aberta", criado: agora(), empresa_id: null, parceiro_id: p.id };
        db.turmas.push(t); gravar(db); return ok({ id: t.id, codigo: t.codigo });
      }
      case "participante_adicionar": {
        const t = minha(b.turma_id); if (!t) return nao("Turma não encontrada."); if (t.concluida_parceiro || t.status !== "aberta") return nao("Turma encerrada.");
        const col = b.colaborador_id ? db.colaboradores.find(c => c.id === +b.colaborador_id && c.empresa_id === t.empresa_id) : null;
        const nome = col ? col.nome : String(b.nome || "").trim(), cpf = col ? col.cpf : soDig(b.cpf), email = col ? col.email : (String(b.email || "").trim().toLowerCase() || null);
        if (nome.split(/\s+/).length < 2) return nao("Informe o nome completo (sai no certificado)."); if (!cpfValido(cpf)) return nao("CPF inválido."); if (email && !emailOk(email)) return nao("E-mail inválido.");
        let al = col && col.aluno_id ? db.alunos.find(a => a.id === col.aluno_id) : null; if (!al) al = garantirAluno(db, { nome, cpf, email, empresa: b.empresa }).a;
        if (col) col.aluno_id = al.id;
        if (db.matriculas.some(m => m.aluno_id === al.id && m.turma_id === t.id && m.status !== "cancelado")) return nao("Participante já está nesta turma.");
        db.matriculas.push({ id: db.seq++, aluno_id: al.id, turma_id: t.id, colaborador_id: col ? col.id : null, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: agora(), resets: 0 });
        registrar(db, al.id, null, "matricula_presencial", `${t.codigo} por ${quem}`); gravar(db); return ok({ mensagem: `${nome} adicionado(a) à turma.` });
      }
      case "participante_remover": { const m = db.matriculas.find(y => y.id === +b.id); const t = m && minha(m.turma_id); if (!t || t.concluida_parceiro) return nao("Não é possível remover."); m.status = "cancelado"; gravar(db); return ok(); }
      case "notas_salvar": {
        const t = minha(b.turma_id); if (!t) return nao("Turma não encontrada."); if (t.concluida_parceiro) return nao("Turma já concluída.");
        const num = v => v === "" || v === null || v === undefined ? null : +String(v).replace(",", ".");
        for (const n of b.notas || []) {
          const m = db.matriculas.find(y => y.id === +n.id && y.turma_id === t.id); if (!m) continue;
          const pr = num(n.nota_pratica), te = num(n.nota_teorica);
          if ([pr, te].some(v => v !== null && (isNaN(v) || v < 0 || v > 10))) return nao("Notas devem estar entre 0 e 10.");
          if (n.entrada && n.saida && new Date(n.saida) <= new Date(n.entrada)) return nao("A saída deve ser depois da entrada.");
          m.nota_pratica = pr; if (t.modalidade === "presencial") m.nota_teorica = te; m.presenca_entrada = n.entrada || null; m.presenca_saida = n.saida || null;
          registrar(db, m.aluno_id, m.id, "notas_presenca", `teórica ${m.nota_teorica ?? "(EaD)"} · prática ${pr ?? "—"} · entrada ${n.entrada || "—"} · saída ${n.saida || "—"} (${quem})`);
        }
        gravar(db); return ok({ mensagem: "Notas e presença salvas." });
      }
      case "upload_url": {
        const t = minha(b.turma_id); if (!t) return nao("Turma não encontrada."); if (t.concluida_parceiro) return nao("Turma já concluída.");
        if (b.categoria === "foto" && Math.max(+b.largura || 0, +b.altura || 0) < 1280) return nao("A foto precisa estar em resolução total (mínimo 1280 px no lado maior).");
        return ok({ demo: true, caminho: `turmas/${t.codigo}/${b.categoria}/${b.tipo}-${Date.now().toString(36)}` });
      }
      case "arquivo_registrar": {
        const t = minha(b.turma_id); if (!t) return nao("Turma não encontrada.");
        if (b.categoria === "foto" && String(b.legenda || "").trim().length < 10) return nao("Descreva a foto na legenda (mínimo de 10 caracteres).");
        if (b.categoria === "foto") db.arquivos = db.arquivos.filter(a => !(a.turma_id === t.id && a.categoria === "foto" && a.tipo === b.tipo));
        const rot = b.categoria === "foto" ? FOTOS[b.tipo] : DOCS[b.tipo];
        db.arquivos.push({ id: proxId(db.arquivos), turma_id: t.id, categoria: b.categoria, tipo: b.tipo, legenda: b.categoria === "foto" ? `${rot} · ${b.legenda}` : rot, caminho: b.caminho, url: b.previa || "/downloads/fichas/nr35-trabalho-altura.pdf", nome_original: b.nome, largura: b.largura || null, altura: b.altura || null, bytes: b.tamanho, criado: agora(), enviado_por: quem });
        gravar(db); return ok({ mensagem: `${rot} enviado.${b.categoria === "foto" ? " (Demonstração: guardada em miniatura; no servidor vai em resolução total.)" : ""}` });
      }
      case "arquivo_excluir": { const a = db.arquivos.find(y => y.id === +b.id); const t = a && minha(a.turma_id); if (!t || t.concluida_parceiro) return nao("Não é possível excluir."); db.arquivos = db.arquivos.filter(y => y.id !== a.id); gravar(db); return ok(); }
      case "concluir": {
        const t = minha(b.turma_id); if (!t) return nao("Turma não encontrada."); if (t.concluida_parceiro) return nao("Turma já concluída."); if (!liberada()) return nao(TRAVA);
        const c = curso(db, t.curso_id), arq = db.arquivos.filter(a => a.turma_id === t.id);
        const falta = [...Object.keys(DOCS).filter(k => !arq.some(a => a.categoria === "documento" && a.tipo === k)).map(k => DOCS[k]), ...Object.keys(FOTOS).filter(k => !arq.some(a => a.categoria === "foto" && a.tipo === k)).map(k => FOTOS[k])];
        if (falta.length) return nao(`Para concluir, envie: ${falta.join("; ")}.`);
        const ms = db.matriculas.filter(m => m.turma_id === t.id && m.status !== "cancelado"); if (!ms.length) return nao("Adicione os participantes da turma.");
        const sem = ms.filter(m => m.nota_pratica == null || (t.modalidade === "presencial" && m.nota_teorica == null) || !m.presenca_entrada || !m.presenca_saida);
        if (sem.length) return nao(`Lance notas, entrada e saída de todos os participantes (${sem.length} pendente(s)).`);
        let aprov = 0; const corte = +c.nota_corte || 7;
        ms.forEach(m => { const te = m.nota_teorica, pr = m.nota_pratica; m.nota = te != null && pr != null ? Math.round((te + pr) / 2 * 100) / 100 : null;
          if (te != null && pr != null && te >= corte && pr >= corte) { m.certificado = novoCert(db, t); m.status = "aprovado"; m.concluido_em = new Date(Math.min(Date.now(), new Date((t.fim || agora().slice(0, 10)) + "T12:00:00").getTime())).toISOString(); aprov++; } else m.status = "reprovado";
          registrar(db, m.aluno_id, m.id, "resultado_presencial", `${m.status} (${quem})`); });
        t.concluida_parceiro = agora(); t.status = "encerrada"; t.encerrada_em = agora(); gravar(db);
        return ok({ mensagem: `Turma concluída: ${aprov} de ${ms.length} aprovado(s). Certificados emitidos automaticamente.` });
      }
      case "certificado": { const d = certificado(db, query.c, "completo"); const m = d && db.matriculas.find(y => y.certificado === d.codigo); return d && m && minha(m.turma_id) ? ok({ certificado: d }) : nao("Certificado não encontrado."); }
    }
    return nao("Ação indisponível na demonstração.");
  }

  /* ---------- Painel L³ INTEGRA ---------- */
  async function painel(acao, b = {}, query = {}) {
    const db = ler();
    let r = null;
    switch (acao) {
      case "uni_resumo": {
        const cont = {}; db.matriculas.forEach(m => { const x = cont[m.turma_id] = cont[m.turma_id] || { total: 0, aprovado: 0, reprovado: 0, em_andamento: 0 }; if (m.status !== "cancelado") { x.total++; x[m.status] = (x[m.status] || 0) + 1; } });
        return ok({ cursos: db.cursos, alunos: db.alunos.length, proximo: db.contador, empresas: db.empresas.map(e => ({ id: e.id, razao_social: e.razao_social, nome_fantasia: e.nome_fantasia, cnpj: e.cnpj, ativo: e.ativo })), parceiros: db.parceiros.map(p => ({ id: p.id, nome: p.nome, email: p.email, ativo: p.ativo })),
          turmas: db.turmas.slice().sort((x, y) => y.numero - x.numero).map(t => ({ ...t, curso: (curso(db, t.curso_id) || {}).titulo, contagem: cont[t.id] || { total: 0, aprovado: 0, reprovado: 0, em_andamento: 0 } })) });
      }
      case "uni_curso_salvar": {
        if (!String(b.titulo || "").trim()) return nao("Informe o título do curso.");
        const d = { ...b, id: b.id || slug(b.titulo), preco: Math.max(0, +String(b.preco || 0).replace(/\./g, "").replace(",", ".") || 0), venda_online: !!+b.venda_online, carga_horaria: +String(b.carga_horaria || 0).replace(",", ".") || 0, nota_corte: Math.min(10, +String(b.nota_corte || 7).replace(",", ".") || 7), tentativas_max: +b.tentativas_max || 3, validade_meses: +b.validade_meses || 0, ativo: !!+b.ativo,
          conteudo_programatico: String(b.conteudo_programatico || "").split("\n").map(x => x.trim()).filter(Boolean),
          modulos: (b.modulos || []).map((m, i) => ({ titulo: m.titulo || `Módulo ${i + 1}`, aulas: (m.aulas || []).map((a, j) => ({ ...a, id: a.id || `m${i + 1}a${j + 1}-${sufixo().toLowerCase()}`, youtube: idYt(a.youtube) })) })),
          avaliacao: (b.avaliacao || []).filter(q => q.pergunta && (q.alternativas || []).filter(Boolean).length >= 2).map(q => ({ ...q, alternativas: q.alternativas.filter(Boolean), correta: +q.correta || 0 })) };
        const i = db.cursos.findIndex(c => c.id === d.id); if (i >= 0) db.cursos[i] = { ...db.cursos[i], ...d }; else db.cursos.push(d);
        r = ok({ id: d.id }); break;
      }
      case "uni_curso_excluir": if (db.turmas.some(t => t.curso_id === b.id)) return nao("Este curso já tem turmas e não pode ser excluído. Desmarque “Curso ativo” para ocultá-lo."); db.cursos = db.cursos.filter(c => c.id !== b.id); r = ok(); break;
      case "uni_turma_salvar": {
        if (b.id) { const t = turma(db, b.id); const st0 = t.status; Object.assign(t, { inicio: b.inicio || null, fim: b.fim || null, local: b.local || t.local, instrutor_nome: b.instrutor_nome, observacoes: b.observacoes, status: b.status || t.status, empresa_id: +b.empresa_id || null, parceiro_id: +b.parceiro_id || null, prazo_dias: +b.prazo_dias || 30 });
          if (t.status === "encerrada" && st0 !== "encerrada") t.encerrada_em = agora(); if (t.status === "aberta") { t.encerrada_em = null; t.concluida_parceiro = null; } r = ok({ id: t.id }); break; }
        if (!curso(db, b.curso_id)) return nao("Escolha o curso da turma.");
        const n = db.contador++, ano = (b.inicio || agora()).slice(0, 4), mod = ["presencial", "hibrido"].includes(b.modalidade) ? b.modalidade : "ead";
        const t = { id: proxId(db.turmas), numero: n, codigo: `T${String(n).padStart(5, "0")}-E${ano}`, curso_id: b.curso_id, tipo: b.empresa_id ? "b2b" : "b2c", modalidade: mod, inicio: b.inicio || null, fim: b.fim || null, local: b.local || (mod === "ead" ? "AVA UniLTS · lippmannts.com (EaD)" : "A definir"), instrutor_nome: b.instrutor_nome || null, observacoes: b.observacoes || "", status: "aberta", criado: agora(), empresa_id: +b.empresa_id || null, parceiro_id: +b.parceiro_id || null, prazo_dias: +b.prazo_dias || 30 };
        db.turmas.push(t); r = ok({ id: t.id, codigo: t.codigo }); break;
      }
      case "uni_ajustar_numero": { const maior = Math.max(0, ...db.turmas.map(t => t.numero)); if (!(+b.proximo > maior)) return nao(`O próximo número deve ser maior que ${maior}`); db.contador = +b.proximo; r = ok(); break; }
      case "uni_turma": { const d = dadosTurma(db, query.id || b.id); return d ? ok({ ...d, responsavel: "Administrador", superadmin: true }) : nao("Turma não encontrada."); }
      case "uni_matricular": {
        const t = turma(db, b.turma_id); if (!t) return nao("Turma não encontrada."); if (t.status !== "aberta") return nao("A turma não está aberta para matrículas.");
        const nome = String(b.nome || "").trim(), email = String(b.email || "").trim().toLowerCase();
        if (nome.split(/\s+/).length < 2) return nao("Informe o nome completo do aluno (é o nome que sai no certificado).");
        if (!emailOk(email)) return nao("Informe um e-mail válido."); if (!cpfValido(b.cpf)) return nao("CPF inválido.");
        const { a, senha } = garantirAluno(db, { nome, cpf: b.cpf, email, telefone: b.telefone, empresa: b.empresa });
        if (db.matriculas.some(m => m.aluno_id === a.id && m.turma_id === t.id && m.status !== "cancelado")) return nao("Este aluno já está matriculado nesta turma.");
        db.matriculas.push({ id: db.seq++, aluno_id: a.id, turma_id: t.id, status: "em_andamento", aulas: {}, tentativas: [], nota: null, certificado: null, concluido_em: null, criado: agora(), prazo_ate: t.modalidade !== "presencial" ? new Date(Date.now() + (+t.prazo_dias || 30) * DIA).toISOString() : null, resets: 0 });
        r = ok({ mensagem: `Demonstração: aluno matriculado. No servidor, o acesso seria enviado para ${email}.${senha ? ` Senha provisória gerada: ${senha}` : ""}` }); break;
      }
      case "uni_reenviar_acesso": { const a = db.alunos.find(x => x.id === +b.aluno_id); if (!a) return nao("Aluno não encontrado."); a.senha = senhaAleatoria(); a.trocar_senha = true; r = ok({ mensagem: `Demonstração: nova senha provisória de ${a.email}: ${a.senha}` }); break; }
      case "uni_nova_tentativa": { const m = db.matriculas.find(x => x.id === +b.id); if (!m || m.status === "aprovado") return nao("Matrícula não encontrada ou já aprovada."); const t = m.tentativas.find(x => !x.descartada); if (t) t.descartada = true; m.status = "em_andamento"; r = ok({ mensagem: "Nova tentativa liberada para o aluno." }); break; }
      case "uni_matricula_cancelar": { const m = db.matriculas.find(x => x.id === +b.id); if (m) m.status = "cancelado"; r = ok(); break; }
      case "uni_reabilitar": { const m = db.matriculas.find(x => x.id === +b.id); if (!m) return nao("Matrícula não encontrada."); m.acesso_revogado = null; m.reabilitado_por = "admin"; registrar(db, m.aluno_id, m.id, "acesso_reabilitado", "por admin"); r = ok({ mensagem: "Acesso reabilitado." }); break; }
      case "uni_alunos": return ok({ alunos: db.alunos.map(a => ({ id: a.id, nome: a.nome, cpf: fmtCpf(a.cpf), email: a.email, telefone: a.telefone, empresa: a.empresa, trocar_senha: a.trocar_senha, ativo: a.ativo, criado: a.criado, ultimo_acesso: a.ultimo_acesso, matriculas: db.matriculas.filter(m => m.aluno_id === a.id && m.status !== "cancelado").length })).sort((x, y) => x.nome.localeCompare(y.nome)) });
      case "uni_certificado": { const d = certificado(db, query.c, "completo"); return d ? ok({ certificado: d }) : nao("Certificado não encontrado."); }
      case "uni_empresas": return ok({ empresas: db.empresas.map(e => ({ ...e, cnpj: fmtCnpj(e.cnpj), usuarios: db.empresa_usuarios.filter(u => u.empresa_id === e.id).map(u => ({ id: u.id, nome: u.nome, email: u.email, trocar_senha: u.trocar_senha, ativo: u.ativo, ultimo_acesso: u.ultimo_acesso })), colaboradores: db.colaboradores.filter(c => c.empresa_id === e.id).length })) });
      case "uni_empresa_salvar": {
        const razao = String(b.razao_social || "").trim(); if (!razao) return nao("Informe a razão social."); if (!cnpjValido(b.cnpj)) return nao("CNPJ inválido.");
        const dados = { razao_social: razao, nome_fantasia: b.nome_fantasia || null, cnpj: soDig(b.cnpj), contato_nome: b.contato_nome, contato_email: b.contato_email, contato_telefone: b.contato_telefone, ativo: !!+b.ativo };
        let e = b.id ? db.empresas.find(x => x.id === +b.id) : null;
        if (e) Object.assign(e, dados); else { if (db.empresas.some(x => x.cnpj === dados.cnpj)) return nao("Já existe uma empresa com este CNPJ."); e = { id: proxId(db.empresas), ...dados, criado: agora() }; db.empresas.push(e); }
        let m = "Empresa salva.";
        if (String(b.usuario_email || "").trim()) { const em = b.usuario_email.trim().toLowerCase(); if (!emailOk(em)) return nao("E-mail de acesso inválido."); if (db.empresa_usuarios.some(u => u.email === em)) return nao("Este e-mail já tem acesso cadastrado."); const s = senhaAleatoria(); db.empresa_usuarios.push({ id: proxId(db.empresa_usuarios), empresa_id: e.id, nome: b.usuario_nome || dados.contato_nome || razao, email: em, senha: s, trocar_senha: true, ativo: true, ultimo_acesso: null }); m += ` Demonstração: acesso de ${em} com senha provisória ${s}.`; }
        r = ok({ id: e.id, mensagem: m }); break;
      }
      case "uni_parceiros": return ok({ parceiros: db.parceiros.map(p => ({ id: p.id, nome: p.nome, cpf: fmtCpf(p.cpf), email: p.email, telefone: p.telefone, qualificacao: p.qualificacao, registro: p.registro, trocar_senha: p.trocar_senha, ativo: p.ativo, ultimo_acesso: p.ultimo_acesso, trilha_dispensada: !!p.trilha_dispensada, trilha: (() => { if (p.trilha_dispensada) return { status: "dispensada" }; const al = db.alunos.find(x => x.email === p.email), m = al && db.matriculas.find(x => x.aluno_id === al.id && (turma(db, x.turma_id) || {}).curso_id === "trilha-instrutor-parceiro"); return m ? (m.status === "aprovado" ? { status: "aprovada", nota: m.nota } : { status: "em_andamento" }) : { status: "pendente" }; })() })) });
      case "uni_parceiro_salvar": {
        const nome = String(b.nome || "").trim(); if (nome.split(/\s+/).length < 2) return nao("Informe o nome completo do instrutor."); if (b.cpf && !cpfValido(b.cpf)) return nao("CPF inválido.");
        const dados = { nome, cpf: soDig(b.cpf) || null, telefone: b.telefone, qualificacao: b.qualificacao, registro: b.registro, ativo: !!+b.ativo, ...(b.trilha_dispensada !== undefined ? { trilha_dispensada: !!+b.trilha_dispensada } : {}) };
        if (b.id) { Object.assign(db.parceiros.find(p => p.id === +b.id), dados); r = ok({ mensagem: "Parceiro atualizado." }); break; }
        const em = String(b.email || "").trim().toLowerCase(); if (!emailOk(em)) return nao("E-mail de acesso inválido."); if (db.parceiros.some(p => p.email === em)) return nao("Este e-mail já tem acesso cadastrado.");
        const s = senhaAleatoria(); db.parceiros.push({ id: proxId(db.parceiros), ...dados, email: em, senha: s, trocar_senha: true, ultimo_acesso: null });
        r = ok({ mensagem: `Demonstração: acesso de ${em} com senha provisória ${s}.` }); break;
      }
      case "fin_dados": {
        const ini = query.inicio || dias(-180).slice(0, 10), fim = query.fim || agora().slice(0, 10), dentro = d => d && String(d).slice(0, 10) >= ini && String(d).slice(0, 10) <= fim;
        const aprov = [...db.matriculas.filter(m => m.status === "aprovado" && dentro(m.concluido_em)).map(m => { const t = turma(db, m.turma_id); return { data: m.concluido_em, curso_id: t.curso_id, modalidade: t.modalidade, tipo: t.tipo }; }), ...db.historico.filter(h => dentro(h.data))];
        return ok({ inicio: ini, fim, ambiente: "simulacao", pedidos: db.pedidos.filter(p => dentro(p.criado)).sort((a, z) => String(z.criado).localeCompare(String(a.criado))), lancamentos: db.lancamentos.filter(l => dentro(l.data)).sort((a, z) => String(z.data).localeCompare(String(a.data))), cursos: db.cursos.map(c => ({ id: c.id, titulo: c.titulo, nr: c.nr, carga_horaria: c.carga_horaria, preco: c.preco, venda_online: c.venda_online })), aprovacoes: aprov });
      }
      case "fin_estornar": { const p = db.pedidos.find(x => x.id === +b.id); if (!p || p.status !== "aprovado") return nao("Somente pedidos aprovados podem ser estornados."); bloquear(db, p, b.motivo || "estorno pela LIPPMANN", "painel:admin"); r = ok({ mensagem: "Estorno confirmado: acesso bloqueado e certificado invalidado." }); break; }
      case "fin_simular": { const p = db.pedidos.find(x => x.id === +b.id); if (!p || p.status !== "pendente") return nao("Só pedidos pendentes podem ser simulados."); if (b.resultado === "recusado") { p.status = "recusado"; r = ok({ mensagem: "Pagamento simulado como recusado." }); break; } p.status = "aprovado"; p.pago_em = agora(); p.taxa = Math.round(p.valor * (p.metodo === "pix" ? .0099 : .0499) * 100) / 100; const x = liberar(db, p); r = ok({ mensagem: "Pagamento simulado como aprovado: aluno matriculado." + x }); break; }
      case "fin_lancamento_salvar": {
        const valor = Math.round(+String(b.valor || "").replace(/\./g, "").replace(",", ".") * 100) / 100; if (!(valor > 0)) return nao("Informe um valor maior que zero."); if (!b.data) return nao("Informe a data.");
        const d = { tipo: b.tipo === "receita" ? "receita" : "despesa", data: b.data, categoria: b.categoria || "Outros", descricao: b.descricao || null, valor };
        if (b.id) Object.assign(db.lancamentos.find(l => l.id === +b.id), d); else db.lancamentos.push({ id: proxId(db.lancamentos), ...d, criado_por: "admin" });
        r = ok(); break;
      }
      case "fin_lancamento_excluir": db.lancamentos = db.lancamentos.filter(l => l.id !== +b.id); r = ok(); break;
      case "uni_portal_reenviar": { const L = b.tipo === "parceiro" ? db.parceiros : db.empresa_usuarios; const u = L.find(x => x.id === +b.id); if (!u) return nao("Usuário não encontrado."); u.senha = senhaAleatoria(); u.trocar_senha = true; u.ativo = true; r = ok({ mensagem: `Demonstração: nova senha provisória de ${u.email}: ${u.senha}` }); break; }
    }
    if (r) gravar(db);
    return r;
  }

  window.UNI_DEMO = { aluno, empresa, parceiro, painel, pagamento, simularPix, cursosDemo: () => ler().cursos,
    validar: c => { const d = certificado(ler(), c, "mascarado"); return d ? ok({ certificado: d }) : nao("Certificado não encontrado. Confira o código impresso no documento."); },
    portalLogado: () => !!(sessaoEmp.get() || sessaoPar.get()),
    redefinir: () => { try { localStorage.removeItem(CHAVE); } catch (e) {} } };
})();
