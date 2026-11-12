# Site LIPPMANN + L³ INTEGRA · GitHub + Vercel + Supabase · v8 (Fases 1 a 7 + ajustes de produção)

## Novidades da v8 (ajustes de produção)

- **Avaliações do Google:** consulta direta à Places API (New) v1 com o Place ID oficial `ChIJD_H4-aMgJ1wR2Z25wRuFG8I` (padrão no código; a variável `GOOGLE_PLACE_ID` só é necessária se um dia o ID mudar). Mostra nota geral, total de avaliações, foto real do autor, estrelas, tempo relativo ("há 2 semanas") e o texto de cada cliente. Cache de 24 h na tabela `config` (chave `google_avaliacoes_cache`). Teste: abra `https://lippmannts.com/api/site?modulo=avaliacoes`.
- **Bucket `curriculos` privado (LGPD):** o `schema.sql` agora força `public = false` em `curriculos` e `evidencias` mesmo se o bucket já existia como público. Rode o `schema.sql` inteiro de novo no SQL Editor; depois abra o diagnóstico e o alerta some.
- **Funções da Vercel:** 7 arquivos na raiz de `api/` (site, portal, uni, pagamento, lipp, painel, cron). Módulos em `api/_rotas/` e código comum em `api/_lib/`.
- **Domínio oficial:** canonical, Open Graph, sitemap, robots, e-mails, links de certificado (QR Code) e retorno do Mercado Pago usam `https://lippmannts.com`. Para outro endereço, crie a variável `URL_SITE` na Vercel.

## Ajuste da v7 para o plano gratuito da Vercel (Hobby)

- A Vercel gratuita aceita no máximo **12 funções** por publicação. A pasta `api/` agora tem **7**: os módulos públicos foram reunidos em `api/site.js` e as áreas da Empresa e do Parceiro em `api/portal.js` (o código de cada módulo fica em `api/_rotas/`, que a Vercel não conta como função).
- Os endereços antigos (`/api/catalogo`, `/api/hub`, `/api/empresa`...) continuam funcionando: o `vercel.json` redireciona cada um para a função nova. Nada muda para quem já tem links salvos.
- **Ao substituir a pasta no GitHub Desktop, apague os arquivos antigos da pasta `api/`** (catalogo.js, hub.js, empresa.js...). O jeito mais seguro: apague a pasta `api/` inteira do repositório e cole a nova. Se os antigos ficarem lá, a Vercel volta a contar 19 funções.

### Avaliações do Google (perfil oficial · ficha CdmducEbhRvCEAE)
- O carrossel busca as avaliações reais da "Lippmann Treinamentos & Soluções". O Place ID oficial (`ChIJD_H4-aMgJ1wR2Z25wRuFG8I`) já vem no código; **só precisa da variável `GOOGLE_PLACES_API_KEY`** (`GOOGLE_PLACE_ID` é opcional).
- **Cache de 24 horas:** o Google é consultado no máximo 1 vez por dia (cerca de 30 consultas por mês). A cópia fica na tabela `config` do Supabase e a Vercel ainda guarda a resposta por 1 hora. Se o Google falhar, o site continua mostrando a última cópia boa.
- O botão "Avalie-nos no Google" e o QR Code apontam sempre para o link oficial `https://g.page/r/CdmducEbhRvCEAE/review`. O QR Code aparece na seção de avaliações, no rodapé de todas as páginas e na tela de conclusão de curso do AVA.
- Para criar a chave: Google Cloud Console › projeto › *APIs e serviços › Biblioteca* › ative **Places API (New)** › *Credenciais › Criar credenciais › Chave de API* › em *Restrições da API*, deixe só a Places API (New). Configure também um alerta de orçamento (Faturamento › Orçamentos e alertas) de R$ 1 para ter certeza de que nada é cobrado.

## Novidades da v7 · Fase 7 (Expansão Enterprise, IA e Blindagem)

**Antes de publicar:** rode o `supabase/schema.sql` inteiro de novo no SQL Editor (ele só acrescenta o que falta; não apaga nada).

1. **CPF mascarado (LGPD):** em toda tela pública ou semipública (validador de certificados, QR Code, marcas d'água e consultas de pedido) o CPF aparece só com os 3 primeiros dígitos: `123.***.***-**`.
2. **Modalidade Híbrida (Blended Learning):** teoria e avaliação no AVA; o instrutor parceiro lança nota prática, presença, documentos FR-DOC e fotos no Painel do Parceiro.
3. **Trilha obrigatória do instrutor parceiro:** curso interno da UniLTS (institucional, portfólio, políticas, metodologia ativa e tutorial da plataforma). Enquanto o parceiro não for aprovado, ele não cria nem conclui turmas. O superadministrador pode dispensar a trilha em *UniLTS › Parceiros*.
4. **Central de Ajuda** (`/ajuda.html`): passo a passo para alunos, empresas, instrutores, compras e ouvidoria.
5. **LIPP, assistente virtual com IA:** botão flutuante acima do WhatsApp em todas as páginas públicas. Recomenda treinamentos e soluções do catálogo (o que você editar no painel, ele passa a saber), qualifica a necessidade e agenda reunião de 30 minutos no Google Meet (segunda a sexta, das 9h às 17h). Tudo fica na aba **L³ INTEGRA › LIPP · Assistente IA**: conversas, principais temas e dúvidas, leads e reuniões (com confirmação e link do Meet). Nova permissão de acesso: "LIPP".
6. **Ouvidoria com protocolo:** Denúncias, Reclamações e Sugestões do Fale Conosco geram protocolo `OUV-AAAA-XXXXXX` + código de acesso de 6 dígitos. O solicitante acompanha em `/protocolo.html`; cada resposta pública do painel (aba **Ouvidoria**) vai por e-mail automaticamente. Anotações internas não aparecem para o solicitante.
7. **Pedidos rastreáveis e reembolso (padrão Hotmart):** cada compra tem código único, consulta em `/pedido.html` (código + e-mail). O cancelamento é só por pedido formal para atendimento@lippmannts.com e WhatsApp, com Código, Nome, CPF, E-mail e Forma de pagamento. Ao estornar, o acesso é bloqueado ("compra cancelada pelo usuário") e o certificado passa a exibir o **alerta vermelho de REVOGADO** no validador. Nova **Política de Reembolso e Cancelamento (LTS-POL-003)** em *A LIPPMANN › Políticas* (minuta REV00: revise com seu jurídico antes de publicar).
8. **Proteção do conteúdo do AVA:** sem download de apostilas e mapas mentais, impressão e "salvar como PDF" bloqueados, cópia bloqueada e marca d'água dinâmica com nome e CPF mascarado do aluno. (Nenhum site impede uma foto da tela; a marca d'água identifica quem vazou.)
9. **Avaliações do Google:** carrossel automático (e deslizável) com foto, estrelas, data e comentário, mais o botão "Avalie-nos no Google".

### Configuração das integrações da Fase 7 (Vercel › Settings › Environment Variables)

Todas são **opcionais**: sem elas o site funciona, com as alternativas indicadas.

**a) IA do LIPP (Claude)** · sem ela, o LIPP responde pela base de conhecimento do site.
1. Acesse console.anthropic.com, crie a conta da empresa e cadastre a forma de pagamento.
2. Em *API Keys*, clique em *Create Key* e copie a chave.
3. Na Vercel, crie `ANTHROPIC_API_KEY` com a chave. (Opcional: `LIPP_MODELO`, padrão `claude-haiku-5-5`, rápido e econômico.)

**b) Google Agenda + Meet da conta comercial@lippmannts.com** · sem ela, cada reunião fica "a confirmar": a equipe recebe o pedido por e-mail e confirma o link do Meet pela aba LIPP do painel.
1. Em console.cloud.google.com, crie um projeto "LIPPMANN Site" e ative a **Google Calendar API**.
2. *APIs e serviços › Tela de consentimento OAuth*: tipo Interno (Workspace) ou Externo; adicione comercial@lippmannts.com como usuário de teste.
3. *Credenciais › Criar credenciais › ID do cliente OAuth › Aplicativo da Web*. Em URIs de redirecionamento, coloque `https://developers.google.com/oauthplayground`. Copie o ID e a chave secreta.
4. Abra developers.google.com/oauthplayground, clique na engrenagem, marque *Use your own OAuth credentials* e cole o ID e a chave.
5. No passo 1, digite o escopo `https://www.googleapis.com/auth/calendar`, clique em *Authorize APIs* e entre com **comercial@lippmannts.com**.
6. No passo 2, clique em *Exchange authorization code for tokens* e copie o **Refresh token**.
7. Na Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (e, se quiser outra agenda, `GOOGLE_CALENDAR_ID`).
   O LIPP passa a ler os horários ocupados da agenda e cria o evento com link do Google Meet, enviando o convite ao cliente.

**c) Avaliações do Google** · sem ela, aparecem os depoimentos fixos com a nota 4,9.
1. No mesmo projeto do Google Cloud, ative a **Places API (New)** e crie uma *Chave de API* (restrinja-a à Places API).
2. Descubra o Place ID da LIPPMANN em developers.google.com/maps/documentation/places/web-service/place-id (busque "Lippmann Treinamentos & Soluções").
3. Na Vercel: `GOOGLE_PLACES_API_KEY` (o `GOOGLE_PLACE_ID` é opcional: o Place ID oficial já vem no código). A API devolve até 5 avaliações (as mais relevantes) e o site consulta o Google no máximo 1 vez a cada 24 horas.

Depois de criar as variáveis, faça *Redeploy*. O diagnóstico (`/integra/diagnostico.html`) mostra as novas tabelas.

## Novidades da v6 · Fase 6 (Multi-idiomas e fechamento)
- **5 idiomas:** português do Brasil (original), português de Portugal, inglês (EUA), inglês (Reino Unido) e espanhol (Espanha). O visitante escolhe no **globo** da barra azul do topo (e no cabeçalho da Área do Aluno, da Empresa e do Parceiro). Na primeira visita, o site já abre no idioma do navegador; a escolha fica guardada. Também dá para mandar o link direto: `https://lippmannts.com/?lang=en-US` (ou `pt-PT`, `en-GB`, `es-ES`).
- **O que é traduzido:** todas as páginas públicas, menus, rodapé, formulários e mensagens, catálogo e fichas de treinamento, soluções, HUB (títulos e resumos), políticas, Termo de Compromisso Social, validação de certificados, checkout e as áreas do Aluno, da Empresa e do Parceiro.
- **O que fica em português (Brasil), de propósito:** o conteúdo das aulas EaD, as questões da avaliação, os certificados NR-01 e o relatório FR-DOC-18 (documentos com validade legal no Brasil), o corpo dos artigos do HUB, os PDFs e o L³ INTEGRA (painel interno da equipe). Nas páginas traduzidas aparece um aviso quando o conteúdo está só em português.
- **Português de Portugal:** o site adapta automaticamente vocabulário e acentuação (equipa, registo, telemóvel, ficheiro, formação, contacto, género…), sem mexer no nome da empresa.
- **Inglês britânico:** derivado do americano com a ortografia britânica (organisation, programme, enrol, centre, CV…).
- **Traduções no-code:** L³ INTEGRA › Site e conteúdo › **Traduções**. Escolha o idioma, filtre “Sem tradução” ou “Conteúdo do painel” (treinamentos, soluções, HUB, políticas e cursos que vocês cadastraram) e escreva/ajuste a tradução. Vale em até 1 minuto. “Voltar ao padrão” desfaz a edição. Nova permissão: **Traduções (multi-idiomas)**.
- **Soluções editáveis no-code:** L³ INTEGRA › Site e conteúdo › **Soluções**: incluir, editar, ocultar, reordenar (a numeração 01, 02… segue a ordem), prévia do cartão e **Grupos e filtros** (renomear, incluir, reordenar). Nova permissão: **Soluções (catálogo)**.
- **Documentos oficiais do Painel do Parceiro:** FR-DOC-02 · Lista de Presença, FR-DOC-04 · Avaliação de Reação, FR-DOC-09 · Avaliação Prática, FR-DOC-11 · Avaliação Teórica (mais termos de imagem e credencial do instrutor). Todos são obrigatórios para concluir a turma e aparecem com esses títulos no relatório FR-DOC-18.
- **Obrigatório depois de publicar:** rode o `supabase/schema.sql` de novo (tabelas `catalogo_solucoes` e `i18n_textos`, com as 20 soluções do LTS-CAT-002 já carregadas). Depois, em Configurações › Usuários, marque as novas permissões para quem precisar (o superadministrador já tem todas).


## Novidades da v6 · Fase 5 (Pagamentos e Financeiro)
- **Checkout da UniLTS** (`/checkout.html?curso=…`): o aluno pessoa física compra o curso EaD com **PIX dinâmico** (QR Code e copia e cola, válido por 30 minutos) ou **cartão de crédito** em até 12x (formulário seguro do Mercado Pago; a LIPPMANN não armazena dados de cartão). Pagamento aprovado = aluno cadastrado, matriculado na turma contínua de vendas on-line e e-mail com a senha provisória, tudo automático.
- **Preço e venda:** em L³ INTEGRA › UniLTS › Cursos › Dados, preencha o preço e marque "Vender on-line". O botão "Matricular-se agora" aparece sozinho na página UniLTS.
- **Reembolso em 7 dias (direito de arrependimento):** o aluno pede pela Área do Aluno (Meus pedidos) ou pela página do pedido. O estorno é feito no Mercado Pago e, na mesma hora, o acesso é bloqueado e o certificado passa a aparecer como **cancelado** na validação pública. Estornos feitos direto no Mercado Pago (ou contestação no cartão) chegam pelo webhook e têm o mesmo efeito. Depois dos 7 dias, só o superadministrador estorna.
- **L³ INTEGRA › Financeiro e BI** (permissão própria, fora do perfil marketing):
  - **BI & Analytics:** faturamento bruto consolidado com filtro de período, ranking dos cursos mais vendidos, ticket médio, formas de pagamento e **horas de treinamento dedicadas** (carga horária × alunos aprovados) para relatórios ESG; DRE simplificada exportável em Excel.
  - **Pedidos e estornos:** todos os pedidos, filtros, estorno com motivo registrado.
  - **Despesas e receitas:** lançamento sem código das despesas do mês (e receitas fora da loja, como contratos B2B), com cálculo na hora do **lucro líquido** e da **Provisão Social de 10%** (Termo de Compromisso Social).
- **Três modos de pagamento**, escolhidos automaticamente pelas variáveis da Vercel:
  1. **Simulação** (sem variáveis do Mercado Pago): nada é cobrado; PIX é aprovado em Financeiro e BI › Pedidos › "Simular aprovação"; no cartão, titular APRO aprova e OTHE recusa.
  2. **Sandbox** (credenciais de teste, começam com `TEST-`): fluxo real do Mercado Pago, sem dinheiro de verdade. Use os cartões de teste do Mercado Pago.
  3. **Produção** (credenciais de produção): cobrança real.
- **Obrigatório depois de publicar:**
  1. Rode o `supabase/schema.sql` de novo (tabelas `uni_pedidos` e `fin_lancamentos`, colunas de preço).
  2. Para sair da simulação, cadastre na Vercel `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` e `MP_WEBHOOK_SECRET` (Mercado Pago › Suas integrações › sua aplicação › Credenciais / Webhooks) e faça Redeploy.
  3. No Mercado Pago › Webhooks, cadastre a URL `https://lippmannts.com/api/pagamento?acao=webhook` com o evento **Pagamentos**.
  4. Dê a permissão "Financeiro e BI" só a quem precisa (Configurações › Usuários).
- A tarefa diária (`/api/cron`) também expira os PIX não pagos.
- Os valores do BI são gerenciais e não substituem a apuração contábil oficial.


## Novidades da v6 · Fase 4 (Empresas e Instrutores)
- **Área da Empresa** (`/empresa/`): cada cliente PJ vê somente os próprios dados (isolamento pelo servidor). Baixa o modelo Excel padrão, importa a equipe (com validação linha a linha), vincula colaboradores às turmas por listas suspensas (unidade, área, cargo, filial), acompanha progresso e certificados e exporta a planilha com colunas automáticas por curso (situação, data de realização e validade).
- **Painel do Parceiro** (`/parceiro/`): o instrutor registra turmas presenciais e híbridas, participantes, notas teórica e prática, entrada e saída, documentos (FR-DOC-02 Lista de Presença, FR-DOC-04 Avaliação de Reação, FR-DOC-09 Avaliação Prática, FR-DOC-11 Avaliação Teórica, termos de imagem e credencial MTE/CREA) e as 4 fotos obrigatórias em resolução total (mínimo 1280 px), cada uma com legenda fixa e descrição. Ao concluir, os certificados dos aprovados são emitidos sozinhos.
- **Prazo de 30 dias corridos** para concluir o EaD (configurável por turma): estourou, o progresso volta a 0% e um novo prazo começa, com registro na auditoria.
- **Revogação automática** do acesso do aluno 12 meses após o encerramento da turma; só o superadministrador reabilita (L³ INTEGRA › UniLTS › turma).
- **Relatório FR-DOC-18 completo**: prestadora e contratante, dados da turma, notas, trilha de auditoria de entradas e saídas, documentos, fotos legendadas e, em anexo, as folhas de certificado de todos os aprovados.
- **L³ INTEGRA › UniLTS** ganhou as abas Empresas e Parceiros, e as turmas agora têm modalidade (EaD, presencial, híbrida), empresa, instrutor parceiro e prazo.
- **Obrigatório depois de publicar:**
  1. Rode o `supabase/schema.sql` de novo (tabelas de empresas, parceiros, colaboradores e evidências, novas colunas e o bucket privado `evidencias`).
  2. Cadastre na Vercel a variável `CRON_SECRET` (texto aleatório com 32+ caracteres) e faça Redeploy. Ela protege a tarefa diária automática (`/api/cron`, todos os dias às 6h de Brasília).
- **LGPD:** dados de ASO são dados pessoais sensíveis. Ficam visíveis apenas para a própria empresa e para a LIPPMANN; documentos e fotos ficam em armazenamento privado com links temporários.


## Novidades da v6 · Fase 3 (UniLTS)
- **Menu UniLTS** no site (`/unilts.html`): como funciona, cursos EaD e validação de certificados.
- **Área do Aluno** (`/unilts/`): login, troca obrigatória da senha provisória no primeiro acesso, meus cursos com progresso, plano de ensino, mapa mental para baixar e imprimir, aulas com vídeo do YouTube, avaliação com até 3 tentativas e nota mínima 7,00, e certificado.
- **Turmas numeradas automaticamente** no formato `TXXXXX-EAAAA`, começando em **T00033**, em sequência contínua e sem lacunas (o ano vem da data de início da turma).
- **Certificados NR 01** em A4 (frente e verso) com QR Code; validação pública em `/validar.html` com CPF mascarado (LGPD).
- **Relatório de Treinamento FR-DOC-18** da turma, pronto para salvar em PDF (L³ INTEGRA › UniLTS › turma › Relatório).
- **L³ INTEGRA › UniLTS**: turmas, matrícula de alunos (envio automático do acesso por e-mail), cursos EaD (editor de aulas, avaliação e dados do certificado, incluindo assinaturas), alunos e numeração. A aba entra na matriz de acessos como "UniLTS"; o ajuste da numeração é exclusivo do superadministrador.
- **Obrigatório depois de publicar:** rode o `supabase/schema.sql` de novo no SQL Editor (cria as tabelas `uni_*`, o contador de turmas e o curso-modelo).


## Novidades da v6 · Fase 2 (HUB e Políticas)
- **HUB** (`/hub.html`): notícias, artigos técnicos e prestação de contas, com filtros, busca, vídeo do YouTube e botões de compartilhar. Duas publicações iniciais já vêm cadastradas.
- **Políticas corporativas** em A LIPPMANN › Políticas, em cartões de pré-visualização: Política de SSMA, Política da Qualidade, Código de Ética e Conduta (minutas REV00 para sua aprovação).
- **Termo de Compromisso Social** (`/termo-compromisso-social.html`) em exibição protegida: sem seleção, cópia, menu do botão direito, impressão ou download, com marca d'água de data e hora e véu quando a janela perde o foco. Nenhum site consegue impedir 100% uma foto da tela; essas medidas dificultam e identificam a origem.
- **Painel L³ INTEGRA › Site e conteúdo** (sem código):
  - **HUB e publicações**: editor visual (títulos, negrito, listas, links, imagens, vídeos), capa com envio de foto, tags, rascunho ou publicado.
  - **Treinamentos**: edite cartões e fichas (carga horária, modalidade, tags, vídeo, listas, PDF da ficha), ordem de exibição e ocultar/exibir.
  - **Políticas e Termo**: envie o PDF e a capa e o número de páginas são gerados sozinhos; documentos protegidos são escritos no editor visual.
  - Cada aba entra na matriz de acessos (HUB, Treinamentos, Políticas).
- **Obrigatório depois de publicar:** rode o `supabase/schema.sql` de novo no SQL Editor. Ele cria as tabelas novas, o bucket `publico` e o conteúdo inicial, sem apagar nada.


## Novidades da v6 · Fase 1
- Todos os links, e-mails, convites e metadados apontam para **https://lippmannts.com**. O site também ganhou `sitemap.xml` e `robots.txt`.
- **Barra de Acessibilidade** em todas as páginas: tamanho do texto, alto contraste, destaque de links, leitura em voz alta e Libras (VLibras).
- Login do L³ INTEGRA com **botão de olho** para mostrar ou ocultar a senha.
- **Matriz de acessos**: em Configurações › Usuários e acessos você cria, edita, troca senhas, inativa e exclui usuários, marcando as abas de cada um. Abas não marcadas somem do menu e são bloqueadas no servidor (erro "Unauthorized").
- **Obrigatório depois de publicar:** rode o `supabase/schema.sql` de novo no SQL Editor. Ele acrescenta a coluna de permissões e não apaga dados.


## Estrutura de pastas
```
lippmannts/
├── index.html                  ← páginas do site
├── a-lippmann.html
├── treinamentos.html
├── solucoes.html
├── conteudo.html
├── fale-conosco.html
├── trabalhe-conosco.html
├── politica-de-privacidade.html
│
├── assets/
│   ├── css/style.css           ← cores, fontes, layout
│   ├── img/                    ← logos, Lipp, fotos
│   └── js/
│       ├── config.js           ← WhatsApp, e-mail comercial, redes, cargos (edite aqui)
│       ├── layout.js           ← menu, rodapé, WhatsApp flutuante, envio de formulários
│       ├── catalogo.js         ← cartões e fichas de Treinamentos/Soluções
│       ├── conteudo.js         ← Biblioteca Técnica (cadastro, vídeo, PDF)
│       ├── fale-conosco.js
│       └── trabalhe-conosco.js
│
├── data/
│   ├── treinamentos.js         ← os 19 treinamentos (textos das fichas)
│   ├── solucoes.js             ← as 20 soluções
│   └── conteudos.js            ← lista reserva de materiais (a oficial fica no Supabase)
│
├── downloads/                  ← portfólios e apresentação em PDF (com links de WhatsApp)
│   └── fichas/                 ← 19 fichas técnicas em PDF
├── materiais/                  ← PDFs de exemplo da Biblioteca
│
├── integra/                    ← painel L³ INTEGRA (www.lippmannts.com/integra/)
│   ├── index.html
│   ├── app.js
│   ├── integra.css
│   └── demo.js                 ← só usado no modo demonstração
│
├── api/                        ← funções da Vercel (Node.js) = "back-end" · 7 funções (plano Hobby: máximo 12)
│   ├── site.js                 ← /api/site?modulo=...   · APIs públicas: catalogo, hub, politicas, materiais, i18n,
│   │                              avaliacoes (Google), evento, registrar, upload, protocolo, certificado, diagnostico
│   ├── portal.js               ← /api/portal?modulo=empresa|parceiro&acao=... · Área da Empresa e Painel do Parceiro
│   ├── uni.js                  ← /api/uni?acao=...      · Área do Aluno (AVA UniLTS)
│   ├── pagamento.js            ← /api/pagamento?acao=... · checkout Mercado Pago (webhook incluído)
│   ├── lipp.js                 ← /api/lipp?acao=...     · assistente virtual LIPP
│   ├── painel.js               ← /api/painel?acao=...   · tudo do L³ INTEGRA (login, dados, agenda...)
│   ├── cron.js                 ← /api/cron              · tarefa diária automática
│   ├── _rotas/                 ← o código de cada módulo (não vira função; é chamado por site.js e portal.js)
│   └── _lib/                   ← código compartilhado (não vira função nem endereço público)
│
├── supabase/
│   └── schema.sql              ← cole no SQL Editor do Supabase (cria tabelas e pastas de arquivos)
│
├── package.json                ← bibliotecas usadas pelas funções
├── vercel.json                 ← configurações da Vercel
├── .env.example                ← lista das variáveis de ambiente (sem valores reais)
├── .gitignore
└── LEIA-ME.md
```

## Passo a passo da publicação

### 1. Supabase (banco de dados e arquivos)
1. Em supabase.com, crie um projeto (região **South America (São Paulo)**).
2. Abra **SQL Editor › New query**, cole todo o arquivo `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas, a função dos relatórios e as duas pastas de arquivos: `curriculos` (privada) e `materiais` (pública).
3. Em **Project Settings › API**, copie: **Project URL**, a chave **anon public** e a chave **service_role**.
   A chave service_role é secreta: ela vai apenas na Vercel, nunca no GitHub.

### 2. GitHub
1. Crie um repositório **privado** (por exemplo `lippmannts`).
2. Envie os arquivos pelo **GitHub Desktop**: clone o repositório, copie para dentro dele todo o conteúdo desta pasta e clique em **Commit** e depois em **Push**.
   Evite o envio pelo navegador: ele pode perder as subpastas e corromper imagens e PDFs.

### 3. Vercel
1. Em vercel.com, clique em **Add New › Project**, escolha o repositório e, em *Framework Preset*, deixe **Other**. Não é preciso comando de build.
2. Antes de clicar em Deploy, abra **Environment Variables** e cadastre as variáveis do `.env.example`:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_ANON_KEY` | chave anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role (secreta) |
| `SESSAO_SEGREDO` | qualquer texto aleatório com 32 ou mais caracteres |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_REMETENTE` | dados da conta atendimento@lippmannts.com |
| `URL_SITE` | não é necessária (o padrão já é `https://lippmannts.com`). Se existir com `www`, apague ou troque para `https://lippmannts.com`. |
| `GITHUB_REPO_URL` (opcional) | endereço do repositório; cria atalhos de edição no painel |

3. Clique em **Deploy**. Em cerca de 1 minuto o site estará em `seu-projeto.vercel.app`, o **endereço de teste**.
4. Para usar o domínio: em **Settings › Domains**, adicione `www.lippmannts.com` e `lippmannts.com` e siga as instruções de DNS mostradas pela Vercel (no Registro.br ou onde o domínio estiver registrado).

### Onde encontrar cada chave no Supabase
- **SUPABASE_URL**: *Project Settings › Data API › Project URL*. O formato é `https://abcdefghijklmnop.supabase.co`, sem barra no final e sem `/rest/v1`. O botão **Connect**, no topo do projeto, também mostra esse endereço.
- **SUPABASE_SERVICE_ROLE_KEY** (secreta): *Project Settings › API Keys*. Na aba **Legacy API Keys**, copie a chave **service_role** (clique em *Reveal*); ela começa com `eyJ`. A **Secret key** (`sb_secret_…`) da aba **API Keys** também serve.
- **SUPABASE_ANON_KEY** (pública): na mesma tela, a chave **anon public** (`eyJ…`) ou a **Publishable key** (`sb_publishable_…`).
- Depois de cadastrar ou alterar variáveis na Vercel, é obrigatório ir em **Deployments › ⋯ › Redeploy**. As funções só leem as variáveis em um novo deploy.

### Verificação do site
Abra **`/integra/diagnostico.html`**. A página mostra, item por item, se as variáveis, as tabelas, os buckets, o e-mail e todos os arquivos (imagens e PDFs) estão corretos, e o que fazer quando algo falha.

### 4. Primeiro acesso ao L³ INTEGRA
- Acesse `/integra/` com **admin / PassaporteLTSAdmin**. Os usuários padrão são criados nesse primeiro login.
- Troque as senhas em **Configurações › Minha senha** e **Configurações › Usuários** (perfil marketing: PassaporteLTSmkt).
- Em **Configurações › Notificações e e-mail**, use **Enviar teste** para confirmar o SMTP.
- Em **Configurações › Materiais**, cadastre as apostilas (PDF) e os vídeos do YouTube.

## Manutenção do dia a dia
- **Textos, contatos e treinamentos:** edite no GitHub (abra o arquivo, clique no lápis, altere e clique em **Commit changes**). A Vercel publica sozinha. Se algo quebrar, use **Vercel › Deployments › (versão anterior) › Promote to Production**.
- **Materiais da Biblioteca, e-mails da equipe e usuários:** pelo painel L³ INTEGRA.
- **Ver os dados brutos:** Supabase › Table Editor (tabelas `registros`, `eventos`, `agenda`).
- **Currículos:** Supabase › Storage › curriculos, ou pelo botão "Abrir currículo" no painel.
- **Backup:** painel › Configurações › Segurança › Baixar backup (.json).

## Observações técnicas
- A cidade do visitante vem dos cabeçalhos da Vercel (`x-vercel-ip-city`), sem serviço externo.
- Currículos e PDFs vão do navegador **direto** para o Supabase Storage, por meio de um endereço temporário assinado. Assim o limite de 4,5 MB das funções da Vercel não atrapalha.
- Todas as tabelas têm RLS ligado e nenhuma política: só as funções da Vercel, com a chave service_role, leem ou gravam dados.
- No plano gratuito do Supabase, projetos sem acesso por 7 dias são pausados. Com o site recebendo visitas, isso não acontece.
- `"modoDemonstracao": true` em `assets/js/config.js` faz tudo funcionar sem servidor, com dados fictícios. Em produção, mantenha `false`.
