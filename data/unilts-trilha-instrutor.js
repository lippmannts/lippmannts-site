/* =====================================================================
   UniLTS · TRILHA OBRIGATÓRIA DO INSTRUTOR PARCEIRO (curso interno, não vendido)
   O instrutor/parceiro só cria e conclui turmas depois de aprovado nesta trilha.
   Editável no L³ INTEGRA › UniLTS › Cursos (id: trilha-instrutor-parceiro).
   ===================================================================== */
window.UNI_CURSO_TRILHA = {
  id: "trilha-instrutor-parceiro",
  interno: true,
  venda_online: false,
  preco: 0,
  titulo: "Trilha de Capacitação do Instrutor Parceiro LIPPMANN",
  nr: "Interno",
  norma: "Onboarding obrigatório de instrutores e parceiros · Padrão LIPPMANN de ensino",
  modalidade: "EaD (ensino a distância)",
  carga_horaria: 3,
  resumo: "Curso obrigatório para instrutores e parceiros: institucional, portfólio, políticas corporativas, metodologia ativa de ensino e tutorial passo a passo da plataforma UniLTS.",
  imagem: "/assets/img/marca/lipp-instrucao.webp",
  nota_corte: 8,
  tentativas_max: 3,
  validade_meses: 24,
  instrutor_nome: "William Lippmann",
  instrutor_qualificacao: "Fundador · Instrutor de Aprendizagem Industrial · Técnico de Segurança do Trabalho",
  rt_nome: "William Lippmann",
  rt_qualificacao: "Responsável Técnico · LIPPMANN Treinamentos e Soluções",
  mapa_mental: "",
  conteudo_programatico: [
    "Apresentação Institucional: história, propósito, missão, visão e valores",
    "Portfólio LTS: treinamentos normativos, desenvolvimento humano e soluções técnicas",
    "Políticas Corporativas: SSMA, Qualidade, Código de Ética, Reembolso, Compromisso Social e LGPD",
    "Metodologia Ativa de Ensino: o padrão de aula LIPPMANN",
    "Tutorial interativo da plataforma UniLTS: turmas, participantes, notas, presença, documentos FR-DOC e evidências"
  ],
  plano_ensino: `<h2>Identificação</h2>
<p><strong>Curso:</strong> Trilha de Capacitação do Instrutor Parceiro LIPPMANN · <strong>Modalidade:</strong> EaD · <strong>Carga horária:</strong> 3 horas · <strong>Validade:</strong> 24 meses.</p>
<h2>Objetivo</h2>
<p>Alinhar todo instrutor e parceiro ao padrão LIPPMANN: identidade, portfólio, políticas, metodologia de ensino e operação correta da plataforma UniLTS, garantindo rastreabilidade e qualidade em cada turma.</p>
<h2>Público-alvo</h2>
<p>Instrutores, consultores e empresas parceiras que conduzem turmas presenciais ou híbridas em nome da LIPPMANN.</p>
<h2>Avaliação e liberação</h2>
<p>Até <strong>3 tentativas</strong>, com nota mínima <strong>8,00</strong>. A aprovação libera, automaticamente, a criação e a conclusão de turmas no Painel do Parceiro.</p>`,
  modulos: [
    { titulo: "Módulo 1 · A LIPPMANN", aulas: [
      { id: "t1a1", titulo: "Apresentação Institucional", duracao: "25 min", youtube: "", texto: `<p>A <strong>LIPPMANN Treinamentos e Soluções</strong> nasceu da convicção de que pessoas bem capacitadas são o principal diferencial para construir organizações mais seguras, produtivas e sustentáveis. Nosso fundador, William Lippmann, atuou por mais de 10 anos em SSMA na indústria e percebeu que muitas empresas treinavam para cumprir a lei, mas poucas transformavam conhecimento em comportamento.</p>
<h3>Manifesto</h3><blockquote>Segurança não é prioridade. Segurança é valor.</blockquote>
<h3>Missão</h3><p>Disseminar a Cultura de Segurança como Valor, capacitando pessoas e transformando organizações por meio de treinamentos, consultorias e soluções que unem conhecimento técnico, experiência prática e desenvolvimento humano.</p>
<h3>Valores que você representa em sala</h3><ul><li><strong>Segurança como Valor</strong> e preservação da vida.</li><li><strong>Integridade</strong> e transparência.</li><li><strong>Excelência</strong> técnica e pedagógica.</li><li><strong>Empatia</strong> com cada participante.</li><li><strong>Responsabilidade social</strong>: 10% do lucro líquido destinados a ações sociais (Termo de Compromisso Social).</li></ul>
<p>Ao conduzir uma turma, você <strong>é</strong> a LIPPMANN para aquele cliente: pontualidade, apresentação pessoal, uso exemplar de EPI e linguagem respeitosa são inegociáveis.</p>` },
      { id: "t1a2", titulo: "Portfólio LTS", duracao: "25 min", youtube: "", texto: `<p>O portfólio se divide em três frentes:</p>
<ul><li><strong>Treinamentos normativos (NR):</strong> NR 01, 05, 06, 10, 11, 12, 13, 17, 18, 20, 26, 33, 35 e Brigada de Incêndio, sempre com carga horária e conteúdo conforme a norma vigente.</li><li><strong>Desenvolvimento e cultura:</strong> Liderança em Segurança, Prevenção ao Assédio, Gestão de SSMA e Indicadores.</li><li><strong>Soluções técnicas:</strong> PGR, inventários, laudos, AET, análises de risco, PAE, simulados e diagnósticos.</li></ul>
<h3>Ficha técnica (padrão SENAI)</h3><p>Cada treinamento tem ficha técnica com objetivos, público-alvo, pré-requisitos, conteúdo e benefícios. <strong>Siga a ficha</strong>: o conteúdo ministrado deve corresponder ao que o cliente contratou e ao que constará no certificado.</p>
<h3>Modalidades</h3><ul><li><strong>Presencial / in company:</strong> teoria e prática com o instrutor.</li><li><strong>Híbrida (Blended Learning):</strong> teoria e avaliação on-line no AVA UniLTS; prática presencial com o instrutor, que lança a nota prática, a lista de presença e as evidências.</li><li><strong>EaD:</strong> 100% no AVA, com certificado automático após aprovação.</li></ul>` }
    ]},
    { titulo: "Módulo 2 · Políticas corporativas", aulas: [
      { id: "t2a1", titulo: "Políticas, ética e proteção de dados", duracao: "30 min", youtube: "", texto: `<p>Todo instrutor e parceiro deve conhecer e cumprir:</p>
<ul><li><strong>Política de SSMA (LTS-POL-001):</strong> direito de recusa diante de risco grave e iminente, hierarquia de controles em toda aula prática.</li><li><strong>Política da Qualidade (LTS-POL-002):</strong> rastreabilidade completa de cada turma.</li><li><strong>Código de Ética e Conduta (LTS-COD-001):</strong> respeito, sigilo, combate ao assédio, conflito de interesses e Canal de Denúncias com protocolo rastreável.</li><li><strong>Política de Reembolso e Cancelamento (LTS-POL-003):</strong> nas vendas on-line, estorno bloqueia o acesso e revoga certificados.</li><li><strong>Termo de Compromisso Social (LTS-TCS-001).</strong></li></ul>
<h3>LGPD na prática</h3><ul><li>Peça apenas os dados necessários; ASO é dado sensível.</li><li>Não fotografe documentos pessoais dos participantes.</li><li>Não compartilhe listas e notas fora da plataforma.</li><li>Em telas públicas, o CPF aparece sempre mascarado (123.***.***-**).</li></ul>
<h3>Propriedade intelectual</h3><p>Apostilas, apresentações e materiais da LIPPMANN são de uso exclusivo nas turmas da LIPPMANN. É proibido copiar, distribuir ou reutilizar em outras empresas.</p>` }
    ]},
    { titulo: "Módulo 3 · Metodologia Ativa de Ensino", aulas: [
      { id: "t3a1", titulo: "O padrão de aula LIPPMANN", duracao: "35 min", youtube: "", texto: `<p>Treinamento eficaz não apenas informa: <strong>transforma comportamento</strong>. Por isso, o participante é o centro da aula.</p>
<h3>Roteiro de aula (5 etapas)</h3><ol><li><strong>Conexão:</strong> quebra-gelo e pergunta sobre a realidade do participante.</li><li><strong>Problema:</strong> apresente um caso real (incidente, quase-acidente) antes da teoria.</li><li><strong>Construção:</strong> conceitos curtos, intercalados com perguntas e atividades em grupo.</li><li><strong>Prática:</strong> simulações e exercícios com o equipamento ou cenário real, sempre com análise de risco prévia.</li><li><strong>Compromisso:</strong> cada participante declara uma atitude segura que levará ao trabalho.</li></ol>
<h3>Técnicas recomendadas</h3><ul><li>Estudo de caso e análise de acidentes.</li><li>Sala de aula invertida (teoria no AVA, prática presencial: modalidade híbrida).</li><li>Simulações realistas e role-play.</li><li>Gamificação com perguntas rápidas.</li></ul>
<h3>Avaliação</h3><p>Avaliação teórica (FR-DOC-11), avaliação prática (FR-DOC-09) e avaliação de reação (FR-DOC-04) em todas as turmas. Aprovação com nota mínima definida no curso, nas duas avaliações.</p>` }
    ]},
    { titulo: "Módulo 4 · Tutorial interativo da plataforma UniLTS", aulas: [
      { id: "t4a1", titulo: "Passo a passo: da turma ao relatório FR-DOC-18", duracao: "40 min", youtube: "", texto: `<p>Clique em cada passo para ver o que fazer no <strong>Painel do Parceiro</strong> (lippmannts.com/parceiro).</p>
<details open><summary><strong>Passo 1 · Primeiro acesso</strong></summary><p>Entre com o e-mail cadastrado e a senha provisória recebida por e-mail. O sistema exige a troca da senha (mínimo de 8 caracteres, letras e números).</p></details>
<details><summary><strong>Passo 2 · Criar a turma</strong></summary><p>Clique em <em>+ Nova turma presencial</em>, escolha o curso, a modalidade (Presencial ou Híbrida/Blended Learning), a empresa contratante, as datas e o local. O código oficial (TXXXXX-EAAAA) é gerado automaticamente.</p></details>
<details><summary><strong>Passo 3 · Participantes</strong></summary><p>Na aba <em>Participantes e notas</em>, adicione cada pessoa com nome completo (é o nome do certificado) e CPF. Na turma híbrida, os participantes fazem a teoria e a avaliação on-line no AVA.</p></details>
<details><summary><strong>Passo 4 · Notas e presença</strong></summary><p>Lance a nota teórica e a prática (de 0 a 10) e os horários de entrada e saída de cada participante. Use <em>Preencher entrada/saída com o horário da turma</em> para agilizar. Na turma híbrida, a nota teórica vem do AVA e você lança apenas a prática.</p></details>
<details><summary><strong>Passo 5 · Documentos FR-DOC</strong></summary><p>Envie (PDF ou foto legível): FR-DOC-02 · Lista de Presença, FR-DOC-04 · Avaliação de Reação, FR-DOC-09 · Avaliação Prática, FR-DOC-11 · Avaliação Teórica, termos de autorização de uso de imagem e a sua credencial (MTE/CREA).</p></details>
<details><summary><strong>Passo 6 · Evidências fotográficas</strong></summary><p>As 4 fotos são obrigatórias, no arquivo original da câmera (mínimo de 1280 px), cada uma com descrição de pelo menos 10 caracteres: 1. Selfie com o grupo · 2. Exercício teórico · 3. Exercício prático · 4. Foto final com a turma.</p></details>
<details><summary><strong>Passo 7 · Concluir a turma</strong></summary><p>Com notas, presença, documentos e fotos completos, clique em <em>Concluir turma</em>. Os aprovados recebem o certificado com QR Code automaticamente e a turma fica bloqueada para edição.</p></details>
<details><summary><strong>Passo 8 · Relatório FR-DOC-18</strong></summary><p>Abra o <em>Relatório FR-DOC-18</em>: ele reúne dados da turma, notas, trilha de auditoria, documentos, fotos legendadas e, em anexo, os certificados. Salve em PDF e envie ao cliente, se solicitado.</p></details>
<p>Dúvidas? Consulte a <strong>Central de Ajuda</strong> (lippmannts.com/ajuda.html) ou fale com a coordenação pelo WhatsApp (11) 94013-8792.</p>` }
    ]}
  ],
  avaliacao: [
    { pergunta: "Qual é o manifesto que orienta a LIPPMANN?", alternativas: ["Produtividade em primeiro lugar", "Segurança não é prioridade. Segurança é valor.", "Treinar rápido e barato", "Cumprir a norma é suficiente"], correta: 1 },
    { pergunta: "Na modalidade Híbrida (Blended Learning), o que o instrutor lança no Painel do Parceiro?", alternativas: ["Somente a nota teórica", "A nota prática, a presença, os documentos e as evidências", "Nada: tudo é automático", "Apenas as fotos"], correta: 1 },
    { pergunta: "Quantas fotos de evidência são obrigatórias por turma?", alternativas: ["1", "2", "4, com legenda e em resolução original", "Nenhuma"], correta: 2 },
    { pergunta: "O FR-DOC-04 corresponde a:", alternativas: ["Lista de Presença", "Avaliação de Reação", "Avaliação Prática", "Avaliação Teórica"], correta: 1 },
    { pergunta: "Na etapa 'Problema' do padrão de aula LIPPMANN, o instrutor deve:", alternativas: ["Ler a norma inteira", "Apresentar um caso real antes da teoria", "Aplicar a prova", "Encerrar a aula"], correta: 1 },
    { pergunta: "Sobre dados pessoais dos participantes (LGPD), é correto:", alternativas: ["Fotografar o RG de todos", "Compartilhar listas em grupos de mensagem", "Pedir apenas o necessário e não divulgar fora da plataforma", "Exibir o CPF completo em telas públicas"], correta: 2 },
    { pergunta: "O que acontece ao concluir uma turma completa?", alternativas: ["Nada", "Os aprovados recebem certificado com QR Code e a turma fica bloqueada para edição", "A turma é excluída", "O cliente precisa emitir os certificados"], correta: 1 },
    { pergunta: "Os materiais didáticos da LIPPMANN podem ser:", alternativas: ["Reutilizados em outras empresas", "Distribuídos livremente", "Usados exclusivamente nas turmas da LIPPMANN", "Vendidos pelo instrutor"], correta: 2 },
    { pergunta: "Diante de risco grave e iminente numa aula prática, o instrutor deve:", alternativas: ["Continuar para cumprir a carga horária", "Interromper a atividade, conforme a Política de SSMA", "Pedir que os participantes assinem um termo", "Ignorar"], correta: 1 },
    { pergunta: "Onde o cliente recebe o consolidado da turma com notas, documentos, fotos e certificados?", alternativas: ["No Relatório FR-DOC-18", "Por mensagem de voz", "Somente por telefone", "Não recebe"], correta: 0 }
  ]
};
