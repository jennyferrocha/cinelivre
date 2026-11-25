-- CineLivre: tabelas das contas. Rode UMA vez no Supabase: SQL Editor → New query → colar → Run.
-- Pode rodar de novo sem problema (usa "if not exists" e recria as regras).

-- Filmes marcados por cada pessoa. Um filme fica em uma lista por vez (chave: pessoa + filme).
create table if not exists public.movie_marks (
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id integer not null check (movie_id > 0),
  status text not null check (status in ('quero', 'assisti')),
  title text not null,
  year text not null default '',
  poster_path text,
  rating numeric not null default 0,
  marked_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index if not exists movie_marks_user_status_idx
  on public.movie_marks (user_id, status, marked_at desc);

-- Streamings escolhidos por cada pessoa (valem em qualquer aparelho em que ela entrar).
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  services text[] not null default '{}',
  include_free boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Segurança (RLS): cada pessoa só lê e altera as próprias linhas.
alter table public.movie_marks enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "marks: ler as minhas" on public.movie_marks;
drop policy if exists "marks: criar as minhas" on public.movie_marks;
drop policy if exists "marks: alterar as minhas" on public.movie_marks;
drop policy if exists "marks: apagar as minhas" on public.movie_marks;
create policy "marks: ler as minhas" on public.movie_marks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "marks: criar as minhas" on public.movie_marks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "marks: alterar as minhas" on public.movie_marks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "marks: apagar as minhas" on public.movie_marks
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "settings: ler as minhas" on public.user_settings;
drop policy if exists "settings: criar as minhas" on public.user_settings;
drop policy if exists "settings: alterar as minhas" on public.user_settings;
drop policy if exists "settings: apagar as minhas" on public.user_settings;
create policy "settings: ler as minhas" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settings: criar as minhas" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settings: alterar as minhas" on public.user_settings
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "settings: apagar as minhas" on public.user_settings
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ===== Séries (etapa 2). Pode rodar o arquivo inteiro de novo: nada é apagado. =====

-- Nota pessoal (1 a 5 estrelas) dos filmes.
alter table public.movie_marks add column if not exists stars smallint check (stars between 1 and 5);

-- Episódios que cada pessoa marcou como assistidos (um registro por episódio).
create table if not exists public.episode_marks (
  user_id uuid not null references auth.users (id) on delete cascade,
  series_id integer not null check (series_id > 0),
  season integer not null check (season between 0 and 999),
  episode integer not null check (episode between 1 and 9999),
  watched_at timestamptz not null default now(),
  primary key (user_id, series_id, season, episode)
);

create index if not exists episode_marks_user_series_idx on public.episode_marks (user_id, series_id);

-- O que vale para a série inteira: "quero assistir", "parei de assistir", estrelas e os dados do pôster.
-- A situação (acompanhando, já assisti...) não fica aqui: é calculada pelos episódios.
create table if not exists public.series_marks (
  user_id uuid not null references auth.users (id) on delete cascade,
  series_id integer not null check (series_id > 0),
  want boolean not null default false,
  stopped boolean not null default false,
  stars smallint check (stars between 1 and 5),
  title text not null,
  year text not null default '',
  poster_path text,
  rating numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

alter table public.episode_marks enable row level security;
alter table public.series_marks enable row level security;

drop policy if exists "episodes: ler os meus" on public.episode_marks;
drop policy if exists "episodes: criar os meus" on public.episode_marks;
drop policy if exists "episodes: alterar os meus" on public.episode_marks;
drop policy if exists "episodes: apagar os meus" on public.episode_marks;
create policy "episodes: ler os meus" on public.episode_marks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "episodes: criar os meus" on public.episode_marks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "episodes: alterar os meus" on public.episode_marks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "episodes: apagar os meus" on public.episode_marks
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "series: ler as minhas" on public.series_marks;
drop policy if exists "series: criar as minhas" on public.series_marks;
drop policy if exists "series: alterar as minhas" on public.series_marks;
drop policy if exists "series: apagar as minhas" on public.series_marks;
create policy "series: ler as minhas" on public.series_marks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "series: criar as minhas" on public.series_marks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "series: alterar as minhas" on public.series_marks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "series: apagar as minhas" on public.series_marks
  for delete to authenticated using ((select auth.uid()) = user_id);
