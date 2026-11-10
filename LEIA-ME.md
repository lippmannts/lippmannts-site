# Site LIPPMANN + L³ INTEGRA · GitHub + Vercel + Supabase

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
├── api/                        ← funções da Vercel (Node.js) = "back-end"
│   ├── registrar.js            ← POST /api/registrar  · formulários do site
│   ├── upload.js               ← POST /api/upload     · endereço temporário para enviar currículo ao Supabase
│   ├── evento.js               ← POST /api/evento     · estatísticas de navegação
│   ├── materiais.js            ← GET  /api/materiais  · lista pública da Biblioteca
│   ├── painel.js               ← /api/painel?acao=... · tudo do L³ INTEGRA (login, dados, agenda...)
│   └── _lib/                   ← código compartilhado (não vira endereço público)
│       ├── supabase.js         ← conexão com o Supabase
│       ├── email.js            ← envio de e-mails (Nodemailer + SMTP)
│       ├── sessao.js           ← senhas e login do painel
│       └── util.js             ← validações, cidade do visitante, anti-spam
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
2. Clique em **Add file › Upload files** e arraste **todo o conteúdo** desta pasta, mantendo as subpastas. Depois clique em **Commit changes**.
   O arquivo `.env.example` vai junto, mas não contém nenhuma senha.

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
| `URL_SITE` | `https://www.lippmannts.com` |
| `GITHUB_REPO_URL` (opcional) | endereço do repositório; cria atalhos de edição no painel |

3. Clique em **Deploy**. Em cerca de 1 minuto o site estará em `seu-projeto.vercel.app`, o **endereço de teste**.
4. Para usar o domínio: em **Settings › Domains**, adicione `www.lippmannts.com` e `lippmannts.com` e siga as instruções de DNS mostradas pela Vercel (no Registro.br ou onde o domínio estiver registrado).

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
