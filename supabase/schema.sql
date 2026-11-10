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
  perfil text not null check (perfil in ('admin','marketing')),
  senha_hash text not null,
  ativo boolean not null default true,
  criado timestamptz not null default now(),
  ultimo_acesso timestamptz
);

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
