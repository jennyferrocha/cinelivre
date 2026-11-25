# Séries — Etapa 1 (séries no catálogo) — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Séries aparecem no CineLivre: botão "Filmes | Séries" na tela inicial, fileiras de séries dos streamings da pessoa, busca com filmes e séries juntos e página da série com temporadas e episódios (só para ver; marcar é a Etapa 2).

**Architecture:** O núcleo de `discover.ts` (parâmetros de streaming, conferência por título de onde assistir, completar páginas) vira genérico e ganha uma variante de TV em `src/lib/series/`. O cartão (`MovieCard`) ganha `kind?: "tv"`; com ele, o pôster leva a `/serie/{id}`, mostra a etiqueta "Série" e esconde os botões de marcar. A tela inicial lê `?tipo=series` e troca o conteúdo inteiro.

**Tech Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind 4, Vitest, TMDB.

**Spec:** `docs/superpowers/specs/2026-11-24-series-design.md` (seção "Etapas", item 1)

Todos os caminhos abaixo são relativos a `catalogo-filmes/`.

## Global Constraints

- Disponibilidade: só ofertas `flatrate`/`free`/`ads` no Brasil contam; fileiras nunca mostram série sem oferta (a busca mostra, com o texto de "fora dos streamings", como hoje com filmes).
- Sem escolha de streamings, vale `getEffectiveSelection()` ("todos os streamings") nas fileiras e na busca; a página da série usa `getSelection()` (escolha real), igual à página do filme.
- Nada muda para filmes: `/`, `/?aba=…`, `/?nota=…`, `/filme/{id}`, `/sugestoes` continuam iguais; os testes atuais continuam passando sem mudar o que verificam.
- URL: série na tela inicial = `/?tipo=series` (com nota: `/?tipo=series&nota=7`); página = `/serie/{id}`; temporada = `/serie/{id}?temporada={n}`.
- Textos exatos: botão "Filmes" / "Séries"; etiqueta "Série"; temporada "T1"… e "Especiais" (temporada 0, sempre por último); episódio futuro "Estreia DD/MM/AAAA"; sem data "Data a definir"; anos "2019–2024", "2019" (início = fim) ou "Desde 2019" (série continua); temporadas "1 temporada" / "N temporadas".
- Busca: título da página "Buscar filme ou série", campo "Nome do filme ou série", vazio "Digite o nome de um filme ou série para buscar.", sem resultado "Nada encontrado para “q”.".
- Séries de TV no discover sempre com `without_genres: "10763|10767"` (notícias e talk shows).
- Etapa 1 não grava nada: séries não têm botões de marcar nem abas de listas.

## Review Focus

1. **`?temporada=` inválida** (`abc`, `-1`, `99`, vazia): abre a temporada padrão, nunca erro. Teste em `pickSeason` (Tarefa 2).
2. **Episódio sem data ou futuro:** aparece "Data a definir"/"Estreia …" e conta como não exibido. Teste em `episodeStatus` (Tarefa 2).
3. **Série sem temporadas regulares** (só especiais, ou nenhuma): padrão = Especiais; sem nenhuma, a página diz "Ainda não há episódios." Teste em `pickSeason` (Tarefa 2).
4. **Busca devolve pessoas** (`media_type: "person"`): ficam de fora, e filmes e séries com o mesmo id não se confundem. Teste em `searchTitles` (Tarefa 3).
5. **Série que não existe** (`/serie/999999999`, `/serie/abc`): página "não encontrada" (404), igual ao filme. Teste em `getSeriesDetails` (Tarefa 2) + conferência na Tarefa 4.

---

### Task 1: Descobrir séries (núcleo genérico + TV)

**Files:**
- Modify: `src/lib/movies/discover.ts`, `src/lib/tmdb/types.ts`, `src/lib/movies/genres.ts`
- Create: `src/lib/series/discover.ts`
- Test: `tests/series/discover.test.ts` (os de `tests/movies/discover.test.ts` continuam passando sem mudança)

**Interfaces:**
- Produces:
  - `MovieCard` ganha `kind?: "tv"` (ausente = filme).
  - `providerParams(selection: Selection, groups: ServiceGroup[]): Record<string, string>` em `discover.ts` (as três chaves `watch_region`, `with_watch_providers`, `with_watch_monetization_types`), usado por `buildDiscoverParams`.
  - Em `discover.ts`, versões genéricas usadas pelas de filme e de TV:
    `attachServicesBy<T extends { id: number }>(items: T[], selection: Selection | null, groups: ServiceGroup[], how: { providersPath: (id: number) => string; toCard: (item: T, services: ServiceLabel[]) => MovieCard }, opts?: { keepUnavailable?: boolean }): Promise<MovieCard[]>` e
    `discoverBy<T extends { id: number }>(path: string, params: (page: number) => Record<string, string | number>, how: (mesmo do attach), selection, groups, opts?: { pages?: number; excludeIds?: Set<number>; minResults?: number }): Promise<MovieCard[]>`.
    `attachServices` e `discoverMovies` mantêm assinatura e comportamento, agora chamando as genéricas.
  - `TmdbTvListItem = { id; name; poster_path; backdrop_path; vote_average; first_air_date; genre_ids; overview }` em `types.ts`.
  - `src/lib/series/discover.ts`: `buildTvDiscoverParams(selection, groups, filters: DiscoverFilters, page: number)`, `toSeriesCard(item: TmdbTvListItem, services: ServiceLabel[]): MovieCard` (com `kind: "tv"`, `title = name`, `year` = 4 primeiros de `first_air_date`), `attachSeriesServices(items, selection, groups, opts?)`, `discoverSeries(selection, groups, filters, opts?)`, `SERIES_ROWS` (mesmo formato de `HOME_ROWS`).
  - `getTvGenres(): Promise<TmdbGenre[]>` em `genres.ts` (`/genre/tv/list`, 86400).

- [ ] **Step 1: Testes que falham** em `tests/series/discover.test.ts` (TMDB simulado com `vi.stubGlobal("fetch", …)`, como em `tests/movies/discover.test.ts`):
```ts
// buildTvDiscoverParams
expect(buildTvDiscoverParams(sel, groups, { sortBy: "popularity.desc" }, 2)).toMatchObject({
  watch_region: "BR", with_watch_providers: "8", sort_by: "popularity.desc", page: 2,
  without_genres: "10763|10767", include_adult: "false",
});
// datas usam first_air_date, nunca primary_release_date nem with_runtime
const p = buildTvDiscoverParams(sel, groups, { sortBy: "popularity.desc", releasedFrom: "2025-01-01", releasedTo: "2025-12-31", maxRuntime: 30 }, 1);
expect(p["first_air_date.gte"]).toBe("2025-01-01"); expect(p["first_air_date.lte"]).toBe("2025-12-31");
expect(p).not.toHaveProperty("primary_release_date.gte"); expect(p).not.toHaveProperty("with_runtime.lte");
// toSeriesCard
expect(toSeriesCard({ id: 1399, name: "GoT", first_air_date: "2011-04-17", vote_average: 8.456, ... }, []))
  .toMatchObject({ id: 1399, kind: "tv", title: "GoT", year: "2011", rating: 8.5 });
// discoverSeries: confere /tv/{id}/watch/providers (não /movie/) e descarta série sem oferta flatrate/free/ads
// (fixture: série 1 com flatrate Netflix, série 2 só com "rent") → ids [1]
```
- [ ] **Step 2:** `npm test -- tests/series` → FAIL (módulo não existe).
- [ ] **Step 3:** Implemente. `SERIES_ROWS` (ids e títulos exatos): `em-alta` "Em alta esta semana" (popularity), `bem-avaliadas` "Bem avaliadas" (vote_average.desc, minVotes 300), `estreias` "Estreias recentes" (últimos 365 dias por `first_air_date`), e gêneros `drama` "Drama" 18, `comedia` "Comédia" 35, `crime` "Crime" 80, `ficcao` "Ficção e fantasia" 10765, `animacao` "Animação" 16.
- [ ] **Step 4:** `npm test` → PASS (inclusive todos os testes antigos de filmes).
- [ ] **Step 5:** Commit `feat: descobrir séries nos streamings`.

### Task 2: Dados da série e das temporadas

**Files:**
- Create: `src/lib/series/details.ts`
- Modify: `src/lib/movies/details.ts` (exportar `whereToWatch` recebendo as ofertas BR em vez do filme), `src/lib/tmdb/types.ts`, `src/lib/movies/logo.ts`
- Test: `tests/series/details.test.ts`

**Interfaces:**
- Consumes: `toSeriesCard`, `availableServices`, `pickTrailer`, `formatRuntime`.
- Produces (em `src/lib/series/details.ts`):
  - `type SeriesDetails = MovieCard & { years: string; seasonsLabel: string | null; genres: string[]; certification: string | null; trailerKey: string | null; cast: string[]; allServicesBR: WhereToWatch[]; seasons: SeasonSummary[] }`
  - `type SeasonSummary = { number: number; label: string /* "T1" | "Especiais" */; episodeCount: number }` — ordenadas T1, T2…, Especiais por último.
  - `type Episode = { number: number; title: string; overview: string; runtime: string | null; stillUrl: string | null; status: EpisodeStatus }`, `type EpisodeStatus = { aired: true } | { aired: false; label: string }`.
  - `formatYears(first: string | null, last: string | null, status: string): string`
  - `seasonsLabel(n: number): string | null` (0 → null)
  - `brContentRating(data: { results: { iso_3166_1: string; rating: string }[] } | undefined): string | null`
  - `episodeStatus(airDate: string | null, today: Date): EpisodeStatus`
  - `pickSeason(raw: string | string[] | undefined, seasons: SeasonSummary[]): number | null`
  - `getSeriesDetails(id: number, selection: Selection | null, groups: ServiceGroup[]): Promise<SeriesDetails | null>` (`/tv/{id}` com `append_to_response: "videos,aggregate_credits,content_ratings,watch/providers"`, `include_video_language: "pt,en"`, revalidate 21600; 404 → null; resumo vazio → o em inglês)
  - `getSeason(id: number, n: number, today: Date): Promise<Episode[] | null>` (`/tv/{id}/season/{n}`; 404 → null)
  - Em `logo.ts`: `getMovieLogo(id, kind?: "tv")` usa `/tv/{id}/images` quando `kind === "tv"`.

- [ ] **Step 1: Testes que falham:**
```ts
expect(formatYears("2011-04-17", "2019-05-19", "Ended")).toBe("2011–2019");
expect(formatYears("2020-01-01", "2020-03-01", "Canceled")).toBe("2020");
expect(formatYears("2019-07-01", "2024-01-01", "Returning Series")).toBe("Desde 2019");
expect(formatYears(null, null, "Planned")).toBe("");
expect(seasonsLabel(1)).toBe("1 temporada"); expect(seasonsLabel(4)).toBe("4 temporadas"); expect(seasonsLabel(0)).toBeNull();
const today = new Date("2026-11-24T12:00:00Z");
expect(episodeStatus("2026-11-24", today)).toEqual({ aired: true });
expect(episodeStatus("2027-03-12", today)).toEqual({ aired: false, label: "Estreia 12/03/2027" });
expect(episodeStatus(null, today)).toEqual({ aired: false, label: "Data a definir" });
const s = [{ number: 1, label: "T1", episodeCount: 8 }, { number: 2, label: "T2", episodeCount: 8 }, { number: 0, label: "Especiais", episodeCount: 3 }];
expect(pickSeason("2", s)).toBe(2); expect(pickSeason("0", s)).toBe(0);
for (const bad of [undefined, "", "abc", "-1", "99", "1.5"]) expect(pickSeason(bad, s)).toBe(1);
expect(pickSeason(undefined, [{ number: 0, label: "Especiais", episodeCount: 2 }])).toBe(0);
expect(pickSeason(undefined, [])).toBeNull();
expect(brContentRating({ results: [{ iso_3166_1: "US", rating: "TV-MA" }, { iso_3166_1: "BR", rating: "16" }] })).toBe("16");
// getSeriesDetails com TMDB simulado: 404 → null; temporadas reordenadas com Especiais no fim; label "T1";
// temporada com episode_count 0 fica de fora; allServicesBR igual à regra do filme.
// getSeason: episódio futuro vem com status { aired: false, label: "Estreia …" }; 404 → null.
```
- [ ] **Step 2:** `npm test -- tests/series` → FAIL.
- [ ] **Step 3:** Implemente. Datas comparadas em UTC (`air_date <= hoje` → exibido). Resumo e duração do episódio: `formatRuntime(runtime)`. Elenco: até 6 nomes de `aggregate_credits.cast`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: dados da série e das temporadas`.

### Task 3: Busca com filmes e séries

**Files:**
- Modify: `src/lib/movies/search.ts`, `src/app/busca/page.tsx`, `src/components/Header.tsx` (só o `aria-label`/placeholder do campo, se citar "filme")
- Test: `tests/movies/search.test.ts`

**Interfaces:**
- Consumes: `attachServices`, `attachSeriesServices`.
- Produces: `searchTitles(query: string, selection: Selection | null, groups: ServiceGroup[]): Promise<MovieCard[]>` (substitui `searchMovies` na página; `searchMovies` pode ser removida junto com seus testes, que passam a valer para `searchTitles`).

- [ ] **Step 1: Testes que falham:**
```ts
// /search/multi simulado: [{media_type:"movie", id:5, title:"A"}, {media_type:"tv", id:5, name:"B", first_air_date:"2020-01-01"}, {media_type:"person", id:9, name:"Ator"}]
// onde assistir: filme 5 → Netflix; série 5 → nada
const r = await searchTitles("x", sel, groups);
expect(r.map((c) => [c.kind ?? "movie", c.id])).toEqual([["movie", 5], ["tv", 5]]); // pessoa fora; com oferta primeiro
expect(fetchedPaths).toContain("/movie/5/watch/providers"); expect(fetchedPaths).toContain("/tv/5/watch/providers");
```
- [ ] **Step 2:** `npm test -- tests/movies/search.test.ts` → FAIL.
- [ ] **Step 3:** Implemente com `/search/multi` (`include_adult: "false"`), mantendo a ordem do TMDB dentro de "com oferta" e "sem oferta". Troque os textos da página pelos das Global Constraints.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: busca com filmes e séries`.

### Task 4: Cartão de série e página da série

**Files:**
- Create: `src/lib/titles.ts`, `src/app/serie/[id]/page.tsx`, `src/components/SeasonPicker.tsx`, `src/components/EpisodeList.tsx`
- Modify: `src/components/MovieCard.tsx`
- Test: `tests/titles.test.ts`

**Interfaces:**
- Consumes: `getSeriesDetails`, `getSeason`, `pickSeason`, `SeriesDetails`, `Episode`.
- Produces: `cardHref(card: { id: number; kind?: "tv" }): string` em `src/lib/titles.ts` (client-safe) → `/filme/{id}` ou `/serie/{id}`.

- [ ] **Step 1: Teste que falha:** `expect(cardHref({ id: 7 })).toBe("/filme/7"); expect(cardHref({ id: 7, kind: "tv" })).toBe("/serie/7");` → `npm test -- tests/titles.test.ts` FAIL; implemente; PASS.
- [ ] **Step 2:** `MovieCard`: link por `cardHref`; com `kind === "tv"`, etiqueta "Série" (canto superior direito, no lugar do botão de marcar) e sem `MarkToggle`/`WatchedBadge`.
- [ ] **Step 3:** `/serie/[id]`: mesma estrutura de `src/app/filme/[id]/page.tsx` (mesmo `parseId`, `Suspense` com esqueleto, `generateMetadata` "Nome · CineLivre" / "Série não encontrada · CineLivre", `notFound()` quando null). Linha de informações: anos · gênero · `seasonsLabel` · classificação · nota. Onde assistir e elenco como no filme. `SeasonPicker`: links "T1"… "Especiais" para `?temporada=n` (`scroll={false}`, `aria-current` na ativa, rolagem horizontal no celular). `EpisodeList`: "E{n} · título", duração, resumo em 2 linhas, imagem `w300` (adicione `"w300"` a `ImageSize`) e, se não exibido, o `label`. Temporada que falha ou vem null: "Não foi possível carregar os episódios." Sem temporadas: "Ainda não há episódios." A data de hoje vem depois de `await connection()`.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint` → PASS.
- [ ] **Step 5: Navegador (dev):** `/serie/1399` mostra GoT com T1…T8 e Especiais por último; `?temporada=3` abre T3; `?temporada=abc` abre T1; `/serie/999999999` e `/serie/abc` → 404; uma série em andamento mostra "Desde AAAA" e episódio futuro com "Estreia …"; 375px sem rolagem lateral; nenhum aviso novo no terminal do dev.
- [ ] **Step 6:** Commit `feat: página da série com temporadas e episódios`.

### Task 5: "Filmes | Séries" na tela inicial

**Files:**
- Create: `src/lib/kind.ts`, `src/components/KindSwitch.tsx`
- Modify: `src/app/page.tsx`, `src/components/HomeTabs.tsx`, `src/components/RatingFilter.tsx`, `src/components/Hero.tsx`, `tests-integration/pages.test.ts`
- Test: `tests/kind.test.ts`

**Interfaces:**
- Consumes: `SERIES_ROWS`, `discoverSeries`, `getTvGenres`, `getMovieLogo(id, "tv")`, `seasonsLabel`, `cardHref`.
- Produces também: `getSeriesSeasonsLabel(id: number): Promise<string | null>` em `src/lib/series/details.ts` (`/tv/{id}`, só `number_of_seasons` → `seasonsLabel`; erro → null), para o destaque — o equivalente de `getMovieRuntime`.
- Produces: `type HomeKind = "filmes" | "series"`, `parseKind(value: string | string[] | undefined): HomeKind`, `homeHref(kind: HomeKind, nota?: number): string` em `src/lib/kind.ts`.

- [ ] **Step 1: Testes que falham:**
```ts
expect(parseKind("series")).toBe("series");
for (const v of [undefined, "", "filmes", "SERIES", ["x"]]) expect(parseKind(v)).toBe("filmes");
expect(parseKind(["series", "x"])).toBe("series");
expect(homeHref("filmes")).toBe("/"); expect(homeHref("filmes", 7)).toBe("/?nota=7");
expect(homeHref("series")).toBe("/?tipo=series"); expect(homeHref("series", 8)).toBe("/?tipo=series&nota=8");
```
`npm test -- tests/kind.test.ts` → FAIL; implemente; PASS.
- [ ] **Step 2:** `KindSwitch` (dois links "Filmes" / "Séries", pílula como no desenho aprovado: ativo em amarelo `bg-accent`, `aria-current`). `HomeTabs` mostra `KindSwitch` acima das abas; em `series` mostra só o `KindSwitch` (abas de listas de séries são da Etapa 2). `RatingFilter` recebe `kind` e monta os links com `homeHref`. `Hero` recebe `href` (via `cardHref`) e `showSurprise` (false para séries; o botão "O que eu assisto hoje?" é só de filmes); o terceiro dado (`runtime`) recebe o `seasonsLabel` no caso de séries.
- [ ] **Step 3:** `page.tsx`: `parseKind(sp.tipo)`; em `series`, ignora `aba`, usa `SERIES_ROWS` + `discoverSeries` + `getTvGenres` com a mesma estrutura (faixa "todos os streamings", filtro de nota, "Top 10 em alta nos seus streamings", demais fileiras), sem `excludeIds`. Mensagens vazias trocam "filmes" por "séries". Filmes: código atual sem mudança de comportamento.
- [ ] **Step 4:** Em `tests-integration/pages.test.ts`, inclua `/?tipo=series`, `/?tipo=series&nota=8`, `/serie/1399`, `/serie/1399?temporada=2`, `/busca?q=breaking` esperando 200, e `/serie/999999999` esperando 404, no mesmo formato dos casos existentes.
- [ ] **Step 5:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` → PASS; com `npm run start` rodando, `npm run test:paginas` → PASS.
- [ ] **Step 6: Navegador:** `/` igual a antes (com o botão "Filmes | Séries", "Filmes" ativo); tocar "Séries" → destaque e fileiras de séries com etiqueta do serviço e "Série" no pôster, pôster leva a `/serie/{id}`; nota 8+ mantém `tipo=series`; voltar a "Filmes" mostra as abas de novo; 375px sem rolagem lateral; `/busca?q=the office` mostra filme e série.
- [ ] **Step 7:** README: em "O que dá para fazer", uma linha sobre séries. Commit `feat: filmes e séries na tela inicial`.
