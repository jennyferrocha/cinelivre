# Séries — Etapa 2 (acompanhamento) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pessoa logada marca episódios, vê o progresso e o próximo episódio, as séries mudam sozinhas de situação (Quero assistir → Acompanhando → Já assisti, ou Parei de assistir), aparecem em "Continuar assistindo" e nas abas de séries, e filmes e séries ganham estrelas de 1 a 5.

**Architecture:** Duas tabelas novas no Supabase (`episode_marks`, `series_marks`) e a coluna `stars` em `movie_marks`, todas com RLS. A situação nunca é gravada: é calculada por funções puras (`src/lib/series/progress.ts`) a partir dos episódios marcados e do "formato" da série vindo do TMDB (temporadas, último episódio exibido, se terminou). Server actions validam tudo que vem do navegador; um componente cliente na página da série muda na hora e desfaz se o servidor falhar, como os botões de filmes.

**Tech Stack:** Next.js 16 (App Router, Cache Components), React 19, Supabase (`@supabase/ssr`), TMDB, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-series-design.md` (seções "As três situações", "Estrelas", "Dados", "Minhas decisões", item 2 de "Etapas")

Caminhos relativos a `catalogo-filmes/`.

## Global Constraints

- Nunca usar a chave secreta do Supabase; só a publicável. RLS nas tabelas novas igual a `movie_marks`: `to authenticated using ((select auth.uid()) = user_id)` (select/insert/update/delete).
- Tudo que chega numa server action é conferido no servidor (ids inteiros > 0, temporada 0–999, episódio 1–9999, no máximo 2000 episódios por chamada, estrelas inteiras 1–5 ou null, snapshot com as mesmas regras de `validSnapshot`). Sessão indisponível → `"falhou"`; sem login → `"login"`.
- Funções que recebem `userId` nunca ficam em arquivo `"use server"`.
- Especiais (temporada 0) aparecem e podem ser marcados, mas **não contam** em progresso, próximo episódio, "marcar anteriores", "marcar série inteira" nem para "Já assisti".
- Episódio ainda não exibido não pode ser marcado (o botão não aparece; a action recusa episódio depois do último exibido).
- Próximo episódio = o primeiro episódio regular já exibido **depois do último marcado** (ordem temporada, episódio).
- Situações (texto exato e valor de `aba`): "Quero assistir" (`quero`), "Acompanhando" (`acompanhando`), "Já assisti" (`assisti`), "Parei de assistir" (`parei`). URL: `/?tipo=series&aba=acompanhando`.
- Textos exatos: fileira "Continuar assistindo"; progresso "Próximo: T2 E6" (com " · título" quando conhecido), "18 de 29 episódios", "Em dia · novo episódio em 12/03/2027" (ou só "Em dia" sem data), "✓ Você assistiu tudo", "Você parou de assistir"; botões "＋ Quero assistir" / "✓ Na sua lista", "Parei de assistir" / "✓ Parou de assistir", "Marcar temporada inteira", "Marcar série inteira como assistida"; confirmação "Marcar os N episódios já lançados como assistidos?" com "Sim" / "Cancelar"; aviso "Marcar também os N anteriores?" (N = 1: "Marcar também o episódio anterior?") com "Sim" / "Não"; estrelas com rótulo "Sua nota".
- Estrelas: inteiras 1–5; tocar na mesma apaga. Filme: dar estrelas a filme fora das listas ou em "Quero assistir" o põe em "Já assisti"; apagar estrelas não tira da lista. Série: estrelas não mudam a situação.
- Séries com algum episódio regular marcado ou com "parei" ficam fora das fileiras de sugestão.
- Filmes sem conta continuam funcionando como hoje; a etapa 1 continua funcionando sem login.

## Review Focus

1. **Série que ganhou episódio novo depois de "Já assisti"/"Em dia":** volta a "Acompanhando" com o novo episódio em "Continuar assistindo" (situação calculada, nunca gravada). Teste em `seriesSituation`/`seriesProgress` (Tarefa 2).
2. **Marcas que deixaram de existir no TMDB** (episódio marcado numa temporada que o TMDB renumerou, ou além do último exibido): não contam acima do total nem quebram o progresso ("30 de 29" nunca aparece). Teste em `seriesProgress` (Tarefa 2).
3. **Dados forjados vindos do navegador** (id negativo, temporada 5000, 10 mil episódios, estrelas 7 ou 2.5, título com 1000 caracteres): a action devolve `"falhou"` sem gravar. Teste em `validEpisodes`/`validStars`/`validSeriesSnapshot` (Tarefa 3).
4. **Dois toques rápidos / falha de rede ao marcar episódio:** o círculo volta ao estado anterior e aparece "Não foi possível salvar. Tente de novo."; o segundo toque no mesmo episódio enquanto salva é ignorado. Teste em `runEpisodeChange` (Tarefa 5).
5. **TMDB fora do ar ao abrir as abas de séries:** a lista aparece mesmo assim (série com episódios → "Acompanhando"), sem página de erro. Teste em `situationWithoutShape` (Tarefa 2) + conferência na Tarefa 6.

---

### Task 1: Banco (tabelas novas e estrelas) — PARA no checkpoint da autora

**Files:**
- Modify: `supabase/schema.sql`, `tests-integration/rls.test.ts`

**Interfaces:**
- Produces (tabelas):
  - `episode_marks(user_id uuid → auth.users on delete cascade, series_id int > 0, season int 0–999, episode int 1–9999, watched_at timestamptz default now(), PK (user_id, series_id, season, episode))`, índice `(user_id, series_id)`.
  - `series_marks(user_id, series_id int > 0, want boolean default false, stopped boolean default false, stars smallint null check 1–5, title text not null, year text default '', poster_path text, rating numeric default 0, updated_at timestamptz default now(), PK (user_id, series_id))`.
  - `movie_marks.stars smallint null check (stars between 1 and 5)` via `alter table … add column if not exists`.

- [ ] **Step 1:** Acrescente ao `rls.test.ts` (mesmo formato dos casos existentes): a dona insere/lê uma linha em `episode_marks` e em `series_marks` e grava `stars = 4` em `movie_marks`; outra conta não lê, não altera, não apaga e não cria linhas em nome da dona nas duas tabelas novas; `stars = 6` é recusado pelo banco. Limpeza no `afterAll`.
- [ ] **Step 2:** Escreva as tabelas, índices, `enable row level security` e as 4 políticas por tabela no `schema.sql` (script continua podendo rodar de novo: `if not exists` / `drop policy if exists`).
- [ ] **Step 3: CHECKPOINT — parar e pedir à autora** para rodar o `schema.sql` no SQL Editor do Supabase. Só seguir depois que ela confirmar.
- [ ] **Step 4:** `npm run test:seguranca` → PASS (contas `teste+rls…@example.com` criadas: avisar a autora para apagá-las no fim).
- [ ] **Step 5:** Commit `feat: tabelas de episódios, séries e estrelas`.

### Task 2: Regras de progresso e situação (funções puras)

**Files:**
- Create: `src/lib/series/progress.ts` (sem `server-only`; usado no navegador também)
- Modify: `src/lib/series/details.ts`, `src/lib/tmdb/types.ts`
- Test: `tests/series/progress.test.ts`

**Interfaces:**
- Produces (em `progress.ts`):
  - `type EpisodeRef = { season: number; episode: number }`
  - `type SeriesShape = { seasons: { number: number; episodeCount: number }[]; lastAired: EpisodeRef | null; finished: boolean; nextAirDate: string | null }` (só temporadas regulares em `seasons`)
  - `type SeriesSituation = "quero" | "acompanhando" | "assisti" | "parei"`
  - `type Progress = { watched: number; total: number; next: EpisodeRef | null }`
  - `airedEpisodes(shape: SeriesShape): EpisodeRef[]` (regulares, em ordem, até `lastAired`)
  - `seriesProgress(shape: SeriesShape, watched: EpisodeRef[]): Progress` (`watched` conta só os regulares que estão em `airedEpisodes`)
  - `seriesSituation(flags: { want: boolean; stopped: boolean }, shape: SeriesShape, watched: EpisodeRef[]): SeriesSituation | null`
  - `situationWithoutShape(flags, watched: EpisodeRef[]): SeriesSituation | null` (sem TMDB: parei se stopped; acompanhando se tem episódio regular; quero se want; senão null)
  - `previousUnwatched(shape: SeriesShape, watched: EpisodeRef[], target: EpisodeRef): EpisodeRef[]`
  - `progressLabel(p: Progress, situation: SeriesSituation | null, shape: SeriesShape, nextTitle?: string): string`
  - `episodeKey(e: EpisodeRef): string` → `"2:6"`
- Produces (em `details.ts`): `SeriesDetails` ganha `shape: SeriesShape`; `getSeriesShape(id: number): Promise<SeriesShape | null>` (`/tv/{id}`, revalidate 21600, erro → null); `getSeriesSeasonsLabel` passa a usar `getSeriesShape`.

- [ ] **Step 1: Testes que falham** (shape de exemplo: T1 com 3, T2 com 3, `lastAired` T2E2, `finished: false`, `nextAirDate: "2027-03-12"`):
```ts
const e = (season: number, episode: number) => ({ season, episode });
expect(airedEpisodes(shape)).toEqual([e(1,1), e(1,2), e(1,3), e(2,1), e(2,2)]);
expect(airedEpisodes({ ...shape, lastAired: null })).toEqual([]);
// progresso: próximo é depois do último marcado, não o primeiro buraco
expect(seriesProgress(shape, [e(1,3)])).toEqual({ watched: 1, total: 5, next: e(2,1) });
expect(seriesProgress(shape, [])).toEqual({ watched: 0, total: 5, next: e(1,1) });
// especiais e marcas além do exibido não contam; nunca passa do total
expect(seriesProgress(shape, [e(0,1), e(2,3), e(9,1), ...airedEpisodes(shape)])).toEqual({ watched: 5, total: 5, next: null });
// situações
const none = { want: false, stopped: false };
expect(seriesSituation(none, shape, [])).toBeNull();
expect(seriesSituation({ want: true, stopped: false }, shape, [])).toBe("quero");
expect(seriesSituation({ want: true, stopped: false }, shape, [e(0,1)])).toBe("quero"); // só especial
expect(seriesSituation(none, shape, [e(1,1)])).toBe("acompanhando");
expect(seriesSituation(none, shape, airedEpisodes(shape))).toBe("acompanhando"); // em dia, série continua
expect(seriesSituation(none, { ...shape, finished: true }, airedEpisodes(shape))).toBe("assisti");
expect(seriesSituation(none, { ...shape, finished: true, lastAired: e(2,3) }, airedEpisodes(shape))).toBe("acompanhando"); // saiu episódio novo
expect(seriesSituation({ want: false, stopped: true }, shape, [e(1,1)])).toBe("parei");
expect(seriesSituation({ want: true, stopped: true }, shape, [])).toBe("quero"); // parei sem episódios não vale
expect(situationWithoutShape(none, [e(1,1)])).toBe("acompanhando");
expect(situationWithoutShape({ want: true, stopped: false }, [])).toBe("quero");
expect(situationWithoutShape({ want: false, stopped: true }, [e(1,1)])).toBe("parei");
// anteriores (atravessa temporadas, ignora os já marcados e especiais)
expect(previousUnwatched(shape, [e(1,2)], e(2,2))).toEqual([e(1,1), e(1,3), e(2,1)]);
expect(previousUnwatched(shape, [], e(1,1))).toEqual([]);
expect(previousUnwatched(shape, [], e(0,1))).toEqual([]);
// rótulos
expect(progressLabel({ watched: 1, total: 5, next: e(2,1) }, "acompanhando", shape, "O retorno")).toBe("Próximo: T2 E1 · O retorno");
expect(progressLabel({ watched: 5, total: 5, next: null }, "acompanhando", shape)).toBe("Em dia · novo episódio em 12/03/2027");
expect(progressLabel({ watched: 5, total: 5, next: null }, "acompanhando", { ...shape, nextAirDate: null })).toBe("Em dia");
expect(progressLabel({ watched: 5, total: 5, next: null }, "assisti", shape)).toBe("✓ Você assistiu tudo");
expect(progressLabel({ watched: 1, total: 5, next: e(1,2) }, "parei", shape)).toBe("Você parou de assistir");
```
E em `tests/series/details.test.ts`: `getSeriesDetails` devolve `shape` com `seasons` só regulares, `lastAired` de `last_episode_to_air`, `finished` para "Ended"/"Canceled", `nextAirDate` de `next_episode_to_air.air_date`.
- [ ] **Step 2:** `npx vitest run tests/series` → FAIL.
- [ ] **Step 3:** Implemente (`TmdbTvDetails` ganha `last_episode_to_air` e `next_episode_to_air`: `{ season_number; episode_number; air_date } | null`).
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat: regras de progresso e situação das séries`.

### Task 3: Guardar episódios, séries e estrelas (store + actions)

**Files:**
- Create: `src/lib/series/validate.ts`, `src/lib/series/store.ts`, `src/lib/series/actions.ts` (`"use server"`), `src/lib/series/load.ts`
- Modify: `src/lib/marks/rules.ts` (`Mark` ganha `stars: number | null`), `src/lib/marks/store.ts`, `src/lib/marks/actions.ts`, `src/lib/auth/rules.ts`, `src/lib/auth/pending.ts`
- Test: `tests/series/validate.test.ts`, `tests/marks/stars.test.ts`, `tests/auth/rules.test.ts`

**Interfaces:**
- Consumes: `EpisodeRef`, `airedEpisodes`, `getSeriesShape`, `getSessionState`.
- Produces:
  - `validate.ts`: `type SeriesSnapshot = { seriesId: number; title: string; year: string; posterPath: string | null; rating: number }`; `validSeriesSnapshot(s): boolean` (mesmas regras de `validSnapshot` de filme); `validEpisodes(list: unknown): list is EpisodeRef[]` (array de 1 a 2000, temporada inteira 0–999, episódio inteiro 1–9999, sem repetidos); `validStars(v: unknown): v is number | null`.
  - `marks/rules.ts`: `starsUpdate(current: MarkStatus | null, stars: number | null): MarkStatus | null` (estrelas dadas → "assisti"; estrelas apagadas → mantém `current`).
  - `store.ts`: `type SeriesMark = SeriesSnapshot & { want: boolean; stopped: boolean; stars: number | null; updatedAt: string }`; `type EpisodeMark = EpisodeRef & { seriesId: number; watchedAt: string }`; `getSeriesMarks(userId): Promise<{ series: SeriesMark[]; episodes: EpisodeMark[] }>` (falha → listas vazias); `getSeriesTracking(userId, seriesId): Promise<{ mark: SeriesMark | null; episodes: EpisodeRef[] }>`; `upsertSeries(userId, snapshot, patch: Partial<{ want: boolean; stopped: boolean; stars: number | null }>)` (mantém os outros campos); `addEpisodes(userId, seriesId, list)`; `removeEpisodes(userId, seriesId, list)`.
  - `actions.ts`: `type SeriesActionResult = { ok: true } | { error: "login" | "falhou" }`; `setEpisodes(series: SeriesSnapshot, episodes: EpisodeRef[], watched: boolean)` (ao marcar: recusa episódio regular fora de `airedEpisodes(await getSeriesShape(id))`, grava o snapshot e desliga `stopped`; especiais só se a temporada 0 existir — aceitar temporada 0 sem conferir data); `setSeriesFlag(series, flag: "want" | "stopped", value: boolean)`; `setSeriesStars(series, stars: number | null)`. Todas: `revalidatePath("/", "layout")`.
  - `marks/actions.ts`: `setMovieStars(movie: MarkSnapshot, stars: number | null, current: MarkStatus | null): Promise<{ status: MarkStatus | null; stars: number | null } | { error: "login" | "falhou" }>` (grava `stars` e `status = starsUpdate(current, stars)`; sem linha e estrelas null → nada a gravar).
  - `marks/store.ts`: `getMarks` lê `stars`; `saveMovieStars(userId, movie, status, stars)`.
  - `load.ts` (`server-only`): `type SeriesMarksState = { enabled: boolean; loggedIn: boolean; series: SeriesMark[]; episodes: EpisodeMark[] }`; `loadSeriesMarks(): Promise<SeriesMarksState>`; `trackedSeriesIds(state): Set<number>` (série com episódio regular marcado ou `stopped`).
  - `auth/rules.ts`: `parsePendingMark` aceita também `"s1399:quero"` → `{ kind: "tv", seriesId: 1399, status: "quero" }` e `"s1399:t2e6"` → `{ kind: "tv", seriesId: 1399, episode: { season: 2, episode: 6 } }`; o formato de filme continua igual (`{ movieId, status }`).
  - `auth/pending.ts`: aplica as pendências de série (busca `getSeriesDetails`, `upsertSeries` com `want: true`, ou `addEpisodes` se o episódio estiver em `airedEpisodes`).

- [ ] **Step 1: Testes que falham:**
```ts
// validate
expect(validEpisodes([{ season: 1, episode: 1 }])).toBe(true);
for (const bad of [[], "x", [{ season: -1, episode: 1 }], [{ season: 1000, episode: 1 }], [{ season: 1, episode: 0 }],
  [{ season: 1.5, episode: 1 }], [{ season: 1, episode: 1 }, { season: 1, episode: 1 }],
  Array.from({ length: 2001 }, (_, i) => ({ season: 1, episode: i + 1 }))]) expect(validEpisodes(bad)).toBe(false);
for (const ok of [1, 5, null]) expect(validStars(ok)).toBe(true);
for (const bad of [0, 6, 2.5, "3", undefined]) expect(validStars(bad)).toBe(false);
expect(validSeriesSnapshot({ seriesId: 1, title: "X", year: "2020", posterPath: "/a.jpg", rating: 8 })).toBe(true);
for (const bad of [{ seriesId: -1 }, { title: "" }, { title: "x".repeat(301) }, { year: "20" }, { posterPath: "http://x" }, { rating: 11 }])
  expect(validSeriesSnapshot({ seriesId: 1, title: "X", year: "2020", posterPath: null, rating: 8, ...bad })).toBe(false);
// estrelas de filme
expect(starsUpdate(null, 4)).toBe("assisti"); expect(starsUpdate("quero", 4)).toBe("assisti");
expect(starsUpdate("assisti", null)).toBe("assisti"); expect(starsUpdate("quero", null)).toBe("quero"); expect(starsUpdate(null, null)).toBeNull();
// pendências
expect(parsePendingMark("s1399:quero")).toEqual({ kind: "tv", seriesId: 1399, status: "quero" });
expect(parsePendingMark("s1399:t2e6")).toEqual({ kind: "tv", seriesId: 1399, episode: { season: 2, episode: 6 } });
for (const bad of ["s0:quero", "s1:assisti", "s1:t2", "s1:t1000e1", "s1:t1e0", "sx:quero"]) expect(parsePendingMark(bad)).toBeNull();
expect(parsePendingMark("603:quero")).toEqual({ movieId: 603, status: "quero" }); // filme igual a antes
```
- [ ] **Step 2:** `npx vitest run` → FAIL nos novos.
- [ ] **Step 3:** Implemente. As actions seguem `toggleMark`: valida → `getSessionState` (indisponível → `"falhou"`, sem usuário → `"login"`) → grava em try/catch → `revalidatePath`.
- [ ] **Step 4:** `npx vitest run`, `npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat: guardar episódios, séries e estrelas`.

### Task 4: Estrelas (componente, página do filme e aba "Já assisti")

**Files:**
- Create: `src/components/StarRating.tsx` (cliente), `src/lib/stars-flow.ts`
- Modify: `src/app/filme/[id]/page.tsx`, `src/components/MovieCard.tsx`, `src/components/MarkedList.tsx`, `src/lib/marks/rules.ts` (`marksToCards` leva `stars`), `src/lib/movies/discover.ts` (`MovieCard` ganha `stars?: number | null`)
- Test: `tests/stars-flow.test.ts`

**Interfaces:**
- Consumes: `setMovieStars`, `setSeriesStars`, `useMarks`.
- Produces: `StarRating({ value: number | null; onChange: (next: number | null) => Promise<boolean>; loginHref?: string })` — 5 botões com `aria-label="Dar N estrela(s)"`, `aria-pressed`; rótulo "Sua nota"; deslogada: as estrelas são links para `loginHref`. `nextStars(current: number | null, clicked: number): number | null` (mesma → null) em `stars-flow.ts`. `runStarsChange(current, clicked, deps: { save: (n: number | null) => Promise<boolean>; set: (n: number | null) => void; onError: () => void; busy: { value: boolean } })`.

- [ ] **Step 1: Testes que falham:** `nextStars(null, 3) === 3`, `nextStars(3, 3) === null`, `nextStars(3, 5) === 5`; `runStarsChange` muda na hora, desfaz e chama `onError` quando `save` devolve false ou lança; segundo toque com `busy.value = true` é ignorado.
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** Página do filme: `StarRating` abaixo do `MarkToggle` (só com contas ligadas), estado inicial das marcações da pessoa; ao dar estrelas, `marks.setStatus(id, "assisti")` para os botões mudarem juntos. Aba "Já assisti" de filmes: `MovieCard` mostra "★★★★☆" (`aria-label="Sua nota: 4 de 5"`) abaixo do ano quando `stars` existe.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint` → PASS. Navegador (logada): dar 4 estrelas a um filme fora das listas → vai para "Já assisti" com ★★★★☆; tocar de novo na 4ª apaga e o filme continua em "Já assisti".
- [ ] **Step 5:** Commit `feat: estrelas para filmes`.

### Task 5: Página da série com acompanhamento

**Files:**
- Create: `src/components/SeriesTracker.tsx` (cliente), `src/lib/series/episode-flow.ts`
- Modify: `src/app/serie/[id]/page.tsx`, `src/components/EpisodeList.tsx`, `src/lib/series/details.ts` (`pickSeason` ganha `preferred?: number`)
- Test: `tests/series/episode-flow.test.ts`, `tests/series/details.test.ts`

**Interfaces:**
- Consumes: `progress.ts` inteiro, `setEpisodes`, `setSeriesFlag`, `setSeriesStars`, `getSeriesTracking`, `StarRating`.
- Produces: `runEpisodeChange(list: EpisodeRef[], watched: boolean, deps: { save: (list, watched) => Promise<"ok" | "login" | "falhou">; apply: (list, watched) => void; onLogin: () => void; onError: () => void; busy: Set<string> })` (muda na hora; desfaz com `apply(list, !watched)` e chama `onError`/`onLogin` se falhar; ignora se qualquer `episodeKey` da lista estiver em `busy`). `pickSeason(raw, seasons, preferred?)`: sem `?temporada` válida, usa `preferred` se existir na lista.

- [ ] **Step 1: Testes que falham:** `runEpisodeChange` (sucesso aplica uma vez; "falhou" desfaz + onError; exceção desfaz + onError; "login" desfaz + onLogin; repetido enquanto busy é ignorado e `save` não é chamado de novo); `pickSeason(undefined, s, 2) === 2`, `pickSeason(undefined, s, 7) === 1`, `pickSeason("1", s, 2) === 1`.
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** Página: o servidor carrega `getSeriesTracking` (logada) e abre na temporada de `seriesProgress(...).next` (ou do último marcado). `SeriesTracker` recebe `series` (snapshot, shape, temporadas), episódios da temporada aberta, marcas iniciais e `loggedIn`, e mostra, com o estado otimista: botões "＋ Quero assistir"/"✓ Na sua lista" e (situação acompanhando/parei) "Parei de assistir"/"✓ Parou de assistir"; caixa de progresso com `progressLabel` e "W de T episódios" + barra; `StarRating`; "Marcar temporada inteira" (episódios exibidos da temporada aberta); "Marcar série inteira como assistida" com a confirmação; a lista de episódios com um círculo por episódio exibido (`aria-pressed`, `aria-label="Assisti: E3 · título"`); ao marcar um episódio regular com `previousUnwatched` não vazio, o aviso "Marcar também os N anteriores?" (Sim marca os anteriores; Não fecha). Deslogada: os círculos e botões são links para `/entrar?next=…&marcar=s{id}:t{s}e{e}` (ou `s{id}:quero`). Erros usam a mesma mensagem dos filmes ("Não foi possível salvar. Tente de novo.").
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint` → PASS. Navegador (logada, série em andamento): marcar T1E3 → aviso "Marcar também os 2 anteriores?" → Sim → "3 de N episódios" e "Próximo: T1 E4"; recarregar mantém; "Parei de assistir" → "Você parou de assistir"; marcar outro episódio volta a acompanhar; deslogada, tocar num círculo leva ao login e, depois de entrar, o episódio está marcado; 375px sem rolagem lateral.
- [ ] **Step 5:** Commit `feat: marcar episódios na página da série`.

### Task 6: Tela inicial de séries (Continuar assistindo, abas, sugestões)

**Files:**
- Create: `src/components/ContinueRow.tsx`, `src/components/SeriesList.tsx`, `src/lib/series/lists.ts`
- Modify: `src/lib/marks/tabs.ts`, `src/components/HomeTabs.tsx`, `src/app/page.tsx`, `tests-integration/pages.test.ts`, `README.md`
- Test: `tests/series/lists.test.ts`, `tests/marks/tabs.test.ts` (ou o arquivo de abas existente)

**Interfaces:**
- Consumes: `loadSeriesMarks`, `trackedSeriesIds`, `getSeriesShape`, `seriesSituation`, `situationWithoutShape`, `seriesProgress`, `attachSeriesServices`.
- Produces:
  - `tabs.ts`: `type SeriesTab = "para-voce" | "quero" | "acompanhando" | "assisti" | "parei"`, `SERIES_TABS` (labels das Global Constraints, `href` com `tipo=series`), `parseSeriesTab(value): SeriesTab`.
  - `lists.ts`: `type TrackedSeries = { mark: SeriesMark; situation: SeriesSituation; progress: Progress | null; lastWatchedAt: string }`; `groupTracked(state: SeriesMarksState, shapes: Map<number, SeriesShape | null>): TrackedSeries[]` (sem situação → fora); `continueWatching(list: TrackedSeries[]): TrackedSeries[]` (acompanhando com `progress.next`, mais recente primeiro, no máximo 20); `bySituation(list, s: SeriesSituation)` (mais recente primeiro); `loadTrackedSeries(state): Promise<TrackedSeries[]>` (`server-only`, `getSeriesShape` com concorrência 10, no máximo 200 séries).

- [ ] **Step 1: Testes que falham:** `parseSeriesTab("parei") === "parei"`, `parseSeriesTab("x") === "para-voce"`; `groupTracked` + `continueWatching`: série em dia fica fora de "Continuar", série com próximo entra, ordem por último episódio marcado, shape null usa `situationWithoutShape` e não entra em "Continuar"; série só com estrelas (sem want/episódios) não aparece em lista nenhuma.
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** `HomeNav` em `series` mostra `SERIES_TABS`. `page.tsx` em séries: abas de lista renderizam `SeriesList` (mesmo visual de `MarkedList`: título, deslogada "Entre para acompanhar suas séries" + Entrar, vazia "Nenhuma série aqui ainda."; pôsteres com etiqueta de streaming via `attachSeriesServices` com `keepUnavailable`, erro do TMDB → sem etiquetas; em "Já assisti" com estrelas); "Para você" logada mostra `ContinueRow` ("Continuar assistindo": pôster, título, "Próximo: T2 E6", barra W/T; leva a `/serie/{id}`) acima do filtro de nota quando não vazia; fileiras de séries com `excludeIds: trackedSeriesIds(state)`.
- [ ] **Step 4:** `tests-integration/pages.test.ts`: `/?tipo=series&aba=acompanhando` e `/?tipo=series&aba=parei` (deslogada) mostram "Entre para acompanhar suas séries". README: linha sobre acompanhar séries, abas e estrelas.
- [ ] **Step 5:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:paginas` → PASS. Navegador (logada): a série marcada na Tarefa 5 aparece em "Continuar assistindo" e na aba "Acompanhando", não nas fileiras; "Parei de assistir" a leva para a aba "Parei de assistir"; filmes continuam iguais; 375px sem rolagem lateral.
- [ ] **Step 6:** Commit `feat: continuar assistindo e abas de séries`.
