-- =====================================================================
-- L³ INTEGRA · estrutura do banco no Supabase
-- Como usar: Supabase > SQL Editor > New query > cole TODO este arquivo > Run.
-- Pode ser executado mais de uma vez sem apagar dados.
-- =====================================================================

-- ---------- Usuários do painel ----------
create table if not exists public.usuarios (
  id bigint generated always as identity primary key,
  usuario text unique not null,
  nome text, email text,
  perfil text not null,
  senha_hash text not null,
  ativo boolean not null default true,
  criado timestamptz not null default now(),
  ultimo_acesso timestamptz
);

-- Matriz de acessos (v6): perfil "admin" = superadministrador; "personalizado" = abas marcadas em "permissoes"
alter table public.usuarios add column if not exists permissoes jsonb not null default '[]'::jsonb;
alter table public.usuarios drop constraint if exists usuarios_perfil_check;
alter table public.usuarios add constraint usuarios_perfil_check check (perfil in ('admin','marketing','personalizado'));
update public.usuarios set perfil = 'personalizado',
  permissoes = '["visao","inteligencia","leads","newsletter","agenda","exportar"]'::jsonb
  where perfil = 'marketing';

-- ---------- Formulários do site (leads, newsletter, contatos, currículos) ----------
create table if not exists public.registros (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('lead','newsletter','contato','candidato')),
  criado timestamptz not null default now(),
  nome text, email text, telefone text, empresa text, cargo text,
  cidade text, uf text, origem text, assunto text, mensagem text,
  cargo_pretendido text, linkedin text,
  arquivo text, arquivo_nome text,          -- caminho do currículo no bucket "curriculos"
  pagina text, visitante text, sessao text, ip_hash text,
  geo_cidade text, geo_uf text, geo_pais text,
  status text not null default 'novo', notas text,
  extras jsonb
);
create index if not exists ix_registros_tipo on public.registros (tipo, criado desc);
create index if not exists ix_registros_email on public.registros (email);

-- ---------- Estatísticas de navegação ----------
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  t timestamptz not null default now(),
  tipo text not null, alvo text, pagina text,
  visitante text, sessao text, ref text, segundos int,
  dispositivo text, geo_cidade text, geo_uf text, geo_pais text
);
create index if not exists ix_eventos_t on public.eventos (t);

-- ---------- Agenda ----------
create table if not exists public.agenda (
  id bigint generated always as identity primary key,
  titulo text not null, tipo text default 'reuniao',
  inicio timestamptz not null, fim timestamptz not null,
  link text, plataforma text, participantes text, organizador text, descricao text,
  registro_id bigint references public.registros(id) on delete set null,
  uid text, sequencia int not null default 0,
  convite_enviado timestamptz, status text default 'agendado',
  criado_por text, criado timestamptz not null default now()
);

-- ---------- Materiais da Biblioteca Técnica (aba Conteúdo) ----------
create table if not exists public.materiais (
  id text primary key,
  titulo text not null,
  area text not null default 'treinamentos' check (area in ('treinamentos','solucoes')),
  tipo text, tema text, resumo text,
  arquivo text,          -- caminho no bucket "materiais" (ou endereço completo)
  youtube text, paginas int,
  ordem int not null default 100,
  ativo boolean not null default true,
  criado timestamptz not null default now()
);

-- ---------- Configurações, registros do sistema e anti-spam ----------
create table if not exists public.config (chave text primary key, valor text);
create table if not exists public.emails_log (
  id bigint generated always as identity primary key,
  t timestamptz not null default now(), para text, assunto text, ok boolean, erro text
);
create table if not exists public.acessos (
  id bigint generated always as identity primary key,
  t timestamptz not null default now(), usuario text, ip_hash text, ok boolean
);
create table if not exists public.limites (
  id bigint generated always as identity primary key,
  chave text not null, t timestamptz not null default now()
);
create index if not exists ix_limites on public.limites (chave, t);

-- ---------- Segurança: só o servidor (chave service_role) acessa as tabelas ----------
-- RLS ligado e nenhuma política = o site público e a chave "anon" não leem nada.
alter table public.usuarios   enable row level security;
alter table public.registros  enable row level security;
alter table public.eventos    enable row level security;
alter table public.agenda     enable row level security;
alter table public.materiais  enable row level security;
alter table public.config     enable row level security;
alter table public.emails_log enable row level security;
alter table public.acessos    enable row level security;
alter table public.limites    enable row level security;

-- ---------- Permissões do servidor ----------
-- Garante que a chave service_role (usada só pelas funções da Vercel) acesse tudo,
-- mesmo em projetos com "expor novas tabelas automaticamente" desligado.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- ---------- Função que entrega os eventos ao painel em formato compacto ----------
create or replace function public.l3_eventos(desde timestamptz)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_array(
    to_char(t at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI:SS'),
    tipo, coalesce(alvo,''), coalesce(pagina,''), coalesce(visitante,''), segundos,
    coalesce(geo_cidade,''), coalesce(geo_uf,''), coalesce(dispositivo,''), coalesce(ref,''), coalesce(sessao,'')
  ) order by t), '[]'::json)
  from (select * from public.eventos where t >= desde order by t limit 200000) e;
$$;
revoke all on function public.l3_eventos(timestamptz) from public, anon, authenticated;
grant execute on function public.l3_eventos(timestamptz) to service_role;

-- ---------- Armazenamento de arquivos ----------
-- curriculos: PRIVADO (só o painel abre, por link temporário)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculos', 'curriculos', false, 5242880,
        array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
-- materiais: PÚBLICO para leitura (PDFs exibidos na aba Conteúdo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', true, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- ---------- Valores iniciais ----------
insert into public.config (chave, valor) values
  ('emails_notificacao', 'atendimento@lippmannts.com, comercial@lippmannts.com, lippmannts@gmail.com'),
  ('boas_vindas_assunto', 'Bem-vindo(a) à Newsletter LIPPMANN'),
  ('boas_vindas_texto', E'Obrigado por se cadastrar na Newsletter LIPPMANN.\n\nA partir de agora você receberá conteúdos técnicos sobre Saúde, Segurança e Meio Ambiente, novidades sobre Normas Regulamentadoras e lançamentos de treinamentos e materiais.\n\nSegurança não é prioridade. Segurança é valor.')
on conflict (chave) do nothing;

insert into public.materiais (id, titulo, area, tipo, tema, resumo, arquivo, youtube, paginas, ordem) values
  ('exemplo-catalogo-treinamentos', 'Catálogo de Treinamentos (material de exemplo)', 'treinamentos', 'Apresentação', 'Portfólio',
   'Exemplo de visualização integrada: o material abre na tela, página a página, sem botão de download.', '/materiais/exemplo-catalogo-treinamentos.pdf', '', 24, 900),
  ('exemplo-catalogo-solucoes', 'Catálogo de Soluções + vídeo (material de exemplo)', 'solucoes', 'Vídeo-aula', 'SSMA',
   'Exemplo de material com vídeo do YouTube junto do PDF.', '/materiais/exemplo-catalogo-solucoes.pdf', 'EXEMPLO', 5, 901)
on conflict (id) do nothing;

-- Os usuários "admin" e "marketing" são criados automaticamente no primeiro login do painel.
-- Para REDEFINIR as senhas para as iniciais, rode só a linha abaixo (sem os dois traços):
-- delete from public.usuarios;

-- =====================================================================
-- v6 · FASE 2: HUB de publicações, catálogo de treinamentos e políticas
-- =====================================================================
create table if not exists public.conteudos_hub (
  id bigint generated always as identity primary key,
  slug text unique not null,
  tipo text not null default 'noticia' check (tipo in ('artigo','noticia','transparencia')),
  titulo text not null, resumo text, corpo_html text, capa text, youtube text,
  tags jsonb not null default '[]'::jsonb, autor text,
  publicado boolean not null default false, publicado_em timestamptz,
  criado timestamptz not null default now(), atualizado timestamptz
);
create index if not exists ix_hub_pub on public.conteudos_hub (publicado, publicado_em desc);

create table if not exists public.catalogo_treinamentos (
  id text primary key, titulo text not null, nr text, norma text,
  categoria text not null default 'normativo', resumo text,
  carga_horaria text, modalidade text, tags jsonb not null default '[]'::jsonb,
  imagem text, youtube text,
  aprender jsonb not null default '[]'::jsonb, publico jsonb not null default '[]'::jsonb, beneficios jsonb not null default '[]'::jsonb,
  prerequisito text, porque text, atestado text, extra jsonb, ficha_pdf text,
  ordem int not null default 100, ativo boolean not null default true, atualizado timestamptz
);

create table if not exists public.politicas_documentos (
  id text primary key, codigo text, revisao text, titulo text not null, resumo text,
  arquivo text, capa text, paginas int, protegido boolean not null default false, corpo_html text,
  ordem int not null default 100, ativo boolean not null default true, atualizado timestamptz
);

alter table public.conteudos_hub enable row level security;
alter table public.catalogo_treinamentos enable row level security;
alter table public.politicas_documentos enable row level security;
grant all on public.conteudos_hub, public.catalogo_treinamentos, public.politicas_documentos to service_role;
grant all on all sequences in schema public to service_role;

-- bucket público para imagens do HUB, capas e PDFs de políticas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('publico', 'publico', true, 26214400, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- publicações iniciais do HUB (não sobrescreve edições feitas no painel)
insert into public.conteudos_hub (slug,tipo,titulo,resumo,capa,tags,autor,publicado,publicado_em,corpo_html) values ($q$compromisso-social-10-por-cento$q$,$q$transparencia$q$,$q$LIPPMANN assume o compromisso de destinar 10% do lucro líquido a ações sociais$q$,$q$O Termo de Compromisso Social estabelece a provisão contínua, a prestação de contas anual no HUB e uma cláusula pétrea de governança.$q$,$q$/assets/img/fotos/capa-2.webp$q$,$q$["Compromisso Social", "Transparência"]$q$::jsonb,$q$William Lippmann$q$,true,$q$2026-11-01T12:00:00Z$q$::timestamptz,$q$<p>A LIPPMANN Treinamentos e Soluções formalizou o seu <strong>Termo de Compromisso Social</strong>: 10% do lucro líquido apurado anualmente serão destinados a entidades e projetos sociais, com prioridade para educação, conscientização em segurança e preservação da vida.</p>
<h2>Como funciona</h2>
<ul><li>O valor é provisionado ao longo de todo o exercício e acompanhado pelo painel de gestão da empresa.</li><li>A prestação de contas é publicada anualmente aqui no HUB, com o valor destinado, as entidades beneficiadas e os resultados.</li><li>O compromisso só pode ser encerrado por decisão pública de um Júri formado pelas três últimas entidades beneficiadas. Em caso de empate, prevalece a continuidade.</li></ul>
<blockquote>Segurança não é prioridade. Segurança é valor. E valor também se compartilha.</blockquote>
<p>O texto integral está disponível na página <a href="/termo-compromisso-social.html">Termo de Compromisso Social</a>.</p>$q$) on conflict (slug) do nothing;
insert into public.conteudos_hub (slug,tipo,titulo,resumo,capa,tags,autor,publicado,publicado_em,corpo_html) values ($q$boas-vindas-hub-lippmann$q$,$q$noticia$q$,$q$Conheça o HUB LIPPMANN: notícias, artigos técnicos e prestação de contas$q$,$q$Um espaço para acompanhar novidades normativas, artigos técnicos em SSMA e a transparência das ações da LIPPMANN.$q$,$q$/assets/img/fotos/capa-1.webp$q$,$q$["Institucional"]$q$::jsonb,$q$Equipe LIPPMANN$q$,true,$q$2026-10-20T12:00:00Z$q$::timestamptz,$q$<p>O HUB reúne, em um só lugar, as <strong>notícias</strong> da LIPPMANN, <strong>artigos técnicos</strong> sobre Saúde, Segurança e Meio Ambiente e a <strong>prestação de contas</strong> dos nossos compromissos sociais.</p>
<h2>O que você vai encontrar</h2>
<ul><li>Atualizações das Normas Regulamentadoras e seus impactos práticos.</li><li>Artigos técnicos escritos pela nossa equipe de instrutores e especialistas.</li><li>Agenda de turmas abertas e novidades da UniLTS.</li></ul>
<p>Para receber as novidades por e-mail, cadastre-se na newsletter no rodapé do site.</p>$q$) on conflict (slug) do nothing;

-- catálogo inicial: os 19 treinamentos do LTS-CAT-001 (não sobrescreve edições feitas no painel)
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$assedio$q$,$q$Prevenção e Combate ao Assédio no Ambiente de Trabalho$q$,null,null,$q$desenvolvimento$q$,$q$Promovendo ambientes de trabalho respeitosos, inclusivos e seguros por meio da conscientização, prevenção e combate ao assédio.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$[]$q$::jsonb,$q$/assets/img/treinamentos/assedio.webp$q$,$q$["Conceitos de assédio moral e assédio sexual","Diferença entre gestão, cobrança de resultados e assédio","Comportamentos inadequados no ambiente de trabalho","Identificação de situações de assédio","Impactos do assédio para trabalhadores e organizações","Responsabilidades de empregados e empregadores","Comunicação respeitosa e relações interpessoais saudáveis","Diversidade, inclusão e respeito às diferenças","Procedimentos de acolhimento e denúncia","Consequências legais e disciplinares","Papel das lideranças na prevenção do assédio","Construção de ambientes psicologicamente seguros"]$q$::jsonb,$q$["Trabalhadores de todos os níveis hierárquicos","Lideranças e gestores","Supervisores e coordenadores","Integrantes da CIPA","Profissionais de Recursos Humanos","Técnicos e Engenheiros de Segurança do Trabalho","Integrantes do SESMT","Empresas que desejam fortalecer a cultura de respeito e integridade"]$q$::jsonb,$q$["Fortalecimento da cultura de respeito e integridade","Redução de conflitos interpessoais","Maior conscientização sobre condutas inadequadas","Desenvolvimento de lideranças mais preparadas","Promoção da saúde mental e do bem-estar organizacional","Redução de riscos trabalhistas e reputacionais","Fortalecimento da confiança e do engajamento das equipes","Contribuição para ambientes de trabalho mais seguros e inclusivos"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Mais do que atender às exigências legais e às melhores práticas de governança corporativa, o treinamento contribui para o fortalecimento de uma cultura organizacional baseada no respeito às pessoas, na valorização da diversidade e na promoção de ambientes de trabalho saudáveis.$q$,null,null,$q$/downloads/fichas/assedio.pdf$q$,10) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$liderancas$q$,$q$Desenvolvimento de Lideranças em Segurança$q$,null,null,$q$desenvolvimento$q$,$q$Desenvolvendo líderes capazes de influenciar comportamentos, fortalecer a cultura de segurança e inspirar equipes a trabalharem com segurança como valor.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$[]$q$::jsonb,$q$/assets/img/treinamentos/liderancas.webp$q$,$q$["O papel da liderança na Cultura de Segurança","Segurança como valor organizacional","Liderança pelo exemplo","Comunicação eficaz em Saúde e Segurança do Trabalho","Engajamento e influência positiva das equipes","Gestão de comportamentos seguros","Percepção e gerenciamento de riscos","Desenvolvimento da responsabilidade individual e coletiva","Tomada de decisão em situações de risco","Gestão de conflitos relacionados à segurança","Ferramentas para fortalecimento da Cultura de Segurança","Indicadores comportamentais e de desempenho em segurança","Estratégias para construção de ambientes de trabalho mais seguros"]$q$::jsonb,$q$["Diretores","Gerentes","Coordenadores","Supervisores","Encarregados","Líderes de equipe","Técnicos e Engenheiros de Segurança do Trabalho","Integrantes do SESMT","Profissionais que exercem funções de liderança formal ou informal"]$q$::jsonb,$q$["Fortalecimento da Cultura de Segurança","Maior engajamento das lideranças nas ações preventivas","Redução de comportamentos de risco","Melhoria da comunicação entre líderes e equipes","Desenvolvimento de líderes mais preparados para a gestão de pessoas e riscos","Aumento da participação dos colaboradores nas iniciativas de segurança","Contribuição para a redução de acidentes e incidentes","Alinhamento entre segurança, produtividade e resultados organizacionais"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Por meio de metodologias ativas, estudos de caso e reflexões práticas, os participantes desenvolvem competências para influenciar pessoas, promover o engajamento das equipes e fortalecer o compromisso coletivo com a preservação da vida.$q$,null,null,$q$/downloads/fichas/liderancas.pdf$q$,20) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$integracao-ssma$q$,$q$Integração de Saúde, Segurança e Meio Ambiente (SSMA)$q$,$q$NR 01$q$,$q$NR 01 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais (GRO)$q$,$q$normativo$q$,$q$Integrando pessoas, fortalecendo a Cultura de Segurança e promovendo ambientes de trabalho mais seguros, saudáveis e sustentáveis.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 01"]$q$::jsonb,$q$/assets/img/treinamentos/integracao-ssma.webp$q$,$q$["Conceitos fundamentais de Saúde, Segurança e Meio Ambiente (SSMA)","Direitos e deveres dos trabalhadores e empregadores","Política e diretrizes de SSMA da organização","Conceitos de perigo, risco e medidas de controle","Gerenciamento de Riscos Ocupacionais (GRO)","Programa de Gerenciamento de Riscos (PGR)","Procedimentos de segurança aplicáveis às atividades","Regras de ouro e requisitos internos da empresa","Utilização adequada de Equipamentos de Proteção Individual (EPIs)","Comunicação de perigos, incidentes e desvios","Procedimentos de emergência e abandono de área","Responsabilidade ambiental e boas práticas sustentáveis","Cultura de Segurança e comportamento seguro"]$q$::jsonb,$q$["Novos colaboradores","Trabalhadores terceiros e prestadores de serviços","Estagiários e aprendizes","Transferidos entre unidades ou setores","Profissionais que necessitem de reciclagem ou atualização em SSMA"]$q$::jsonb,$q$["Integração padronizada dos colaboradores","Redução de comportamentos inseguros","Maior conscientização sobre riscos ocupacionais","Fortalecimento da Cultura de Segurança","Melhoria do cumprimento das normas internas e requisitos legais","Redução da probabilidade de acidentes e incidentes","Maior engajamento dos trabalhadores com as práticas de SSMA"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Mais do que uma etapa de admissão ou integração, este treinamento representa o primeiro contato do colaborador com a Cultura de Segurança da organização, contribuindo para o desenvolvimento de comportamentos seguros e para a construção de ambientes de trabalho mais conscientes e preventivos.$q$,null,null,$q$/downloads/fichas/integracao-ssma.pdf$q$,30) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$gestao-ssma-indicadores$q$,$q$Gestão de SSMA e Indicadores de Monitoramento$q$,$q$NR 04$q$,$q$NR 04 – Serviços Especializados em Segurança e em Medicina do Trabalho (SESMT)$q$,$q$desenvolvimento$q$,$q$Desenvolvendo líderes capazes de transformar dados em decisões e fortalecer a Cultura de Segurança nas organizações.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 04"]$q$::jsonb,$q$/assets/img/treinamentos/gestao-ssma-indicadores.webp$q$,$q$["Conceitos fundamentais de Gestão de SSMA","Estruturação de indicadores de desempenho (KPIs)","Indicadores reativos e proativos de segurança","Monitoramento e análise crítica de resultados","Elaboração de dashboards e relatórios gerenciais","Definição de metas e planos de ação","Ferramentas para investigação e tratamento de desvios","Gestão baseada em riscos e desempenho","Comunicação eficaz de indicadores para lideranças","Fortalecimento da Cultura de Segurança por meio da gestão de resultados"]$q$::jsonb,$q$["Técnicos de Segurança do Trabalho","Engenheiros de Segurança","Coordenadores e Supervisores de SSMA","Integrantes do SESMT","Gestores Operacionais","Líderes de Produção","Profissionais responsáveis por indicadores e sistemas de gestão","Profissionais que desejam aprimorar suas competências em gestão de desempenho"]$q$::jsonb,$q$["Maior controle sobre os indicadores de SSMA","Melhoria da tomada de decisão baseada em dados","Fortalecimento da cultura preventiva","Redução de desvios e acidentes","Aumento da maturidade do sistema de gestão","Melhor acompanhamento de metas e planos de ação","Engajamento das lideranças na gestão da segurança"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Mais do que monitorar números, o treinamento demonstra como transformar informações em ações que promovam ambientes mais seguros, saudáveis, sustentáveis e produtivos.$q$,null,null,$q$/downloads/fichas/gestao-ssma-indicadores.pdf$q$,40) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr05-cipa$q$,$q$NR 05 – Comissão Interna de Prevenção de Acidentes e de Assédio (CIPA)$q$,$q$NR 05$q$,null,$q$normativo$q$,$q$Formação de membros da CIPA para promover ambientes de trabalho mais seguros, saudáveis e respeitosos.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 05"]$q$::jsonb,$q$/assets/img/treinamentos/nr05-cipa.webp$q$,$q$["Identificar perigos e riscos presentes no ambiente de trabalho","Contribuir para a prevenção de acidentes e doenças ocupacionais","Participar de investigações e análises de ocorrências","Apoiar ações de conscientização em saúde e segurança","Compreender o papel e as responsabilidades da CIPA","Promover a prevenção e o combate ao assédio e à violência no trabalho","Atuar como agente de fortalecimento da Cultura de Segurança na organização"]$q$::jsonb,$q$["Membros titulares e suplentes da CIPA","Colaboradores designados para cumprimento da NR 05","Gestores, líderes e supervisores","Profissionais de Saúde e Segurança do Trabalho","Empresas que desejam fortalecer sua cultura preventiva e o engajamento dos trabalhadores"]$q$::jsonb,$q$[]$q$::jsonb,$q$Ser integrante da CIPA (eleito ou designado).$q$,$q$Uma CIPA bem capacitada contribui diretamente para a redução de acidentes, o fortalecimento da cultura organizacional, o aumento do engajamento dos trabalhadores e a promoção de ambientes mais seguros, saudáveis e produtivos. Quando seus membros compreendem seu papel e atuam de forma preventiva, a segurança deixa de ser apenas uma obrigação legal e passa a fazer parte dos valores da organização.$q$,null,null,$q$/downloads/fichas/nr05-cipa.pdf$q$,50) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr06-epi$q$,$q$NR 06 – Equipamentos de Proteção Individual (EPI)$q$,$q$NR 06$q$,null,$q$normativo$q$,$q$Promovendo o uso consciente dos Equipamentos de Proteção Individual para fortalecer a segurança e preservar vidas.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 06"]$q$::jsonb,$q$/assets/img/treinamentos/nr06-epi.webp$q$,$q$["Conceitos e fundamentos da NR 06","Responsabilidades do empregador e dos trabalhadores","Critérios para seleção adequada dos EPIs","Certificado de Aprovação (CA) e sua importância","Limitações dos Equipamentos de Proteção Individual","Inspeção, higienização, conservação e armazenamento dos EPIs","Utilização correta dos equipamentos conforme os riscos ocupacionais","Consequências do uso inadequado ou da não utilização dos EPIs","Boas práticas para fortalecimento da cultura de prevenção"]$q$::jsonb,$q$["Trabalhadores de todos os segmentos industriais","Operadores de máquinas e equipamentos","Técnicos e auxiliares de manutenção","Profissionais da construção civil","Integrantes do SESMT","Membros da CIPA","Supervisores, encarregados e lideranças operacionais","Empresas que desejam fortalecer a conscientização sobre segurança do trabalho"]$q$::jsonb,$q$["Maior conscientização dos trabalhadores sobre os riscos ocupacionais","Uso correto e conservação adequada dos EPIs","Redução da exposição a riscos e incidentes","Fortalecimento da Cultura de Segurança","Melhoria da conformidade legal","Aumento do engajamento dos colaboradores nas ações de prevenção"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Por meio de uma abordagem prática e participativa, os participantes desenvolvem conhecimentos e habilidades essenciais para utilizar os EPIs de forma adequada, contribuindo para ambientes de trabalho mais seguros e saudáveis.$q$,null,null,$q$/downloads/fichas/nr06-epi.pdf$q$,60) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr10-basico$q$,$q$Curso Básico$q$,$q$NR 10$q$,$q$NR 10 – Segurança em Instalações e Serviços em Eletricidade$q$,$q$normativo$q$,$q$Capacitando profissionais para atuar com segurança em instalações e serviços com eletricidade.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 10"]$q$::jsonb,$q$/assets/img/treinamentos/nr10-basico.webp$q$,$q$["Conceitos básicos de eletricidade","Riscos em instalações e serviços com eletricidade","Medidas de controle do risco elétrico","Normas técnicas e regulamentações aplicáveis","Equipamentos de proteção coletiva e individual","Procedimentos de trabalho seguro","Análise de risco e permissões de trabalho","Acidentes de origem elétrica e medidas preventivas","Noções de combate a incêndio e primeiros socorros relacionados à eletricidade","Responsabilidades dos profissionais envolvidos"]$q$::jsonb,$q$["Eletricistas","Técnicos de manutenção","Mecânicos que atuam próximos a instalações elétricas","Operadores de máquinas e equipamentos","Supervisores e líderes de manutenção","Profissionais que interagem com instalações elétricas em suas atividades"]$q$::jsonb,$q$["Redução da exposição aos riscos elétricos","Fortalecimento da cultura preventiva","Atendimento aos requisitos legais","Maior segurança nas atividades de manutenção e operação","Desenvolvimento da percepção de riscos dos trabalhadores"]$q$::jsonb,$q$Sem exigência de capacitação anterior. ASO apto para a função.$q$,$q$Mais do que atender às exigências legais, a capacitação contribui para o fortalecimento da Cultura de Segurança, incentivando práticas seguras e a prevenção de acidentes graves e fatais.$q$,null,null,$q$/downloads/fichas/nr10-basico.pdf$q$,70) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr10-sep$q$,$q$Sistema Elétrico de Potência (SEP)$q$,$q$NR 10$q$,$q$NR 10 – Segurança em Instalações e Serviços em Eletricidade$q$,$q$normativo$q$,$q$Preparando profissionais para atuar com segurança em atividades envolvendo o Sistema Elétrico de Potência e suas proximidades.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 10"]$q$::jsonb,$q$/assets/img/treinamentos/nr10-sep.webp$q$,$q$["Características do Sistema Elétrico de Potência (SEP)","Organização do trabalho em atividades com SEP","Análise de risco e planejamento das atividades","Técnicas de trabalho sob tensão e desenergizado","Procedimentos de liberação e bloqueio de energia","Sistemas de proteção coletiva e individual","Documentação e responsabilidades técnicas","Gestão de emergências em atividades com SEP","Estudos de casos e análise de acidentes","Procedimentos para atuação em áreas de risco elétrico"]$q$::jsonb,$q$["Eletricistas de potência","Técnicos e engenheiros eletricistas","Profissionais de concessionárias de energia","Equipes de geração, transmissão e distribuição de energia","Supervisores e gestores de manutenção elétrica","Profissionais autorizados para atividades em SEP"]$q$::jsonb,$q$["Maior controle dos riscos elétricos em atividades críticas","Atendimento aos requisitos da NR 10","Fortalecimento da gestão de riscos operacionais","Redução da probabilidade de acidentes graves","Desenvolvimento de profissionais mais preparados para atuação em SEP"]$q$::jsonb,$q$Possuir capacitação válida em NR 10 – Curso Básico.$q$,$q$O treinamento visa desenvolver competências para atuação segura em ambientes de elevado potencial de risco, fortalecendo a prevenção de acidentes e a preservação da vida.$q$,null,null,$q$/downloads/fichas/nr10-sep.pdf$q$,80) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr11-movimentacao-cargas$q$,$q$Operação Segura de Equipamentos de Movimentação de Cargas$q$,$q$NR 11$q$,$q$NR 11 – Transporte, Movimentação, Armazenagem e Manuseio de Materiais$q$,$q$normativo$q$,$q$Capacitando operadores para atuar com segurança, eficiência e responsabilidade na movimentação de materiais.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 11"]$q$::jsonb,$q$/assets/img/treinamentos/nr11-movimentacao-cargas.webp$q$,$q$["Conceitos e requisitos aplicáveis à NR 11","Princípios de movimentação e armazenagem de materiais","Identificação de perigos e avaliação de riscos operacionais","Inspeção pré-operacional dos equipamentos","Limites operacionais e capacidade de carga","Estabilidade, equilíbrio e centro de gravidade","Técnicas seguras de movimentação de materiais","Regras de circulação e operação","Sinalização de segurança e comunicação operacional","Procedimentos em situações de emergência","Responsabilidades do operador","Boas práticas para prevenção de acidentes"]$q$::jsonb,$q$["Operadores de empilhadeiras","Operadores de ponte rolante","Operadores de talhas e pórticos","Profissionais da logística e armazenagem","Almoxarifes","Conferentes","Supervisores e líderes operacionais","Trabalhadores envolvidos em atividades de movimentação de materiais"]$q$::jsonb,$q$["Redução de acidentes e incidentes operacionais","Maior segurança nas operações de movimentação de cargas","Redução de danos a materiais, equipamentos e estruturas","Aumento da eficiência operacional","Fortalecimento da Cultura de Segurança","Atendimento aos requisitos legais e normativos aplicáveis"]$q$::jsonb,$q$ASO apto para a função. Idade mínima de 18 anos.$q$,$q$Mais do que habilitar operadores, o treinamento contribui para o fortalecimento da Cultura de Segurança, reduzindo a ocorrência de incidentes e aumentando a eficiência das operações logísticas e industriais.$q$,null,$q${"titulo":"Equipamentos abrangidos","intro":"A capacitação pode ser customizada de acordo com os equipamentos utilizados pela organização, incluindo, mas não se limitando a:","grupos":[{"nome":"Equipamentos de Movimentação e Armazenagem","itens":["Empilhadeira a Gás (GLP)","Empilhadeira Elétrica","Empilhadeira Retrátil","Empilhadeira Retrátil Lateral","Empilhadeira Patolada","Empilhadeira Selecionadora de Pedidos","Empilhadeira Trilateral","Transpaleteira Elétrica","Rebocadores Elétricos","Paleteiras Motorizadas"]},{"nome":"Equipamentos de Elevação de Cargas","itens":["Ponte Rolante","Pórtico Rolante","Semipórtico","Talha Elétrica","Talha Manual","Monovia","Guindaste","Munck (Guindauto)","Plataformas de Movimentação de Materiais"]},{"nome":"Outros Equipamentos","itens":["Equipamentos especiais de movimentação de cargas","Sistemas automatizados de armazenagem","Equipamentos customizados utilizados em operações industriais e logísticas"]}]}$q$::jsonb,$q$/downloads/fichas/nr11-movimentacao-cargas.pdf$q$,90) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr12-maquinas$q$,$q$NR 12 – Segurança no Trabalho em Máquinas e Equipamentos$q$,$q$NR 12$q$,null,$q$normativo$q$,$q$Desenvolvendo profissionais capacitados para atuar com segurança na operação, inspeção, manutenção e intervenção em máquinas e equipamentos.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 12"]$q$::jsonb,$q$/assets/img/treinamentos/nr12-maquinas.webp$q$,$q$["Fundamentos e requisitos da NR 12","Identificação de perigos e avaliação de riscos em máquinas e equipamentos","Sistemas e dispositivos de segurança","Medidas de proteção coletiva e individual","Procedimentos seguros para operação e intervenção","Conceitos de bloqueio e controle de energias perigosas","Responsabilidades dos trabalhadores e empregadores","Inspeção e verificação de condições seguras de operação","Procedimentos para prevenção de acidentes","Boas práticas de segurança em atividades envolvendo máquinas e equipamentos"]$q$::jsonb,$q$["Operadores de máquinas e equipamentos","Mecânicos de manutenção","Eletricistas industriais","Técnicos de manutenção","Supervisores e líderes de produção","Profissionais do SESMT","Integrantes da CIPA","Trabalhadores que realizam atividades de operação, inspeção, ajuste, limpeza ou manutenção em máquinas e equipamentos"]$q$::jsonb,$q$["Redução de acidentes envolvendo máquinas e equipamentos","Fortalecimento da Cultura de Segurança","Melhoria da percepção de riscos dos trabalhadores","Maior conformidade com os requisitos legais","Aumento da segurança operacional","Redução de perdas relacionadas a incidentes e interrupções de processos","Maior engajamento dos colaboradores com as práticas de prevenção"]$q$::jsonb,$q$ASO apto para a função de operação ou intervenção.$q$,$q$Mais do que atender aos requisitos legais, o treinamento busca desenvolver a percepção de riscos e a consciência preventiva dos participantes, tornando-os agentes ativos na promoção de ambientes de trabalho mais seguros e produtivos.$q$,null,null,$q$/downloads/fichas/nr12-maquinas.pdf$q$,100) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr13-caldeiras$q$,$q$Segurança na Operação de Caldeiras$q$,$q$NR 13$q$,$q$NR 13 – Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento$q$,$q$normativo$q$,$q$Capacitando operadores para atuar com segurança, responsabilidade e eficiência na operação de caldeiras.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 13"]$q$::jsonb,$q$/assets/img/treinamentos/nr13-caldeiras.webp$q$,$q$["Fundamentos da NR 13","Princípios de funcionamento das caldeiras","Tipos e aplicações de caldeiras","Riscos associados à operação","Dispositivos de segurança e controle","Procedimentos operacionais seguros","Inspeções e verificações operacionais","Situações de emergência e respostas adequadas","Responsabilidades dos operadores","Boas práticas para prevenção de acidentes"]$q$::jsonb,$q$["Operadores de caldeiras","Profissionais em processo de qualificação para operação","Supervisores e líderes operacionais","Técnicos de manutenção","Profissionais envolvidos na operação e gestão de utilidades industriais"]$q$::jsonb,$q$["Maior segurança na operação de caldeiras","Redução de riscos operacionais","Atendimento aos requisitos legais","Fortalecimento da cultura de prevenção","Desenvolvimento de operadores mais preparados e conscientes"]$q$::jsonb,$q$ASO apto para a função. Estágio prático supervisionado, conforme a NR 13 vigente.$q$,$q$Mais do que atender aos requisitos normativos, o treinamento busca fortalecer a cultura preventiva e a responsabilidade operacional dos profissionais envolvidos.$q$,null,null,$q$/downloads/fichas/nr13-caldeiras.pdf$q$,110) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr13-unidades-processo$q$,$q$Operação de Unidades de Processo$q$,$q$NR 13$q$,$q$NR 13 – Caldeiras, Vasos de Pressão, Tubulações e Tanques Metálicos de Armazenamento$q$,$q$normativo$q$,$q$Desenvolvendo profissionais preparados para atuar com segurança em processos industriais que envolvem equipamentos abrangidos pela NR 13.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 13"]$q$::jsonb,$q$/assets/img/treinamentos/nr13-unidades-processo.webp$q$,$q$["Fundamentos da NR 13","Conceitos básicos de processos industriais","Funcionamento de unidades de processo","Riscos operacionais e medidas de controle","Vasos de pressão, tubulações e sistemas auxiliares","Instrumentação e controles operacionais","Procedimentos operacionais seguros","Identificação e tratamento de desvios","Situações de emergência e resposta a incidentes","Boas práticas de segurança operacional"]$q$::jsonb,$q$["Operadores de processo","Operadores de utilidades","Operadores de produção","Profissionais de indústrias químicas, petroquímicas, alimentícias, farmacêuticas e demais segmentos industriais","Supervisores e líderes operacionais","Profissionais envolvidos na gestão e operação de sistemas abrangidos pela NR 13"]$q$::jsonb,$q$["Maior segurança operacional","Redução da probabilidade de falhas e incidentes","Desenvolvimento de operadores mais qualificados","Fortalecimento da cultura de prevenção","Atendimento aos requisitos da NR 13","Melhoria da confiabilidade operacional dos processos"]$q$::jsonb,$q$ASO apto para a função. Estágio prático supervisionado, conforme a NR 13 vigente.$q$,$q$Por meio de uma abordagem prática e aplicada à realidade industrial, o treinamento contribui para o desenvolvimento de operadores mais preparados, conscientes e comprometidos com a segurança operacional.$q$,null,null,$q$/downloads/fichas/nr13-unidades-processo.pdf$q$,120) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr17-ergonomia$q$,$q$Ergonomia e Qualidade de Vida no Trabalho$q$,$q$NR 17$q$,$q$NR 17 – Ergonomia$q$,$q$normativo$q$,$q$Promovendo saúde, bem-estar e desempenho por meio da adaptação do trabalho às características e necessidades das pessoas.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 17"]$q$::jsonb,$q$/assets/img/treinamentos/nr17-ergonomia.webp$q$,$q$["Fundamentos e princípios da ergonomia","Conceitos de adaptação do trabalho ao ser humano","Fatores de risco ergonômicos","Posturas adequadas durante a execução das atividades","Movimentos repetitivos e esforços físicos","Organização do trabalho e seus impactos na saúde","Ergonomia em atividades administrativas e operacionais","Prevenção de lesões musculoesqueléticas","Hábitos saudáveis no ambiente de trabalho","Boas práticas para promoção da saúde e bem-estar"]$q$::jsonb,$q$["Trabalhadores de áreas operacionais","Profissionais administrativos","Líderes e supervisores","Profissionais de Recursos Humanos","Técnicos e Engenheiros de Segurança do Trabalho","Integrantes do SESMT","Membros da CIPA","Empresas que desejam fortalecer ações de saúde e qualidade de vida no trabalho"]$q$::jsonb,$q$["Redução de desconfortos e queixas relacionadas ao trabalho","Conscientização sobre práticas ergonômicas adequadas","Fortalecimento das ações de saúde ocupacional","Contribuição para a prevenção de lesões e afastamentos","Melhoria da qualidade de vida dos colaboradores","Aumento do engajamento e da produtividade","Fortalecimento da cultura de cuidado com as pessoas"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Mais do que atender aos requisitos legais, o treinamento busca desenvolver a percepção dos participantes sobre a importância da ergonomia como ferramenta estratégica para o bem-estar das pessoas, a eficiência operacional e a sustentabilidade das organizações.$q$,null,null,$q$/downloads/fichas/nr17-ergonomia.pdf$q$,130) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr18-construcao$q$,$q$NR 18 – Segurança e Saúde no Trabalho na Indústria da Construção$q$,$q$NR 18$q$,null,$q$normativo$q$,$q$Capacitando profissionais para atuar com segurança, responsabilidade e conformidade nos ambientes da construção civil.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 18"]$q$::jsonb,$q$/assets/img/treinamentos/nr18-construcao.webp$q$,$q$["Fundamentos da NR 18","Identificação de perigos e avaliação de riscos","Medidas de prevenção em atividades da construção civil","Organização e segurança em canteiros de obras","Uso adequado de Equipamentos de Proteção Individual e Coletiva","Procedimentos seguros para atividades operacionais","Responsabilidades dos trabalhadores e lideranças","Comunicação de riscos e prevenção de acidentes","Boas práticas de saúde, segurança e meio ambiente","Cultura de Segurança aplicada à construção civil"]$q$::jsonb,$q$["Trabalhadores da construção civil","Operadores de equipamentos","Montadores","Instaladores","Técnicos e encarregados de obras","Supervisores e gestores","Empresas prestadoras de serviços","Profissionais que atuam em atividades relacionadas à construção, montagem e manutenção"]$q$::jsonb,$q$["Redução de acidentes e incidentes em obras","Maior conscientização dos trabalhadores sobre os riscos ocupacionais","Atendimento aos requisitos legais","Aumento da segurança operacional","Fortalecimento da Cultura de Segurança","Desenvolvimento de profissionais mais preparados e produtivos"]$q$::jsonb,$q$Básico: sem pré-requisito. PEMT: ASO apto, capacitação em trabalho em altura (NR 35) e idade mínima de 18 anos.$q$,$q$Por meio de metodologias dinâmicas e alinhadas à realidade operacional, os participantes desenvolvem conhecimentos técnicos e comportamentais essenciais para atuar com segurança, eficiência e responsabilidade.$q$,null,$q${"titulo":"Cursos disponíveis","intro":"A LIPPMANN Treinamentos e Soluções oferece capacitações voltadas às diversas atividades da construção civil, incluindo:","cursos":[["Básico em Segurança do Trabalho na Construção Civil","Capacitação introdutória para trabalhadores da construção civil, abordando os principais riscos ocupacionais, medidas preventivas e requisitos de segurança aplicáveis aos canteiros de obras."],["Operador de Plataforma Elevatória Móvel de Trabalho (PEMT) – Tipo Pantográfica (Tesoura)","Capacitação para operação segura de plataformas elevatórias do tipo tesoura, contemplando inspeção, operação, análise de riscos e procedimentos de emergência."],["Operador de Plataforma Elevatória Móvel de Trabalho (PEMT) – Tipo Articulada","Treinamento destinado aos profissionais responsáveis pela operação de plataformas articuladas, com foco na prevenção de acidentes e utilização segura do equipamento."],["Operador de Plataforma Elevatória Móvel de Trabalho (PEMT) – Tipo Unipessoal","Capacitação para operadores de plataformas elevatórias unipessoais, abordando procedimentos operacionais, inspeções e medidas de segurança aplicáveis."],["Outros Treinamentos Disponíveis","Além dos cursos acima, a LIPPMANN pode desenvolver treinamentos personalizados para atividades específicas da construção civil, conforme os equipamentos, processos e riscos presentes na organização."]]}$q$::jsonb,$q$/downloads/fichas/nr18-construcao.pdf$q$,140) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr20-inflamaveis$q$,$q$NR 20 – Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis$q$,$q$NR 20$q$,null,$q$normativo$q$,$q$Capacitando profissionais para atuar com segurança em atividades que envolvem inflamáveis e combustíveis, preservando vidas, instalações e o meio ambiente.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 20"]$q$::jsonb,$q$/assets/img/treinamentos/nr20-inflamaveis.webp$q$,$q$["Conceitos fundamentais sobre inflamáveis e combustíveis","Identificação de perigos e avaliação de riscos","Medidas de prevenção e controle","Sistemas de proteção contra incêndios e explosões","Procedimentos operacionais seguros","Controle de fontes de ignição","Planos de resposta a emergências","Responsabilidades dos trabalhadores e empregadores","Boas práticas de segurança operacional","Cultura de prevenção e percepção de riscos"]$q$::jsonb,$q$["Operadores de produção","Operadores de utilidades","Trabalhadores de áreas operacionais","Técnicos e supervisores","Integrantes do SESMT","Equipes de manutenção","Líderes operacionais","Profissionais que atuam em instalações com inflamáveis e combustíveis"]$q$::jsonb,$q$["Maior controle dos riscos envolvendo inflamáveis e combustíveis","Redução da probabilidade de incêndios e explosões","Fortalecimento da cultura preventiva","Atendimento aos requisitos legais da NR 20","Desenvolvimento de profissionais mais preparados e conscientes","Melhoria da segurança operacional e da gestão de emergências"]$q$::jsonb,$q$Definido pela classe da instalação (I, II ou III) e pela função do trabalhador, conforme a NR 20 vigente.$q$,$q$Mais do que atender aos requisitos legais, o treinamento fortalece a Cultura de Segurança e o compromisso das organizações com a gestão de riscos e a preservação da vida.$q$,null,$q${"titulo":"Cursos disponíveis","intro":"A LIPPMANN Treinamentos e Soluções oferece todas as capacitações previstas pela NR 20, de acordo com a classificação das instalações e das atividades desenvolvidas pela organização.","cursos":[["Curso de Iniciação sobre Inflamáveis e Combustíveis","Capacitação destinada aos trabalhadores que adentram áreas classificadas ou mantêm contato indireto com instalações que contenham inflamáveis e combustíveis, proporcionando conhecimentos básicos sobre riscos e medidas preventivas."],["Curso Básico","Destinado aos profissionais que realizam atividades específicas em instalações classificadas e que necessitam compreender os riscos envolvidos, os controles operacionais e os procedimentos de segurança aplicáveis."],["Curso Intermediário","Capacitação voltada para trabalhadores que atuam diretamente em instalações com inflamáveis e combustíveis, desenvolvendo competências para identificação de riscos, prevenção de acidentes e atuação segura nas operações."],["Curso Avançado I","Treinamento destinado aos profissionais que desempenham atividades operacionais em instalações com maior complexidade e potencial de risco, abordando medidas avançadas de prevenção, controle e resposta a emergências."],["Curso Avançado II","Capacitação para profissionais que atuam em instalações de elevada complexidade operacional, desenvolvendo conhecimentos aprofundados sobre gerenciamento de riscos, prevenção de acidentes ampliados e atuação em situações críticas."],["Curso Específico","Treinamento direcionado aos profissionais envolvidos em atividades e operações especiais previstas na NR 20, com conteúdo adaptado às características dos processos, instalações e riscos da organização."]]}$q$::jsonb,$q$/downloads/fichas/nr20-inflamaveis.pdf$q$,150) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr26-sinalizacao$q$,$q$NR 26 – Sinalização de Segurança$q$,$q$NR 26$q$,null,$q$normativo$q$,$q$Promovendo ambientes de trabalho mais seguros por meio da identificação, comunicação e prevenção de riscos.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 26"]$q$::jsonb,$q$/assets/img/treinamentos/nr26-sinalizacao.webp$q$,$q$["Fundamentos da NR 26 – Sinalização de Segurança","Objetivos e importância da sinalização de segurança","Identificação e comunicação de perigos e riscos","Significado das cores de segurança","Sinalização de advertência, obrigação, proibição e emergência","Rotas de fuga e sinalização de emergência","Identificação de tubulações industriais","Classificação e rotulagem de produtos químicos","Sistema Globalmente Harmonizado (GHS)","Fichas com Dados de Segurança (FDS)","Boas práticas para comunicação visual de segurança"]$q$::jsonb,$q$["Trabalhadores de áreas operacionais","Profissionais administrativos","Técnicos e Engenheiros de Segurança do Trabalho","Integrantes do SESMT","Membros da CIPA","Supervisores e líderes de equipe","Profissionais envolvidos na gestão de produtos químicos","Empresas que desejam fortalecer a comunicação de segurança"]$q$::jsonb,$q$["Melhoria da comunicação dos riscos ocupacionais","Fortalecimento da percepção de riscos pelos trabalhadores","Maior conformidade com os requisitos legais","Redução da probabilidade de acidentes decorrentes de falhas de comunicação","Melhor identificação de produtos químicos e áreas de risco","Fortalecimento da Cultura de Segurança","Aumento do engajamento dos colaboradores nas ações preventivas"]$q$::jsonb,$q$Sem pré-requisito normativo.$q$,$q$Mais do que atender aos requisitos legais, o treinamento contribui para fortalecer a Cultura de Segurança, melhorando a percepção de riscos e promovendo comportamentos mais seguros no ambiente de trabalho.$q$,null,null,$q$/downloads/fichas/nr26-sinalizacao.pdf$q$,160) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr33-espacos-confinados$q$,$q$NR 33 – Segurança e Saúde nos Trabalhos em Espaços Confinados$q$,$q$NR 33$q$,null,$q$normativo$q$,$q$Capacitando profissionais para identificar riscos, prevenir acidentes e atuar com segurança em atividades realizadas em espaços confinados.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 33"]$q$::jsonb,$q$/assets/img/treinamentos/nr33-espacos-confinados.webp$q$,$q$["Conceitos e definições de espaço confinado","Identificação de perigos e avaliação de riscos","Reconhecimento de atmosferas perigosas","Monitoramento atmosférico","Medidas de controle e prevenção","Permissão de Entrada e Trabalho (PET)","Equipamentos de proteção coletiva e individual","Procedimentos de emergência e resgate","Responsabilidades dos profissionais envolvidos","Boas práticas para trabalhos seguros em espaços confinados"]$q$::jsonb,$q$["Trabalhadores autorizados","Vigias de espaço confinado","Supervisores de espaço confinado","Técnicos de Segurança do Trabalho","Profissionais do SESMT","Equipes de manutenção","Operadores industriais","Supervisores e líderes operacionais","Empresas que realizam atividades em ambientes classificados como espaços confinados"]$q$::jsonb,$q$["Redução dos riscos associados aos trabalhos em espaços confinados","Maior controle operacional das atividades críticas","Atendimento aos requisitos legais da NR 33","Desenvolvimento de profissionais mais preparados e conscientes","Fortalecimento da Cultura de Segurança","Melhoria da gestão de emergências e resgates","Aumento da confiabilidade operacional das atividades"]$q$::jsonb,$q$ASO apto para trabalho em espaço confinado, conforme a NR 33 vigente.$q$,$q$Por meio de metodologias ativas e treinamentos teóricos e práticos, os participantes aprendem a atuar de forma segura, responsável e alinhada aos requisitos legais vigentes.$q$,null,$q${"titulo":"Cursos disponíveis","intro":"A LIPPMANN Treinamentos e Soluções oferece capacitações para os profissionais previstos na NR 33, atendendo às diferentes responsabilidades dentro das atividades em espaços confinados.","cursos":[["Vigia e Trabalhador Autorizado","Capacitação destinada aos profissionais responsáveis pela execução das atividades em espaços confinados e aos vigias encarregados do monitoramento externo das operações. O treinamento desenvolve competências para identificação dos riscos, aplicação dos procedimentos de segurança, utilização adequada dos equipamentos de proteção e atuação em situações de emergência."],["Supervisor de Espaços Confinados","Capacitação voltada aos profissionais responsáveis pelo planejamento, autorização, acompanhamento e supervisão das atividades realizadas em espaços confinados. O treinamento aborda aspectos relacionados à gestão dos riscos, emissão da Permissão de Entrada e Trabalho (PET), análise das condições de segurança e coordenação das medidas preventivas necessárias para a execução segura das atividades."]]}$q$::jsonb,$q$/downloads/fichas/nr33-espacos-confinados.pdf$q$,170) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$nr35-trabalho-altura$q$,$q$NR 35 – Trabalho em Altura$q$,$q$NR 35$q$,null,$q$normativo$q$,$q$Capacitando profissionais para atuar com segurança, planejamento e responsabilidade em atividades realizadas acima de dois metros de altura.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$["NR 35"]$q$::jsonb,$q$/assets/img/treinamentos/nr35-trabalho-altura.webp$q$,$q$["Fundamentos e requisitos da NR 35","Conceitos de trabalho em altura","Identificação de perigos e avaliação de riscos","Planejamento, organização e execução segura das atividades","Análise Preliminar de Riscos (APR)","Permissão de Trabalho (PT)","Sistemas de proteção contra quedas","Equipamentos de Proteção Individual (EPIs) para trabalho em altura","Inspeção, utilização e conservação dos equipamentos","Fatores de risco e condições impeditivas","Condutas em situações de emergência","Noções básicas de resgate e primeiros socorros","Responsabilidades dos trabalhadores e empregadores","Cultura de prevenção e comportamento seguro"]$q$::jsonb,$q$["Trabalhadores que realizam atividades em altura","Equipes de manutenção","Profissionais da construção civil","Operadores de plataformas elevatórias","Montadores e instaladores","Técnicos de Segurança do Trabalho","Supervisores e líderes operacionais","Integrantes do SESMT","Empresas que realizam atividades com risco de queda"]$q$::jsonb,$q$["Redução dos riscos de quedas e acidentes graves","Maior conscientização dos trabalhadores","Atendimento aos requisitos legais da NR 35","Fortalecimento da Cultura de Segurança","Aumento da segurança operacional","Melhoria da gestão dos trabalhos em altura","Desenvolvimento de profissionais mais preparados e responsáveis"]$q$::jsonb,$q$ASO apto para trabalho em altura, conforme a NR 35 vigente.$q$,$q$Por meio de metodologias ativas e atividades práticas, os participantes desenvolvem conhecimentos técnicos e comportamentais essenciais para atuar com segurança em ambientes de elevado potencial de risco.$q$,null,null,$q$/downloads/fichas/nr35-trabalho-altura.pdf$q$,180) on conflict (id) do nothing;
insert into public.catalogo_treinamentos (id,titulo,nr,norma,categoria,resumo,carga_horaria,modalidade,tags,imagem,aprender,publico,beneficios,prerequisito,porque,atestado,extra,ficha_pdf,ordem) values ($q$brigada-incendio$q$,$q$Brigada de Incêndio$q$,null,null,$q$emergencia$q$,$q$Capacitando pessoas para proteger vidas, preservar patrimônios e atuar com eficiência em situações de emergência.$q$,$q$Conforme legislação vigente$q$,$q$Presencial · Online ao vivo · In Company$q$,$q$[]$q$::jsonb,$q$/assets/img/treinamentos/brigada-incendio.webp$q$,$q$["Conceitos fundamentais de prevenção e combate a incêndios","Teoria do fogo e seus elementos","Classes de incêndio e métodos de extinção","Agentes extintores e suas aplicações","Sistemas de proteção contra incêndio","Identificação e controle de riscos","Procedimentos de emergência","Técnicas de abandono e evacuação de área","Organização e atribuições da Brigada de Incêndio","Comunicação e acionamento de recursos externos","Noções de primeiros socorros","Atendimento inicial às vítimas","Simulações práticas de combate a incêndio","Exercícios de resposta a emergências"]$q$::jsonb,$q$["Integrantes da Brigada de Incêndio","Colaboradores designados para atendimento a emergências","Técnicos e Engenheiros de Segurança do Trabalho","Integrantes da CIPA","Supervisores e líderes operacionais","Equipes de manutenção","Profissionais de facilities","Empresas, indústrias, centros logísticos, condomínios, instituições de ensino e organizações públicas"]$q$::jsonb,$q$["Formação de equipes preparadas para situações de emergência","Fortalecimento da cultura de prevenção","Redução dos impactos causados por incêndios e emergências","Maior proteção das pessoas e do patrimônio","Desenvolvimento da capacidade de resposta organizacional","Melhoria dos processos de gestão de emergências","Atendimento aos requisitos normativos aplicáveis"]$q$::jsonb,$q$Aptidão física e mental atestada. Idade mínima de 18 anos, conforme a ABNT NBR 14276.$q$,$q$Por meio de metodologias ativas de ensino, exercícios práticos e simulações realistas, os brigadistas desenvolvem habilidades essenciais para atuar em situações de emergência, fortalecendo a cultura preventiva e a capacidade de resposta das organizações.$q$,$q$Atestado de formação da brigada, conforme norma do Corpo de Bombeiros Militar de cada Estado.$q$,null,$q$/downloads/fichas/brigada-incendio.pdf$q$,190) on conflict (id) do nothing;

-- políticas e Termo (minutas REV00; podem ser substituídas no painel › Políticas)
insert into public.politicas_documentos (id,codigo,revisao,titulo,resumo,arquivo,capa,protegido,corpo_html,ordem) values ($q$politica-ssma$q$,$q$LTS-POL-001$q$,$q$REV00$q$,$q$Política de Saúde, Segurança e Meio Ambiente (SSMA)$q$,$q$Compromissos da LIPPMANN com a preservação da vida, a prevenção de lesões e doenças e a proteção do meio ambiente, alinhados às ISO 45001 e ISO 14001.$q$,$q$/downloads/politicas/LTS-POL-001_Politica-de-SSMA_REV00.pdf$q$,$q$/assets/img/previews/politicas/politica-ssma.webp$q$,false,null,10) on conflict (id) do nothing;
insert into public.politicas_documentos (id,codigo,revisao,titulo,resumo,arquivo,capa,protegido,corpo_html,ordem) values ($q$politica-qualidade$q$,$q$LTS-POL-002$q$,$q$REV00$q$,$q$Política da Qualidade$q$,$q$Diretrizes para entregar treinamentos e soluções que atendam aos requisitos dos clientes e das normas, com melhoria contínua, conforme a ISO 9001.$q$,$q$/downloads/politicas/LTS-POL-002_Politica-da-Qualidade_REV00.pdf$q$,$q$/assets/img/previews/politicas/politica-qualidade.webp$q$,false,null,20) on conflict (id) do nothing;
insert into public.politicas_documentos (id,codigo,revisao,titulo,resumo,arquivo,capa,protegido,corpo_html,ordem) values ($q$codigo-etica$q$,$q$LTS-COD-001$q$,$q$REV00$q$,$q$Código de Ética e Conduta$q$,$q$Princípios de conduta para colaboradores, instrutores e parceiros, com o guia do Canal de Denúncias, garantia de sigilo e não retaliação.$q$,$q$/downloads/politicas/LTS-COD-001_Codigo-de-Etica-e-Conduta_REV00.pdf$q$,$q$/assets/img/previews/politicas/codigo-etica.webp$q$,false,null,30) on conflict (id) do nothing;
insert into public.politicas_documentos (id,codigo,revisao,titulo,resumo,arquivo,capa,protegido,corpo_html,ordem) values ($q$termo-compromisso-social$q$,$q$LTS-TCS-001$q$,$q$REV00$q$,$q$Termo de Compromisso Social$q$,$q$Compromisso permanente de destinar 10% do lucro líquido da LIPPMANN a ações sociais, com prestação de contas pública e cláusula pétrea de governança.$q$,null,$q$/assets/img/previews/politicas/termo-compromisso-social.webp$q$,true,$q$<p>Pelo presente Termo, a <strong>LIPPMANN TREINAMENTOS E SOLUÇÕES LTDA</strong>, inscrita no CNPJ sob o nº 53.000.126/0001-22, por decisão de seu fundador, assume publicamente e de forma permanente o compromisso social descrito a seguir, como expressão concreta do seu propósito de preservar vidas por meio do conhecimento.</p>
<h2>Cláusula 1ª — Do objeto</h2>
<p>A LIPPMANN destinará <strong>10% (dez por cento) do seu lucro líquido</strong>, apurado anualmente em suas demonstrações contábeis, a entidades, projetos e ações sociais.</p>
<h2>Cláusula 2ª — Da finalidade</h2>
<p>Os recursos serão direcionados prioritariamente a iniciativas de educação, conscientização em segurança e preservação da vida, cidadania e desenvolvimento humano, com atenção especial a crianças, jovens e comunidades em situação de vulnerabilidade.</p>
<h2>Cláusula 3ª — Da seleção das entidades</h2>
<p>As entidades beneficiadas deverão possuir existência formal, finalidade social comprovada e idoneidade, sendo selecionadas pela Direção com base em critérios objetivos de impacto social, transparência e alinhamento ao propósito da LIPPMANN.</p>
<h2>Cláusula 4ª — Da provisão e da auditoria</h2>
<p>O valor correspondente será provisionado de forma contínua ao longo do exercício e acompanhado pelo painel de gestão da LIPPMANN, permitindo verificação a qualquer tempo.</p>
<h2>Cláusula 5ª — Da transparência</h2>
<p>A LIPPMANN publicará anualmente, no HUB de publicações do site oficial (lippmannts.com), a prestação de contas do programa, contendo o lucro líquido apurado, o valor destinado, as entidades beneficiadas e os resultados alcançados.</p>
<h2>Cláusula 6ª — Da cláusula pétrea de governança</h2>
<p>O presente compromisso é <strong>irrevogável por decisão unilateral</strong>. O encerramento, a suspensão ou a redução do programa somente poderá ocorrer mediante <strong>aprovação de um Júri composto pelas 3 (três) últimas entidades beneficiadas</strong>, observadas cumulativamente as seguintes condições:</p>
<ul>
<li>a) a votação será <strong>pública</strong>, com o voto de cada entidade registrado nominalmente;</li>
<li>b) a decisão deverá ser formalizada em documento com <strong>assinatura e firma reconhecida</strong> dos representantes legais das entidades votantes;</li>
<li>c) o documento de decisão será <strong>integralmente divulgado no HUB da LIPPMANN</strong>;</li>
<li>d) em caso de <strong>empate</strong>, prevalecerá o <strong>Voto de Minerva favorável à manutenção da ação social</strong>.</li>
</ul>
<h2>Cláusula 7ª — Da vigência</h2>
<p>Este Termo vigora por prazo indeterminado, a partir de sua assinatura, e vincula a LIPPMANN e seus sucessores.</p>
<p style="margin-top:28px"><strong>William Lippmann</strong><br>Fundador · LIPPMANN Treinamentos e Soluções</p>$q$,40) on conflict (id) do nothing;

-- =====================================================================
-- v6 · FASE 3: UniLTS (AVA EaD, turmas, alunos, avaliações e certificados)
-- =====================================================================
create table if not exists public.uni_cursos (
  id text primary key, titulo text not null, nr text, norma text, modalidade text default 'EaD (ensino a distância)',
  carga_horaria numeric(6,1) not null default 0, resumo text, imagem text,
  nota_corte numeric(4,2) not null default 7.00, tentativas_max int not null default 3, validade_meses int not null default 0,
  instrutor_nome text, instrutor_qualificacao text, instrutor_assinatura text,
  rt_nome text, rt_qualificacao text, rt_assinatura text,
  mapa_mental text, plano_ensino text, conteudo_programatico jsonb not null default '[]'::jsonb,
  modulos jsonb not null default '[]'::jsonb, avaliacao jsonb not null default '[]'::jsonb,
  ativo boolean not null default true, atualizado timestamptz default now()
);
-- numeração contínua e sequencial das turmas, sem lacunas: T00033-E2026, T00034-E2026, T00035-E2027...
create table if not exists public.uni_contador (chave text primary key, proximo int not null);
insert into public.uni_contador values ('turma', 33) on conflict (chave) do nothing;
create table if not exists public.uni_turmas (
  id bigint generated always as identity primary key,
  numero int unique not null, codigo text unique not null,
  curso_id text not null references public.uni_cursos(id) on delete restrict,
  tipo text not null default 'b2c' check (tipo in ('b2c','b2b')),
  inicio date, fim date, local text default 'AVA UniLTS · lippmannts.com (EaD)', instrutor_nome text, observacoes text,
  status text not null default 'aberta' check (status in ('aberta','encerrada','cancelada')),
  criado timestamptz not null default now()
);
create table if not exists public.uni_alunos (
  id bigint generated always as identity primary key,
  nome text not null, cpf text, email text unique not null, telefone text, empresa text,
  senha_hash text, trocar_senha boolean not null default true, ativo boolean not null default true,
  criado timestamptz not null default now(), ultimo_acesso timestamptz
);
create table if not exists public.uni_matriculas (
  id bigint generated always as identity primary key,
  aluno_id bigint not null references public.uni_alunos(id) on delete cascade,
  turma_id bigint not null references public.uni_turmas(id) on delete cascade,
  status text not null default 'em_andamento' check (status in ('em_andamento','aprovado','reprovado','cancelado')),
  aulas jsonb not null default '{}'::jsonb, tentativas jsonb not null default '[]'::jsonb,
  nota numeric(4,2), certificado text unique, concluido_em timestamptz,
  criado timestamptz not null default now(), unique (aluno_id, turma_id)
);
-- registros de acesso e atividade no AVA (exigência de rastreabilidade do ensino a distância)
create table if not exists public.uni_registros (
  id bigint generated always as identity primary key,
  aluno_id bigint, matricula_id bigint, acao text not null, detalhe text, t timestamptz not null default now()
);
create index if not exists ix_uni_mat_turma on public.uni_matriculas (turma_id);
create index if not exists ix_uni_reg_mat on public.uni_registros (matricula_id, t);

alter table public.uni_cursos enable row level security;
alter table public.uni_turmas enable row level security;
alter table public.uni_alunos enable row level security;
alter table public.uni_matriculas enable row level security;
alter table public.uni_registros enable row level security;
grant all on public.uni_cursos, public.uni_turmas, public.uni_alunos, public.uni_matriculas, public.uni_registros to service_role;
grant all on all sequences in schema public to service_role;

-- cria a turma com o próximo número na mesma transação (se algo falhar, o número não é perdido)
create or replace function public.uni_criar_turma(p_curso text, p_tipo text, p_inicio date, p_fim date, p_local text, p_instrutor text, p_obs text)
returns setof public.uni_turmas language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.uni_contador set proximo = proximo + 1 where chave = 'turma' returning proximo - 1 into n;
  return query insert into public.uni_turmas (numero, codigo, curso_id, tipo, inicio, fim, local, instrutor_nome, observacoes)
    values (n, 'T' || lpad(n::text, 5, '0') || '-E' || to_char(coalesce(p_inicio, (now() at time zone 'America/Sao_Paulo')::date), 'YYYY'),
            p_curso, coalesce(p_tipo, 'b2c'), p_inicio, p_fim, coalesce(nullif(p_local, ''), 'AVA UniLTS · lippmannts.com (EaD)'), p_instrutor, p_obs)
    returning *;
end $$;
-- ajusta o próximo número (somente para frente, nunca repete um código já usado)
create or replace function public.uni_ajustar_proxima(proximo_numero int)
returns int language plpgsql security definer set search_path = public as $$
declare maior int;
begin
  select coalesce(max(numero), 0) into maior from public.uni_turmas;
  if proximo_numero <= maior then raise exception 'O próximo número deve ser maior que %', maior; end if;
  update public.uni_contador set proximo = proximo_numero where chave = 'turma';
  return proximo_numero;
end $$;
alter table public.uni_contador enable row level security;
grant all on public.uni_contador to service_role;
revoke all on function public.uni_criar_turma(text, text, date, date, text, text, text), public.uni_ajustar_proxima(int) from public, anon, authenticated;
grant execute on function public.uni_criar_turma(text, text, date, date, text, text, text), public.uni_ajustar_proxima(int) to service_role;

-- curso-modelo (pode ser editado ou desativado no painel › UniLTS › Cursos)
insert into public.uni_cursos (id, titulo, nr, norma, modalidade, carga_horaria, resumo, imagem, nota_corte, tentativas_max, validade_meses,
  instrutor_nome, instrutor_qualificacao, rt_nome, rt_qualificacao, mapa_mental, plano_ensino, conteudo_programatico, modulos, avaliacao)
values ($q$integracao-ssma-ead$q$,$q$Integração de Saúde, Segurança e Meio Ambiente (SSMA)$q$,$q$NR 01$q$,$q$NR 01 – Disposições Gerais e Gerenciamento de Riscos Ocupacionais (GRO)$q$,$q$EaD (ensino a distância)$q$, 4, $q$Primeiro contato do colaborador com a Cultura de Segurança: direitos e deveres, perigos e riscos, GRO/PGR, EPI, emergências e responsabilidade ambiental.$q$, $q$/assets/img/treinamentos/integracao-ssma.webp$q$, 7, 3, 0,
  $q$William Lippmann$q$, $q$Instrutor de Aprendizagem Industrial · Técnico de Segurança do Trabalho$q$, $q$William Lippmann$q$, $q$Responsável Técnico · LIPPMANN Treinamentos e Soluções$q$, $q$/downloads/unilts/mapa-mental-integracao-ssma.pdf$q$, $q$<h2>Identificação</h2>
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
<p>O certificado é emitido automaticamente após a aprovação, com nome do trabalhador, conteúdo programático, carga horária, data, local (AVA UniLTS), nome e qualificação do instrutor e assinatura do responsável técnico, além de QR Code para validação pública em lippmannts.com/validar.html.</p>$q$,
  $q$["Conceitos fundamentais de Saúde, Segurança e Meio Ambiente (SSMA)","Direitos e deveres dos trabalhadores e empregadores","Perigo, risco e medidas de controle","Gerenciamento de Riscos Ocupacionais (GRO) e Programa de Gerenciamento de Riscos (PGR)","Equipamentos de Proteção Individual (EPI): seleção, uso, guarda e conservação","Comunicação de perigos, incidentes e desvios","Procedimentos de emergência e abandono de área","Responsabilidade ambiental e Cultura de Segurança"]$q$::jsonb, $q$[{"titulo":"Módulo 1 · Fundamentos de SSMA","aulas":[{"id":"m1a1","titulo":"Boas-vindas e Cultura de Segurança","duracao":"20 min","youtube":"","texto":"<p>Na LIPPMANN acreditamos que <strong>segurança não é prioridade, segurança é valor</strong>. Prioridades mudam conforme o dia; valores não. Esta aula apresenta o que é SSMA (Saúde, Segurança e Meio Ambiente) e por que cada pessoa é responsável pela própria segurança e pela dos colegas.</p><ul><li><strong>Saúde:</strong> bem-estar físico e mental do trabalhador.</li><li><strong>Segurança:</strong> prevenção de acidentes e doenças relacionadas ao trabalho.</li><li><strong>Meio ambiente:</strong> prevenção de impactos ambientais das atividades.</li></ul>"},{"id":"m1a2","titulo":"Direitos e deveres no trabalho","duracao":"30 min","youtube":"","texto":"<p>A NR 01 define responsabilidades para empregadores e trabalhadores.</p><h3>Cabe ao empregador</h3><ul><li>Cumprir e fazer cumprir as normas de segurança e saúde.</li><li>Informar os riscos e as medidas de prevenção.</li><li>Fornecer gratuitamente EPI adequado ao risco.</li></ul><h3>Cabe ao trabalhador</h3><ul><li>Cumprir as ordens de serviço e procedimentos.</li><li>Usar o EPI fornecido e colaborar com a empresa.</li><li>Submeter-se aos exames médicos previstos.</li></ul><p>O trabalhador pode <strong>interromper a atividade</strong> quando constatar situação de risco grave e iminente, comunicando imediatamente o superior hierárquico.</p>"}]},{"titulo":"Módulo 2 · Perigos, riscos e GRO","aulas":[{"id":"m2a1","titulo":"Perigo, risco e medidas de controle","duracao":"35 min","youtube":"","texto":"<p><strong>Perigo</strong> é a fonte com potencial de causar lesão ou agravo à saúde (por exemplo, uma máquina em movimento). <strong>Risco</strong> é a combinação da probabilidade de ocorrer o dano e da sua severidade.</p><p>As medidas de prevenção seguem uma ordem de prioridade:</p><ol><li>Eliminação do perigo.</li><li>Substituição por algo menos perigoso.</li><li>Medidas de proteção coletiva e de engenharia.</li><li>Medidas administrativas ou de organização do trabalho.</li><li>Equipamento de Proteção Individual (EPI).</li></ol>"},{"id":"m2a2","titulo":"GRO e PGR na prática","duracao":"35 min","youtube":"","texto":"<p>O <strong>Gerenciamento de Riscos Ocupacionais (GRO)</strong> é o processo contínuo de identificar perigos, avaliar riscos e implementar medidas de prevenção. Ele é documentado no <strong>Programa de Gerenciamento de Riscos (PGR)</strong>, composto pelo inventário de riscos e pelo plano de ação.</p><blockquote>O PGR não é um documento de gaveta: ele deve ser conhecido por todos e revisado sempre que houver mudanças.</blockquote>"}]},{"titulo":"Módulo 3 · Proteção e comunicação","aulas":[{"id":"m3a1","titulo":"EPI: uso, guarda e conservação","duracao":"30 min","youtube":"","texto":"<p>O EPI deve possuir <strong>Certificado de Aprovação (CA)</strong> válido e ser adequado ao risco. O trabalhador deve:</p><ul><li>usar o EPI apenas para a finalidade a que se destina;</li><li>responsabilizar-se pela guarda e conservação;</li><li>comunicar qualquer alteração que o torne impróprio para uso.</li></ul>"},{"id":"m3a2","titulo":"Comunicação de perigos, incidentes e desvios","duracao":"25 min","youtube":"","texto":"<p>Todo <strong>incidente</strong> (evento que poderia ter causado lesão) e todo <strong>desvio</strong> (condição ou ato fora do padrão) deve ser comunicado. Comunicar não é dedurar: é prevenir que um quase-acidente se transforme em acidente.</p>"}]},{"titulo":"Módulo 4 · Emergências e meio ambiente","aulas":[{"id":"m4a1","titulo":"Emergência e abandono de área","duracao":"30 min","youtube":"","texto":"<p>Conheça as rotas de fuga, saídas de emergência e o ponto de encontro da sua unidade. Ao ouvir o alarme:</p><ol><li>Mantenha a calma e interrompa a atividade com segurança.</li><li>Siga as orientações da brigada de emergência.</li><li>Não use elevadores e não volte para buscar objetos.</li><li>Dirija-se ao ponto de encontro e aguarde a contagem.</li></ol>"},{"id":"m4a2","titulo":"Responsabilidade ambiental","duracao":"35 min","youtube":"","texto":"<p>Separar corretamente os resíduos, evitar desperdícios de água e energia e comunicar vazamentos são atitudes que protegem o meio ambiente e fazem parte da Cultura de SSMA.</p>"}]}]$q$::jsonb, $q$[{"pergunta":"O que diferencia PERIGO de RISCO?","alternativas":["São sinônimos","Perigo é a fonte de dano; risco combina probabilidade e severidade","Risco é a fonte de dano; perigo é a probabilidade","Perigo só existe em indústrias"],"correta":1},{"pergunta":"Na hierarquia das medidas de prevenção, qual é a PRIMEIRA opção?","alternativas":["Uso de EPI","Treinamento","Eliminação do perigo","Sinalização"],"correta":2},{"pergunta":"O EPI deve possuir:","alternativas":["Nota fiscal do trabalhador","Certificado de Aprovação (CA) válido","Cor azul","Assinatura do supervisor"],"correta":1},{"pergunta":"Quem deve fornecer o EPI ao trabalhador?","alternativas":["O próprio trabalhador","O sindicato","O empregador, gratuitamente","A CIPA, mediante pagamento"],"correta":2},{"pergunta":"O que é o PGR?","alternativas":["Programa de Gerenciamento de Riscos, com inventário de riscos e plano de ação","Plano Geral de Remuneração","Procedimento de Guarda de Resíduos","Programa de Ginástica Regular"],"correta":0},{"pergunta":"Diante de risco grave e iminente, o trabalhador pode:","alternativas":["Continuar a atividade para não atrasar","Interromper a atividade e comunicar o superior","Esperar o fim do turno","Resolver sozinho sem avisar"],"correta":1},{"pergunta":"Um quase-acidente (incidente) deve ser:","alternativas":["Ignorado, pois ninguém se feriu","Comunicado, para prevenir acidentes futuros","Comunicado apenas se houver dano material","Registrado somente pela brigada"],"correta":1},{"pergunta":"Ao ouvir o alarme de emergência, você deve:","alternativas":["Usar o elevador para sair rápido","Voltar para buscar seus pertences","Seguir a rota de fuga até o ponto de encontro","Aguardar no posto de trabalho"],"correta":2},{"pergunta":"O GRO é:","alternativas":["Um documento assinado uma única vez","Um processo contínuo de identificar perigos, avaliar e controlar riscos","Um equipamento de proteção coletiva","Uma multa aplicada pela fiscalização"],"correta":1},{"pergunta":"Qual atitude demonstra responsabilidade ambiental?","alternativas":["Descartar resíduos em qualquer lixeira","Comunicar vazamentos e separar resíduos corretamente","Deixar equipamentos ligados sem uso","Lavar áreas externas com água potável diariamente"],"correta":1}]$q$::jsonb) on conflict (id) do nothing;

-- =====================================================================
-- v6 · FASE 4: Empresas (B2B), Parceiros/Instrutores, prazos e evidências
-- =====================================================================
create table if not exists public.uni_empresas (
  id bigint generated always as identity primary key,
  razao_social text not null, nome_fantasia text, cnpj text unique not null,
  contato_nome text, contato_email text, contato_telefone text,
  ativo boolean not null default true, criado timestamptz not null default now()
);
-- usuários da empresa cliente: enxergam somente os dados da própria empresa
create table if not exists public.uni_empresa_usuarios (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.uni_empresas(id) on delete cascade,
  nome text not null, email text unique not null, senha_hash text,
  trocar_senha boolean not null default true, ativo boolean not null default true,
  criado timestamptz not null default now(), ultimo_acesso timestamptz
);
create table if not exists public.uni_parceiros (
  id bigint generated always as identity primary key,
  nome text not null, cpf text, email text unique not null, telefone text,
  qualificacao text, registro text,
  senha_hash text, trocar_senha boolean not null default true, ativo boolean not null default true,
  criado timestamptz not null default now(), ultimo_acesso timestamptz
);
-- colaboradores importados pela planilha padrão (dados de ASO são dados pessoais sensíveis: LGPD art. 11)
create table if not exists public.uni_colaboradores (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.uni_empresas(id) on delete cascade,
  nome text not null, matricula text, rg text, cpf text not null,
  admissao date, aso_data date, aso_tipo text,
  apto_altura boolean, apto_confinado boolean, apto_eletricidade boolean,
  cargo text, unidade text, filial text, centro_custo text, area text, telefone text, email text,
  aluno_id bigint references public.uni_alunos(id) on delete set null,
  criado timestamptz not null default now(), atualizado timestamptz,
  unique (empresa_id, cpf)
);
create index if not exists ix_uni_colab_emp on public.uni_colaboradores (empresa_id);

alter table public.uni_turmas add column if not exists modalidade text not null default 'ead';
alter table public.uni_turmas add column if not exists empresa_id bigint references public.uni_empresas(id) on delete set null;
alter table public.uni_turmas add column if not exists parceiro_id bigint references public.uni_parceiros(id) on delete set null;
alter table public.uni_turmas add column if not exists prazo_dias int not null default 30;
alter table public.uni_turmas add column if not exists encerrada_em timestamptz;
alter table public.uni_turmas add column if not exists concluida_parceiro timestamptz;
do $$ begin
  alter table public.uni_turmas add constraint uni_turmas_modalidade_chk check (modalidade in ('ead','presencial','hibrido'));
exception when duplicate_object then null; end $$;

alter table public.uni_alunos alter column email drop not null;
alter table public.uni_matriculas add column if not exists prazo_ate timestamptz;
alter table public.uni_matriculas add column if not exists resets int not null default 0;
alter table public.uni_matriculas add column if not exists acesso_revogado timestamptz;
alter table public.uni_matriculas add column if not exists reabilitado_por text;
alter table public.uni_matriculas add column if not exists nota_teorica numeric(4,2);
alter table public.uni_matriculas add column if not exists nota_pratica numeric(4,2);
alter table public.uni_matriculas add column if not exists presenca_entrada timestamptz;
alter table public.uni_matriculas add column if not exists presenca_saida timestamptz;
alter table public.uni_matriculas add column if not exists colaborador_id bigint references public.uni_colaboradores(id) on delete set null;

-- documentos e evidências fotográficas das turmas (bucket PRIVADO "evidencias")
create table if not exists public.uni_turma_arquivos (
  id bigint generated always as identity primary key,
  turma_id bigint not null references public.uni_turmas(id) on delete cascade,
  categoria text not null check (categoria in ('documento','foto')),
  tipo text not null, legenda text, caminho text not null, nome_original text,
  largura int, altura int, bytes bigint, enviado_por text,
  criado timestamptz not null default now()
);
create index if not exists ix_uni_arq_turma on public.uni_turma_arquivos (turma_id);

alter table public.uni_empresas enable row level security;
alter table public.uni_empresa_usuarios enable row level security;
alter table public.uni_parceiros enable row level security;
alter table public.uni_colaboradores enable row level security;
alter table public.uni_turma_arquivos enable row level security;
grant all on public.uni_empresas, public.uni_empresa_usuarios, public.uni_parceiros, public.uni_colaboradores, public.uni_turma_arquivos to service_role;
grant all on all sequences in schema public to service_role;

-- a criação de turma passa a aceitar modalidade, empresa e instrutor parceiro
create or replace function public.uni_criar_turma2(p_curso text, p_tipo text, p_inicio date, p_fim date, p_local text, p_instrutor text, p_obs text,
  p_modalidade text, p_empresa bigint, p_parceiro bigint, p_prazo int)
returns setof public.uni_turmas language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.uni_contador set proximo = proximo + 1 where chave = 'turma' returning proximo - 1 into n;
  return query insert into public.uni_turmas (numero, codigo, curso_id, tipo, inicio, fim, local, instrutor_nome, observacoes, modalidade, empresa_id, parceiro_id, prazo_dias)
    values (n, 'T' || lpad(n::text, 5, '0') || '-E' || to_char(coalesce(p_inicio, (now() at time zone 'America/Sao_Paulo')::date), 'YYYY'),
            p_curso, coalesce(p_tipo, 'b2c'), p_inicio, p_fim,
            coalesce(nullif(p_local, ''), case when coalesce(p_modalidade, 'ead') = 'ead' then 'AVA UniLTS · lippmannts.com (EaD)' else 'A definir' end),
            p_instrutor, p_obs, coalesce(p_modalidade, 'ead'), p_empresa, p_parceiro, coalesce(p_prazo, 30))
    returning *;
end $$;
revoke all on function public.uni_criar_turma2(text, text, date, date, text, text, text, text, bigint, bigint, int) from public, anon, authenticated;
grant execute on function public.uni_criar_turma2(text, text, date, date, text, text, text, text, bigint, bigint, int) to service_role;

-- evidências e documentos: privado (abre só por link temporário)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 52428800, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- =====================================================================
-- v6 · FASE 5: Pagamentos (Mercado Pago), estornos e BI financeiro
-- =====================================================================
alter table public.uni_cursos add column if not exists preco numeric(10,2) not null default 0;
alter table public.uni_cursos add column if not exists venda_online boolean not null default false;

create table if not exists public.uni_pedidos (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  curso_id text not null references public.uni_cursos(id) on delete restrict,
  aluno_id bigint references public.uni_alunos(id) on delete set null,
  matricula_id bigint references public.uni_matriculas(id) on delete set null,
  nome text not null, cpf text not null, email text not null, telefone text,
  valor numeric(10,2) not null, metodo text not null check (metodo in ('pix','cartao')),
  parcelas int not null default 1, cartao_final text, bandeira text,
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado','estornado','cancelado','expirado')),
  mp_id text, mp_status text, mp_detalhe text, taxa numeric(10,2) not null default 0,
  pix_copia_cola text, pix_qr_base64 text, pix_expira timestamptz,
  ambiente text not null default 'sandbox', ip_hash text,
  pago_em timestamptz, estornado_em timestamptz, estorno_motivo text, estorno_por text,
  criado timestamptz not null default now(), atualizado timestamptz
);
create index if not exists ix_uni_pedidos_status on public.uni_pedidos (status, pago_em);
create index if not exists ix_uni_pedidos_mp on public.uni_pedidos (mp_id);
alter table public.uni_matriculas add column if not exists pedido_id bigint references public.uni_pedidos(id) on delete set null;

-- lançamentos financeiros no-code: despesas operacionais e receitas fora da loja (contratos B2B etc.)
create table if not exists public.fin_lancamentos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('despesa','receita')),
  data date not null, categoria text not null, descricao text, valor numeric(12,2) not null check (valor >= 0),
  criado_por text, criado timestamptz not null default now(), atualizado timestamptz
);
create index if not exists ix_fin_lanc_data on public.fin_lancamentos (data);

alter table public.uni_pedidos enable row level security;
alter table public.fin_lancamentos enable row level security;
grant all on public.uni_pedidos, public.fin_lancamentos to service_role;
grant all on all sequences in schema public to service_role;

-- =====================================================================
-- FASE 6 · Soluções editáveis no L³ INTEGRA (Site e conteúdo › Soluções)
-- =====================================================================
create table if not exists public.catalogo_solucoes (
  id text primary key, grupo text not null default 'analises', titulo text not null, texto text,
  ordem int not null default 100, ativo boolean not null default true, atualizado timestamptz
);
alter table public.catalogo_solucoes enable row level security;
grant all on public.catalogo_solucoes to service_role;
-- grupos (filtros da página) ficam em config.solucoes_grupos; lista inicial do LTS-CAT-002 (não sobrescreve edições)
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$analise-riscos-nr12$q$,$q$analises$q$,$q$Análise de Riscos em Máquinas e Equipamentos (NR 12)$q$,$q$Identificação, avaliação e classificação dos riscos existentes em máquinas e equipamentos, visando subsidiar medidas de controle, adequação à NR 12 e fortalecimento da segurança operacional.$q$,10) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$aet$q$,$q$analises$q$,$q$Análise Ergonômica do Trabalho (AET)$q$,$q$Estudo aprofundado das condições de trabalho para avaliar fatores físicos, cognitivos e organizacionais que possam impactar a saúde, o conforto e o desempenho dos trabalhadores, conforme requisitos da NR 17.$q$,20) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$apr$q$,$q$analises$q$,$q$Análise Preliminar de Riscos (APR)$q$,$q$Ferramenta preventiva utilizada para identificar perigos, avaliar riscos e definir medidas de controle antes da execução de atividades, contribuindo para a prevenção de acidentes e incidentes.$q$,30) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$aep$q$,$q$analises$q$,$q$Avaliação Ergonômica Preliminar (AEP)$q$,$q$Avaliação inicial dos fatores ergonômicos presentes no ambiente de trabalho, permitindo identificar situações de risco e definir ações preventivas para melhoria das condições laborais.$q$,40) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$avaliacao-psicossocial$q$,$q$analises$q$,$q$Avaliação Psicossocial$q$,$q$Avaliação realizada para identificar fatores psicossociais que possam impactar a saúde mental, emocional e comportamental dos trabalhadores, especialmente em atividades críticas previstas em normas regulamentadoras.$q$,50) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$dimensionamento-brigada$q$,$q$emergencias$q$,$q$Dimensionamento de Brigada de Incêndio$q$,$q$Estudo técnico para definição da composição mínima da brigada de incêndio, considerando ocupação, população fixa, área construída e riscos existentes, conforme requisitos normativos aplicáveis.$q$,60) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$diagnostico-ssma$q$,$q$gestao$q$,$q$Diagnóstico de Segurança, Saúde e Meio Ambiente$q$,$q$Levantamento técnico das condições de SSMA da organização, identificando oportunidades de melhoria, requisitos legais aplicáveis e ações necessárias para fortalecer a gestão de riscos.$q$,70) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$indicadores-ssma$q$,$q$gestao$q$,$q$Estruturação de Indicadores de SSMA$q$,$q$Desenvolvimento de indicadores estratégicos e operacionais para monitoramento do desempenho em Saúde, Segurança e Meio Ambiente, apoiando a tomada de decisão e a melhoria contínua.$q$,80) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$inspecoes$q$,$q$gestao$q$,$q$Inspeções de Segurança$q$,$q$Avaliação sistemática de ambientes, equipamentos e processos com o objetivo de identificar desvios, condições inseguras e oportunidades de melhoria para prevenção de acidentes.$q$,90) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$inventario-maquinas$q$,$q$programas$q$,$q$Inventário de Máquinas e Equipamentos (NR 12)$q$,$q$Levantamento detalhado das máquinas e equipamentos existentes na organização, com identificação de características técnicas, riscos associados e requisitos de adequação aplicáveis.$q$,100) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$inventario-riscos$q$,$q$programas$q$,$q$Inventário de Riscos Ocupacionais$q$,$q$Documento que reúne a identificação dos perigos, avaliação dos riscos ocupacionais e medidas de prevenção existentes, servindo como base para o Programa de Gerenciamento de Riscos (PGR).$q$,110) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$investigacao-acidentes$q$,$q$gestao$q$,$q$Investigação e Análise de Acidentes$q$,$q$Processo estruturado para identificação das causas imediatas e causas raízes de acidentes e incidentes, visando eliminar recorrências e fortalecer a cultura preventiva.$q$,120) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$ltcat$q$,$q$programas$q$,$q$Laudo Técnico das Condições Ambientais do Trabalho (LTCAT)$q$,$q$Documento técnico elaborado para caracterização da exposição dos trabalhadores a agentes nocivos, servindo como base para fins previdenciários e gestão dos riscos ocupacionais.$q$,130) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$laudo-insalubridade$q$,$q$programas$q$,$q$Laudos de Insalubridade$q$,$q$Avaliação técnica destinada a verificar a exposição dos trabalhadores a agentes físicos, químicos ou biológicos acima dos limites de tolerância estabelecidos pela legislação trabalhista.$q$,140) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$laudo-periculosidade$q$,$q$programas$q$,$q$Laudos de Periculosidade$q$,$q$Estudo técnico que avalia atividades e operações que possam expor trabalhadores a condições perigosas, conforme critérios estabelecidos pela legislação vigente.$q$,150) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$pae$q$,$q$emergencias$q$,$q$Plano de Atendimento a Emergências (PAE)$q$,$q$Documento que estabelece procedimentos, responsabilidades e recursos necessários para resposta organizada e eficaz a situações de emergência, minimizando impactos às pessoas, ao patrimônio e ao meio ambiente.$q$,160) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$emergencias-quimicas$q$,$q$emergencias$q$,$q$Plano de Resposta a Emergências Químicas$q$,$q$Planejamento específico para prevenção, preparação e resposta a incidentes envolvendo produtos químicos perigosos, visando reduzir riscos e proteger trabalhadores e instalações.$q$,170) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$pgr$q$,$q$programas$q$,$q$Programa de Gerenciamento de Riscos (PGR)$q$,$q$Programa obrigatório que estabelece diretrizes para identificação de perigos, avaliação de riscos ocupacionais e implementação de medidas preventivas, promovendo ambientes de trabalho mais seguros e saudáveis.$q$,180) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$ppr$q$,$q$programas$q$,$q$Programa de Proteção Respiratória (PPR)$q$,$q$Programa voltado à seleção, utilização, manutenção e gestão de equipamentos de proteção respiratória, garantindo proteção adequada aos trabalhadores expostos a contaminantes atmosféricos.$q$,190) on conflict (id) do nothing;
insert into public.catalogo_solucoes (id,grupo,titulo,texto,ordem) values ($q$simulados$q$,$q$emergencias$q$,$q$Simulados de Emergência$q$,$q$Exercícios práticos planejados para avaliar a capacidade de resposta da organização diante de situações de emergência, promovendo o treinamento das equipes e a validação dos procedimentos estabelecidos.$q$,200) on conflict (id) do nothing;
insert into public.config (chave, valor) values ('solucoes_grupos', $q${"analises":"Análises e avaliações","programas":"Programas, inventários e laudos","emergencias":"Preparação para emergências","gestao":"Gestão e diagnóstico"}$q$) on conflict (chave) do nothing;

-- =====================================================================
-- FASE 6 · Multi-idiomas: traduções editadas no L³ INTEGRA (Site e conteúdo › Traduções)
-- O site usa os dicionários de /data/i18n/ e, por cima deles, estas edições.
-- =====================================================================
create table if not exists public.i18n_textos (
  id text not null,                 -- hash do texto original (pt-BR)
  idioma text not null check (idioma in ('pt-PT','en-US','en-GB','es-ES')),
  pt text not null,                 -- texto original em português do Brasil
  traducao text not null,
  atualizado timestamptz not null default now(),
  atualizado_por text,
  primary key (id, idioma)
);
create index if not exists i18n_textos_idioma on public.i18n_textos (idioma);
alter table public.i18n_textos enable row level security;
grant all on public.i18n_textos to service_role;

-- FASE 7 · Política de Reembolso e Cancelamento (LTS-POL-003)
insert into public.politicas_documentos (id,codigo,revisao,titulo,resumo,arquivo,capa,protegido,corpo_html,ordem) values ($q$politica-reembolso$q$,$q$LTS-POL-003$q$,$q$REV00$q$,$q$Política de Reembolso e Cancelamento$q$,$q$Regras de rastreio das compras da UniLTS, direito de arrependimento em 7 dias, cancelamento formal, bloqueio imediato do acesso e revogação de certificados.$q$,$q$/downloads/politicas/LTS-POL-003_Politica-de-Reembolso_REV00.pdf$q$,$q$/assets/img/previews/politicas/politica-reembolso.webp$q$,false,null,35) on conflict (id) do nothing;

-- =====================================================================
-- FASE 7 · Ouvidoria rastreável (Fale Conosco › Denúncias, Reclamações e Sugestões de Melhoria)
-- =====================================================================
create table if not exists public.ouv_protocolos (
  id bigint generated always as identity primary key,
  protocolo text not null unique,            -- ex.: OUV-2026-7KQ4M9
  chave_hash text not null,                  -- código de acesso (6 dígitos) com hash
  registro_id bigint,                        -- registros.id (mensagem original do Fale Conosco)
  tipo text not null check (tipo in ('denuncia','reclamacao','sugestao')),
  nome text, email text, telefone text, anonimo boolean not null default false,
  mensagem text not null,
  status text not null default 'recebido' check (status in ('recebido','em_analise','respondido','concluido')),
  criado timestamptz not null default now(), atualizado timestamptz not null default now()
);
create table if not exists public.ouv_mensagens (
  id bigint generated always as identity primary key,
  protocolo_id bigint not null references public.ouv_protocolos(id) on delete cascade,
  autor text not null check (autor in ('lippmann','solicitante','sistema')),
  texto text not null,
  publico boolean not null default true,     -- false = anotação interna (não aparece na consulta pública)
  status_novo text,
  por text,
  criado timestamptz not null default now()
);
create index if not exists ouv_mensagens_protocolo on public.ouv_mensagens (protocolo_id, criado);
alter table public.ouv_protocolos enable row level security;
alter table public.ouv_mensagens enable row level security;
grant all on public.ouv_protocolos, public.ouv_mensagens to service_role;

-- =====================================================================
-- FASE 7 · Trilha obrigatória do instrutor parceiro (curso interno) e modalidade Híbrida (Blended Learning)
-- (a modalidade hibrido já existe em uni_turmas.modalidade: teoria e avaliação no AVA + prática presencial lançada pelo parceiro)
-- =====================================================================
alter table public.uni_cursos add column if not exists interno boolean not null default false;
alter table public.uni_parceiros add column if not exists aluno_id bigint, add column if not exists trilha_aprovada_em timestamptz, add column if not exists trilha_dispensada boolean not null default false;
insert into public.uni_cursos (id, titulo, nr, norma, modalidade, carga_horaria, resumo, imagem, nota_corte, tentativas_max, validade_meses, instrutor_nome, instrutor_qualificacao, rt_nome, rt_qualificacao, mapa_mental, plano_ensino, conteudo_programatico, modulos, avaliacao, interno, venda_online, preco)
values ($q$trilha-instrutor-parceiro$q$, $q$Trilha de Capacitação do Instrutor Parceiro LIPPMANN$q$, $q$Interno$q$, $q$Onboarding obrigatório de instrutores e parceiros · Padrão LIPPMANN de ensino$q$, $q$EaD (ensino a distância)$q$, 3, $q$Curso obrigatório para instrutores e parceiros: institucional, portfólio, políticas corporativas, metodologia ativa de ensino e tutorial passo a passo da plataforma UniLTS.$q$, $q$/assets/img/marca/lipp-instrucao.webp$q$, 8, 3, 24, $q$William Lippmann$q$, $q$Fundador · Instrutor de Aprendizagem Industrial · Técnico de Segurança do Trabalho$q$, $q$William Lippmann$q$, $q$Responsável Técnico · LIPPMANN Treinamentos e Soluções$q$, $q$$q$, $q$<h2>Identificação</h2>
<p><strong>Curso:</strong> Trilha de Capacitação do Instrutor Parceiro LIPPMANN · <strong>Modalidade:</strong> EaD · <strong>Carga horária:</strong> 3 horas · <strong>Validade:</strong> 24 meses.</p>
<h2>Objetivo</h2>
<p>Alinhar todo instrutor e parceiro ao padrão LIPPMANN: identidade, portfólio, políticas, metodologia de ensino e operação correta da plataforma UniLTS, garantindo rastreabilidade e qualidade em cada turma.</p>
<h2>Público-alvo</h2>
<p>Instrutores, consultores e empresas parceiras que conduzem turmas presenciais ou híbridas em nome da LIPPMANN.</p>
<h2>Avaliação e liberação</h2>
<p>Até <strong>3 tentativas</strong>, com nota mínima <strong>8,00</strong>. A aprovação libera, automaticamente, a criação e a conclusão de turmas no Painel do Parceiro.</p>$q$, $q$["Apresentação Institucional: história, propósito, missão, visão e valores","Portfólio LTS: treinamentos normativos, desenvolvimento humano e soluções técnicas","Políticas Corporativas: SSMA, Qualidade, Código de Ética, Reembolso, Compromisso Social e LGPD","Metodologia Ativa de Ensino: o padrão de aula LIPPMANN","Tutorial interativo da plataforma UniLTS: turmas, participantes, notas, presença, documentos FR-DOC e evidências"]$q$::jsonb, $q$[{"titulo":"Módulo 1 · A LIPPMANN","aulas":[{"id":"t1a1","titulo":"Apresentação Institucional","duracao":"25 min","youtube":"","texto":"<p>A <strong>LIPPMANN Treinamentos e Soluções</strong> nasceu da convicção de que pessoas bem capacitadas são o principal diferencial para construir organizações mais seguras, produtivas e sustentáveis. Nosso fundador, William Lippmann, atuou por mais de 10 anos em SSMA na indústria e percebeu que muitas empresas treinavam para cumprir a lei, mas poucas transformavam conhecimento em comportamento.</p>\n<h3>Manifesto</h3><blockquote>Segurança não é prioridade. Segurança é valor.</blockquote>\n<h3>Missão</h3><p>Disseminar a Cultura de Segurança como Valor, capacitando pessoas e transformando organizações por meio de treinamentos, consultorias e soluções que unem conhecimento técnico, experiência prática e desenvolvimento humano.</p>\n<h3>Valores que você representa em sala</h3><ul><li><strong>Segurança como Valor</strong> e preservação da vida.</li><li><strong>Integridade</strong> e transparência.</li><li><strong>Excelência</strong> técnica e pedagógica.</li><li><strong>Empatia</strong> com cada participante.</li><li><strong>Responsabilidade social</strong>: 10% do lucro líquido destinados a ações sociais (Termo de Compromisso Social).</li></ul>\n<p>Ao conduzir uma turma, você <strong>é</strong> a LIPPMANN para aquele cliente: pontualidade, apresentação pessoal, uso exemplar de EPI e linguagem respeitosa são inegociáveis.</p>"},{"id":"t1a2","titulo":"Portfólio LTS","duracao":"25 min","youtube":"","texto":"<p>O portfólio se divide em três frentes:</p>\n<ul><li><strong>Treinamentos normativos (NR):</strong> NR 01, 05, 06, 10, 11, 12, 13, 17, 18, 20, 26, 33, 35 e Brigada de Incêndio, sempre com carga horária e conteúdo conforme a norma vigente.</li><li><strong>Desenvolvimento e cultura:</strong> Liderança em Segurança, Prevenção ao Assédio, Gestão de SSMA e Indicadores.</li><li><strong>Soluções técnicas:</strong> PGR, inventários, laudos, AET, análises de risco, PAE, simulados e diagnósticos.</li></ul>\n<h3>Ficha técnica (padrão SENAI)</h3><p>Cada treinamento tem ficha técnica com objetivos, público-alvo, pré-requisitos, conteúdo e benefícios. <strong>Siga a ficha</strong>: o conteúdo ministrado deve corresponder ao que o cliente contratou e ao que constará no certificado.</p>\n<h3>Modalidades</h3><ul><li><strong>Presencial / in company:</strong> teoria e prática com o instrutor.</li><li><strong>Híbrida (Blended Learning):</strong> teoria e avaliação on-line no AVA UniLTS; prática presencial com o instrutor, que lança a nota prática, a lista de presença e as evidências.</li><li><strong>EaD:</strong> 100% no AVA, com certificado automático após aprovação.</li></ul>"}]},{"titulo":"Módulo 2 · Políticas corporativas","aulas":[{"id":"t2a1","titulo":"Políticas, ética e proteção de dados","duracao":"30 min","youtube":"","texto":"<p>Todo instrutor e parceiro deve conhecer e cumprir:</p>\n<ul><li><strong>Política de SSMA (LTS-POL-001):</strong> direito de recusa diante de risco grave e iminente, hierarquia de controles em toda aula prática.</li><li><strong>Política da Qualidade (LTS-POL-002):</strong> rastreabilidade completa de cada turma.</li><li><strong>Código de Ética e Conduta (LTS-COD-001):</strong> respeito, sigilo, combate ao assédio, conflito de interesses e Canal de Denúncias com protocolo rastreável.</li><li><strong>Política de Reembolso e Cancelamento (LTS-POL-003):</strong> nas vendas on-line, estorno bloqueia o acesso e revoga certificados.</li><li><strong>Termo de Compromisso Social (LTS-TCS-001).</strong></li></ul>\n<h3>LGPD na prática</h3><ul><li>Peça apenas os dados necessários; ASO é dado sensível.</li><li>Não fotografe documentos pessoais dos participantes.</li><li>Não compartilhe listas e notas fora da plataforma.</li><li>Em telas públicas, o CPF aparece sempre mascarado (123.***.***-**).</li></ul>\n<h3>Propriedade intelectual</h3><p>Apostilas, apresentações e materiais da LIPPMANN são de uso exclusivo nas turmas da LIPPMANN. É proibido copiar, distribuir ou reutilizar em outras empresas.</p>"}]},{"titulo":"Módulo 3 · Metodologia Ativa de Ensino","aulas":[{"id":"t3a1","titulo":"O padrão de aula LIPPMANN","duracao":"35 min","youtube":"","texto":"<p>Treinamento eficaz não apenas informa: <strong>transforma comportamento</strong>. Por isso, o participante é o centro da aula.</p>\n<h3>Roteiro de aula (5 etapas)</h3><ol><li><strong>Conexão:</strong> quebra-gelo e pergunta sobre a realidade do participante.</li><li><strong>Problema:</strong> apresente um caso real (incidente, quase-acidente) antes da teoria.</li><li><strong>Construção:</strong> conceitos curtos, intercalados com perguntas e atividades em grupo.</li><li><strong>Prática:</strong> simulações e exercícios com o equipamento ou cenário real, sempre com análise de risco prévia.</li><li><strong>Compromisso:</strong> cada participante declara uma atitude segura que levará ao trabalho.</li></ol>\n<h3>Técnicas recomendadas</h3><ul><li>Estudo de caso e análise de acidentes.</li><li>Sala de aula invertida (teoria no AVA, prática presencial: modalidade híbrida).</li><li>Simulações realistas e role-play.</li><li>Gamificação com perguntas rápidas.</li></ul>\n<h3>Avaliação</h3><p>Avaliação teórica (FR-DOC-11), avaliação prática (FR-DOC-09) e avaliação de reação (FR-DOC-04) em todas as turmas. Aprovação com nota mínima definida no curso, nas duas avaliações.</p>"}]},{"titulo":"Módulo 4 · Tutorial interativo da plataforma UniLTS","aulas":[{"id":"t4a1","titulo":"Passo a passo: da turma ao relatório FR-DOC-18","duracao":"40 min","youtube":"","texto":"<p>Clique em cada passo para ver o que fazer no <strong>Painel do Parceiro</strong> (lippmannts.com/parceiro).</p>\n<details open><summary><strong>Passo 1 · Primeiro acesso</strong></summary><p>Entre com o e-mail cadastrado e a senha provisória recebida por e-mail. O sistema exige a troca da senha (mínimo de 8 caracteres, letras e números).</p></details>\n<details><summary><strong>Passo 2 · Criar a turma</strong></summary><p>Clique em <em>+ Nova turma presencial</em>, escolha o curso, a modalidade (Presencial ou Híbrida/Blended Learning), a empresa contratante, as datas e o local. O código oficial (TXXXXX-EAAAA) é gerado automaticamente.</p></details>\n<details><summary><strong>Passo 3 · Participantes</strong></summary><p>Na aba <em>Participantes e notas</em>, adicione cada pessoa com nome completo (é o nome do certificado) e CPF. Na turma híbrida, os participantes fazem a teoria e a avaliação on-line no AVA.</p></details>\n<details><summary><strong>Passo 4 · Notas e presença</strong></summary><p>Lance a nota teórica e a prática (de 0 a 10) e os horários de entrada e saída de cada participante. Use <em>Preencher entrada/saída com o horário da turma</em> para agilizar. Na turma híbrida, a nota teórica vem do AVA e você lança apenas a prática.</p></details>\n<details><summary><strong>Passo 5 · Documentos FR-DOC</strong></summary><p>Envie (PDF ou foto legível): FR-DOC-02 · Lista de Presença, FR-DOC-04 · Avaliação de Reação, FR-DOC-09 · Avaliação Prática, FR-DOC-11 · Avaliação Teórica, termos de autorização de uso de imagem e a sua credencial (MTE/CREA).</p></details>\n<details><summary><strong>Passo 6 · Evidências fotográficas</strong></summary><p>As 4 fotos são obrigatórias, no arquivo original da câmera (mínimo de 1280 px), cada uma com descrição de pelo menos 10 caracteres: 1. Selfie com o grupo · 2. Exercício teórico · 3. Exercício prático · 4. Foto final com a turma.</p></details>\n<details><summary><strong>Passo 7 · Concluir a turma</strong></summary><p>Com notas, presença, documentos e fotos completos, clique em <em>Concluir turma</em>. Os aprovados recebem o certificado com QR Code automaticamente e a turma fica bloqueada para edição.</p></details>\n<details><summary><strong>Passo 8 · Relatório FR-DOC-18</strong></summary><p>Abra o <em>Relatório FR-DOC-18</em>: ele reúne dados da turma, notas, trilha de auditoria, documentos, fotos legendadas e, em anexo, os certificados. Salve em PDF e envie ao cliente, se solicitado.</p></details>\n<p>Dúvidas? Consulte a <strong>Central de Ajuda</strong> (lippmannts.com/ajuda.html) ou fale com a coordenação pelo WhatsApp (11) 94013-8792.</p>"}]}]$q$::jsonb, $q$[{"pergunta":"Qual é o manifesto que orienta a LIPPMANN?","alternativas":["Produtividade em primeiro lugar","Segurança não é prioridade. Segurança é valor.","Treinar rápido e barato","Cumprir a norma é suficiente"],"correta":1},{"pergunta":"Na modalidade Híbrida (Blended Learning), o que o instrutor lança no Painel do Parceiro?","alternativas":["Somente a nota teórica","A nota prática, a presença, os documentos e as evidências","Nada: tudo é automático","Apenas as fotos"],"correta":1},{"pergunta":"Quantas fotos de evidência são obrigatórias por turma?","alternativas":["1","2","4, com legenda e em resolução original","Nenhuma"],"correta":2},{"pergunta":"O FR-DOC-04 corresponde a:","alternativas":["Lista de Presença","Avaliação de Reação","Avaliação Prática","Avaliação Teórica"],"correta":1},{"pergunta":"Na etapa 'Problema' do padrão de aula LIPPMANN, o instrutor deve:","alternativas":["Ler a norma inteira","Apresentar um caso real antes da teoria","Aplicar a prova","Encerrar a aula"],"correta":1},{"pergunta":"Sobre dados pessoais dos participantes (LGPD), é correto:","alternativas":["Fotografar o RG de todos","Compartilhar listas em grupos de mensagem","Pedir apenas o necessário e não divulgar fora da plataforma","Exibir o CPF completo em telas públicas"],"correta":2},{"pergunta":"O que acontece ao concluir uma turma completa?","alternativas":["Nada","Os aprovados recebem certificado com QR Code e a turma fica bloqueada para edição","A turma é excluída","O cliente precisa emitir os certificados"],"correta":1},{"pergunta":"Os materiais didáticos da LIPPMANN podem ser:","alternativas":["Reutilizados em outras empresas","Distribuídos livremente","Usados exclusivamente nas turmas da LIPPMANN","Vendidos pelo instrutor"],"correta":2},{"pergunta":"Diante de risco grave e iminente numa aula prática, o instrutor deve:","alternativas":["Continuar para cumprir a carga horária","Interromper a atividade, conforme a Política de SSMA","Pedir que os participantes assinem um termo","Ignorar"],"correta":1},{"pergunta":"Onde o cliente recebe o consolidado da turma com notas, documentos, fotos e certificados?","alternativas":["No Relatório FR-DOC-18","Por mensagem de voz","Somente por telefone","Não recebe"],"correta":0}]$q$::jsonb, true, false, 0) on conflict (id) do nothing;

-- =====================================================================
-- FASE 7 · LIPP, assistente virtual comercial (conversas, mensagens, leads e reuniões no Google Meet)
-- =====================================================================
create table if not exists public.lipp_conversas (
  id uuid primary key,
  pagina text, idioma text default 'pt-BR', visitante text, ip_hash text, geo_cidade text, geo_uf text,
  temas jsonb not null default '[]'::jsonb,           -- temas identificados (NR 35, PGR, preços...)
  mensagens int not null default 0,
  modo text,                                          -- ia (Claude) ou base (base de conhecimento)
  status text not null default 'aberta' check (status in ('aberta','lead','agendada','encerrada')),
  lead boolean not null default false, agendou boolean not null default false,
  lead_nome text, lead_email text, lead_telefone text, lead_empresa text, lead_cargo text, necessidade text,
  criado timestamptz not null default now(), atualizado timestamptz not null default now()
);
create index if not exists lipp_conversas_criado on public.lipp_conversas (criado desc);
create table if not exists public.lipp_mensagens (
  id bigint generated always as identity primary key,
  conversa_id uuid not null references public.lipp_conversas(id) on delete cascade,
  papel text not null check (papel in ('usuario','lipp')),
  texto text not null, modo text,
  criado timestamptz not null default now()
);
create index if not exists lipp_mensagens_conversa on public.lipp_mensagens (conversa_id, criado);
create table if not exists public.lipp_agendamentos (
  id bigint generated always as identity primary key,
  conversa_id uuid references public.lipp_conversas(id) on delete set null,
  nome text not null, email text not null, telefone text, empresa text, necessidade text,
  inicio timestamptz not null, fim timestamptz not null,
  status text not null default 'solicitado' check (status in ('solicitado','agendado','realizado','cancelado')),
  meet_url text, evento_id text, observacao text,
  criado timestamptz not null default now()
);
create index if not exists lipp_agendamentos_inicio on public.lipp_agendamentos (inicio);
alter table public.lipp_conversas enable row level security;
alter table public.lipp_mensagens enable row level security;
alter table public.lipp_agendamentos enable row level security;
grant all on public.lipp_conversas, public.lipp_mensagens, public.lipp_agendamentos to service_role;
