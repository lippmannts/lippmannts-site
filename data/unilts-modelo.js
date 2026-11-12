/* =====================================================================
   UniLTS · CURSO-MODELO (EaD)
   Usado como exemplo no modo demonstração e como modelo inicial no banco.
   Os cursos oficiais são cadastrados e editados no painel L³ INTEGRA › UniLTS.
   ===================================================================== */
window.UNI_CURSO_MODELO = {
  id: "integracao-ssma-ead",
  titulo: "Integração de Saúde, Segurança e Meio Ambiente (SSMA)",
  nr: "NR 01",
  norma: "NR 01 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais (GRO)",
  modalidade: "EaD (ensino a distância)",
  carga_horaria: 4,
  resumo: "Primeiro contato do colaborador com a Cultura de Segurança: direitos e deveres, perigos e riscos, GRO/PGR, EPI, emergências e responsabilidade ambiental.",
  imagem: "/assets/img/treinamentos/integracao-ssma.webp",
  nota_corte: 7,
  tentativas_max: 3,
  validade_meses: 0,
  instrutor_nome: "William Lippmann",
  instrutor_qualificacao: "Instrutor de Aprendizagem Industrial · Técnico de Segurança do Trabalho",
  rt_nome: "William Lippmann",
  rt_qualificacao: "Responsável Técnico · LIPPMANN Treinamentos e Soluções",
  mapa_mental: "/downloads/unilts/mapa-mental-integracao-ssma.pdf",
  conteudo_programatico: [
    "Conceitos fundamentais de Saúde, Segurança e Meio Ambiente (SSMA)",
    "Direitos e deveres dos trabalhadores e empregadores",
    "Perigo, risco e medidas de controle",
    "Gerenciamento de Riscos Ocupacionais (GRO) e Programa de Gerenciamento de Riscos (PGR)",
    "Equipamentos de Proteção Individual (EPI): seleção, uso, guarda e conservação",
    "Comunicação de perigos, incidentes e desvios",
    "Procedimentos de emergência e abandono de área",
    "Responsabilidade ambiental e Cultura de Segurança"
  ],
  plano_ensino: `<h2>Identificação</h2>
<p><strong>Curso:</strong> Integração de Saúde, Segurança e Meio Ambiente (SSMA) · <strong>Modalidade:</strong> EaD · <strong>Carga horária:</strong> 4 horas · <strong>Referência:</strong> NR 01 (GRO) e seu Anexo II (diretrizes para ensino a distância).</p>
<h2>Objetivo geral</h2>
<p>Capacitar o trabalhador para reconhecer os perigos e riscos do ambiente de trabalho, adotar comportamentos seguros e conhecer seus direitos, deveres e os procedimentos de SSMA da organização.</p>
<h2>Objetivos específicos</h2>
<ul><li>Diferenciar perigo, risco e medida de controle.</li><li>Compreender o GRO, o PGR e a hierarquia das medidas de prevenção.</li><li>Utilizar, guardar e conservar corretamente os EPIs.</li><li>Comunicar perigos, incidentes e desvios.</li><li>Agir corretamente em situações de emergência e abandono de área.</li></ul>
<h2>Público-alvo</h2>
<p>Novos colaboradores, terceiros e prestadores de serviço, estagiários, aprendizes e profissionais em reciclagem.</p>
<h2>Estratégia pedagógica</h2>
<p>Aulas em vídeo e textos de apoio no Ambiente Virtual de Aprendizagem (AVA UniLTS), mapa mental para revisão e avaliação de aprendizagem on-line. O progresso, os acessos e as avaliações ficam registrados no AVA. Dúvidas são atendidas pelo instrutor pelo WhatsApp (11) 94013-8792 ou pelo e-mail atendimento@lippmannts.com.</p>
<h2>Avaliação de aprendizagem</h2>
<p>Liberada após a conclusão de todas as aulas. São até <strong>3 tentativas</strong>; a aprovação exige nota mínima <strong>7,00</strong> (de 0 a 10). Após a terceira reprovação, o aluno deve contatar a coordenação para reorientação.</p>
<h2>Certificação</h2>
<p>O certificado é emitido automaticamente após a aprovação, com nome do trabalhador, conteúdo programático, carga horária, data, local (AVA UniLTS), nome e qualificação do instrutor e assinatura do responsável técnico, além de QR Code para validação pública em lippmannts.com/validar.html.</p>`,
  modulos: [
    { titulo: "Módulo 1 · Fundamentos de SSMA", aulas: [
      { id: "m1a1", titulo: "Boas-vindas e Cultura de Segurança", duracao: "20 min", youtube: "", texto: `<p>Na LIPPMANN acreditamos que <strong>segurança não é prioridade, segurança é valor</strong>. Prioridades mudam conforme o dia; valores não. Esta aula apresenta o que é SSMA (Saúde, Segurança e Meio Ambiente) e por que cada pessoa é responsável pela própria segurança e pela dos colegas.</p><ul><li><strong>Saúde:</strong> bem-estar físico e mental do trabalhador.</li><li><strong>Segurança:</strong> prevenção de acidentes e doenças relacionadas ao trabalho.</li><li><strong>Meio ambiente:</strong> prevenção de impactos ambientais das atividades.</li></ul>` },
      { id: "m1a2", titulo: "Direitos e deveres no trabalho", duracao: "30 min", youtube: "", texto: `<p>A NR 01 define responsabilidades para empregadores e trabalhadores.</p><h3>Cabe ao empregador</h3><ul><li>Cumprir e fazer cumprir as normas de segurança e saúde.</li><li>Informar os riscos e as medidas de prevenção.</li><li>Fornecer gratuitamente EPI adequado ao risco.</li></ul><h3>Cabe ao trabalhador</h3><ul><li>Cumprir as ordens de serviço e procedimentos.</li><li>Usar o EPI fornecido e colaborar com a empresa.</li><li>Submeter-se aos exames médicos previstos.</li></ul><p>O trabalhador pode <strong>interromper a atividade</strong> quando constatar situação de risco grave e iminente, comunicando imediatamente o superior hierárquico.</p>` }
    ]},
    { titulo: "Módulo 2 · Perigos, riscos e GRO", aulas: [
      { id: "m2a1", titulo: "Perigo, risco e medidas de controle", duracao: "35 min", youtube: "", texto: `<p><strong>Perigo</strong> é a fonte com potencial de causar lesão ou agravo à saúde (por exemplo, uma máquina em movimento). <strong>Risco</strong> é a combinação da probabilidade de ocorrer o dano e da sua severidade.</p><p>As medidas de prevenção seguem uma ordem de prioridade:</p><ol><li>Eliminação do perigo.</li><li>Substituição por algo menos perigoso.</li><li>Medidas de proteção coletiva e de engenharia.</li><li>Medidas administrativas ou de organização do trabalho.</li><li>Equipamento de Proteção Individual (EPI).</li></ol>` },
      { id: "m2a2", titulo: "GRO e PGR na prática", duracao: "35 min", youtube: "", texto: `<p>O <strong>Gerenciamento de Riscos Ocupacionais (GRO)</strong> é o processo contínuo de identificar perigos, avaliar riscos e implementar medidas de prevenção. Ele é documentado no <strong>Programa de Gerenciamento de Riscos (PGR)</strong>, composto pelo inventário de riscos e pelo plano de ação.</p><blockquote>O PGR não é um documento de gaveta: ele deve ser conhecido por todos e revisado sempre que houver mudanças.</blockquote>` }
    ]},
    { titulo: "Módulo 3 · Proteção e comunicação", aulas: [
      { id: "m3a1", titulo: "EPI: uso, guarda e conservação", duracao: "30 min", youtube: "", texto: `<p>O EPI deve possuir <strong>Certificado de Aprovação (CA)</strong> válido e ser adequado ao risco. O trabalhador deve:</p><ul><li>usar o EPI apenas para a finalidade a que se destina;</li><li>responsabilizar-se pela guarda e conservação;</li><li>comunicar qualquer alteração que o torne impróprio para uso.</li></ul>` },
      { id: "m3a2", titulo: "Comunicação de perigos, incidentes e desvios", duracao: "25 min", youtube: "", texto: `<p>Todo <strong>incidente</strong> (evento que poderia ter causado lesão) e todo <strong>desvio</strong> (condição ou ato fora do padrão) deve ser comunicado. Comunicar não é dedurar: é prevenir que um quase-acidente se transforme em acidente.</p>` }
    ]},
    { titulo: "Módulo 4 · Emergências e meio ambiente", aulas: [
      { id: "m4a1", titulo: "Emergência e abandono de área", duracao: "30 min", youtube: "", texto: `<p>Conheça as rotas de fuga, saídas de emergência e o ponto de encontro da sua unidade. Ao ouvir o alarme:</p><ol><li>Mantenha a calma e interrompa a atividade com segurança.</li><li>Siga as orientações da brigada de emergência.</li><li>Não use elevadores e não volte para buscar objetos.</li><li>Dirija-se ao ponto de encontro e aguarde a contagem.</li></ol>` },
      { id: "m4a2", titulo: "Responsabilidade ambiental", duracao: "35 min", youtube: "", texto: `<p>Separar corretamente os resíduos, evitar desperdícios de água e energia e comunicar vazamentos são atitudes que protegem o meio ambiente e fazem parte da Cultura de SSMA.</p>` }
    ]}
  ],
  avaliacao: [
    { pergunta: "O que diferencia PERIGO de RISCO?", alternativas: ["São sinônimos", "Perigo é a fonte de dano; risco combina probabilidade e severidade", "Risco é a fonte de dano; perigo é a probabilidade", "Perigo só existe em indústrias"], correta: 1 },
    { pergunta: "Na hierarquia das medidas de prevenção, qual é a PRIMEIRA opção?", alternativas: ["Uso de EPI", "Treinamento", "Eliminação do perigo", "Sinalização"], correta: 2 },
    { pergunta: "O EPI deve possuir:", alternativas: ["Nota fiscal do trabalhador", "Certificado de Aprovação (CA) válido", "Cor azul", "Assinatura do supervisor"], correta: 1 },
    { pergunta: "Quem deve fornecer o EPI ao trabalhador?", alternativas: ["O próprio trabalhador", "O sindicato", "O empregador, gratuitamente", "A CIPA, mediante pagamento"], correta: 2 },
    { pergunta: "O que é o PGR?", alternativas: ["Programa de Gerenciamento de Riscos, com inventário de riscos e plano de ação", "Plano Geral de Remuneração", "Procedimento de Guarda de Resíduos", "Programa de Ginástica Regular"], correta: 0 },
    { pergunta: "Diante de risco grave e iminente, o trabalhador pode:", alternativas: ["Continuar a atividade para não atrasar", "Interromper a atividade e comunicar o superior", "Esperar o fim do turno", "Resolver sozinho sem avisar"], correta: 1 },
    { pergunta: "Um quase-acidente (incidente) deve ser:", alternativas: ["Ignorado, pois ninguém se feriu", "Comunicado, para prevenir acidentes futuros", "Comunicado apenas se houver dano material", "Registrado somente pela brigada"], correta: 1 },
    { pergunta: "Ao ouvir o alarme de emergência, você deve:", alternativas: ["Usar o elevador para sair rápido", "Voltar para buscar seus pertences", "Seguir a rota de fuga até o ponto de encontro", "Aguardar no posto de trabalho"], correta: 2 },
    { pergunta: "O GRO é:", alternativas: ["Um documento assinado uma única vez", "Um processo contínuo de identificar perigos, avaliar e controlar riscos", "Um equipamento de proteção coletiva", "Uma multa aplicada pela fiscalização"], correta: 1 },
    { pergunta: "Qual atitude demonstra responsabilidade ambiental?", alternativas: ["Descartar resíduos em qualquer lixeira", "Comunicar vazamentos e separar resíduos corretamente", "Deixar equipamentos ligados sem uso", "Lavar áreas externas com água potável diariamente"], correta: 1 }
  ]
};
