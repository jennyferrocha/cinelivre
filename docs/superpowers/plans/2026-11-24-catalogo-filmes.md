# Catálogo de Filmes nos Streamings — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app (celular e computador) que mostra só os filmes disponíveis agora nos streamings que a pessoa assina no Brasil, com tela inicial em fileiras, filtros "o que eu assisto hoje?", busca e detalhe do filme.

**Architecture:** Next.js (App Router) com Server Components buscando dados do TMDB no servidor (a chave nunca vai para o navegador). A escolha de streamings fica num cookie no aparelho da pessoa, lido no servidor. Toda lista passa por uma verificação por filme (`/movie/{id}/watch/providers`), que também gera as etiquetas "Netflix / Prime / Grátis" dos pôsteres. É isso que garante que nunca aparece filme fora dos streamings escolhidos.

**Tech Stack:** Next.js (versão atual do `create-next-app@latest`), TypeScript, Tailwind CSS, Vitest. Publicação na Vercel.

**Spec:** `docs/superpowers/specs/2026-11-24-catalogo-filmes-design.md` (leia junto com este plano)

## Global Constraints

- Pasta do app: `catalogo-filmes/` dentro da raiz do curso. Repositório git na raiz (inclui `docs/`). `.superpowers/` vai no `.gitignore`.
- Todo pedido ao TMDB sai do servidor. Variável `TMDB_TOKEN` (Read Access Token, enviado como `Authorization: Bearer`). Nada de `NEXT_PUBLIC_` com a chave.
- Sempre `watch_region=BR` e `language=pt-BR`. Só filmes. Sem aluguel/compra: as ofertas `rent` e `buy` nunca contam.
- Atribuição obrigatória no rodapé de todas as páginas: logo do TMDB + "Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB." Na seção "Onde assistir" do detalhe: "Dados de streaming: JustWatch".
- Visual: fundo quase preto (`#111`), destaque amarelo (`#f5c518`). Nome provisório "CineLivre". Nada de nome, logo ou vermelho da Netflix.
- Interface toda em português. Layout responsivo; testar a 375px de largura sem rolagem horizontal da página (só as fileiras rolam).
- Quem acompanha é iniciante: cada tarefa termina com um **Checkpoint** (algo que ela vê no navegador) e uma explicação de 2–4 frases do conceito novo da tarefa. Poucas dependências: nada além de Next, React, Tailwind, Vitest e `@testing-library/react` (só se precisar).
- Cache dos pedidos ao TMDB: `next: { revalidate: 3600 }` em listas, `21600` em watch providers e detalhes. No máximo 10 pedidos simultâneos ao TMDB por renderização.

## Review Focus

1. **TMDB fora do ar ou `TMDB_TOKEN` ausente/errado:** a pessoa vê uma página amigável ("Não conseguimos carregar os filmes agora. Tente de novo em instantes."), nunca uma tela de erro técnica. Testes na Tarefa 2 e `error.tsx` na Tarefa 6.
2. **Cookie de seleção corrompido, antigo ou com serviços que não existem mais:** é tratado como "sem seleção" (vai para `/streamings`) ou os serviços desconhecidos são ignorados. Nunca quebra. Teste na Tarefa 4.
3. **Filme sem pôster/backdrop ou sem sinopse em pt-BR:** pôster vira um bloco com o título; sem backdrop, o destaque usa outro filme; sinopse cai para inglês. Testes nas Tarefas 2, 6 e 7.
4. **Seleção só com "grátis" (nenhum streaming pago), ou um streaming pago com grátis desligado:** os parâmetros do discover são válidos nos dois casos e a verificação por filme respeita a regra. Testes nas Tarefas 3 e 5.
5. **Busca vazia, com espaços, acentos ou símbolos (`"ação & cia"`):** busca vazia não chama o TMDB; o resto é codificado corretamente. Teste na Tarefa 9.

---

## Mapa de arquivos (tudo dentro de `catalogo-filmes/`)

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/tmdb/client.ts` | `tmdbFetch`, `TmdbError`, `imageUrl` |
| `src/lib/tmdb/types.ts` | Tipos crus das respostas do TMDB |
| `src/lib/providers/grouping.ts` | Agrupar provedores do TMDB em serviços (Netflix + Netflix com anúncios = 1) |
| `src/lib/providers/free.ts` | `FREE_PROVIDER_IDS` (serviços gratuitos no BR) |
| `src/lib/providers/availability.ts` | Em quais serviços da pessoa um filme está |
| `src/lib/providers/service.ts` | `getServiceGroups()` (busca no TMDB + agrupa) |
| `src/lib/selection.ts` | Tipo `Selection`, parse/serialize do cookie |
| `src/lib/selection-server.ts` | `getSelection()` (lê o cookie) e a server action `saveSelection` |
| `src/lib/movies/discover.ts` | `buildDiscoverParams`, `HOME_ROWS`, `discoverMovies` |
| `src/lib/movies/details.ts` | `getMovieDetails` e mapeadores puros |
| `src/lib/movies/search.ts` | `buildSearchParams`, `searchMovies` |
| `src/lib/concurrency.ts` | `mapWithConcurrency` |
| `src/components/*` | `Header`, `Footer`, `Hero`, `MovieRow`, `MovieCard`, `MovieGrid`, `ProviderPicker`, `FilterForm`, `SurpriseButton` |
| `src/app/page.tsx`, `streamings/`, `sugestoes/`, `busca/`, `filme/[id]/` | Páginas |
| `tests/**` | Testes Vitest, com fixtures em `tests/fixtures/` |

## Tipos compartilhados (definidos nas Tarefas 2–4, usados em todo lugar)

```ts
// src/lib/tmdb/types.ts
type TmdbProvider = { provider_id: number; provider_name: string; logo_path: string;
  display_priority?: number; display_priorities?: Record<string, number> };
type TmdbRegionOffers = { link?: string; flatrate?: TmdbProvider[]; free?: TmdbProvider[];
  ads?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] };
type TmdbMovieListItem = { id: number; title: string; poster_path: string | null;
  backdrop_path: string | null; vote_average: number; release_date: string; genre_ids: number[]; overview: string };

// src/lib/providers/grouping.ts
type ServiceGroup = { key: string; name: string; logoPath: string; providerIds: number[];
  isChannel: boolean; priority: number };

// src/lib/providers/availability.ts
type ServiceLabel = { key: string; name: string; free: boolean };

// src/lib/selection.ts
type Selection = { services: string[]; includeFree: boolean };   // services = ServiceGroup.key[]

// src/lib/movies/discover.ts
type DiscoverFilters = { sortBy: 'popularity.desc' | 'vote_average.desc'; genres?: number[];
  maxRuntime?: number; minRating?: number; minVotes?: number; releasedFrom?: string /* YYYY-MM-DD */;
  releasedTo?: string };
type MovieCard = { id: number; title: string; year: string; posterUrl: string | null;
  backdropUrl: string | null; rating: number; genreIds: number[]; services: ServiceLabel[] };
```

---

### Task 1: Projeto, git e testes funcionando

**Files:**
- Create: `.gitignore` (raiz), `catalogo-filmes/` (via create-next-app), `catalogo-filmes/vitest.config.ts`, `catalogo-filmes/.env.example`, `catalogo-filmes/README.md`
- Test: `catalogo-filmes/tests/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` (Vitest, ambiente `node`, alias `@/` → `src/`), `npm run dev`.

- [ ] **Step 1:** `git init` na raiz. `.gitignore` da raiz com `.superpowers/`, `node_modules/`, `.env*.local`.
- [ ] **Step 2:** Na raiz, rode `npx create-next-app@latest catalogo-filmes --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` e aceite os padrões que não foram citados.
- [ ] **Step 3:** `npm i -D vitest` em `catalogo-filmes/`. Crie `vitest.config.ts` com o alias `@` e o script `"test": "vitest run"`.
- [ ] **Step 4:** Escreva `tests/smoke.test.ts`: `expect(1 + 1).toBe(2)`. Rode `npm test` e espere PASS (1 teste).
- [ ] **Step 5:** `.env.example` com `TMDB_TOKEN=cole_aqui_o_read_access_token`. **Ação da autora:** criar conta em themoviedb.org → Configurações → API → copiar o "API Read Access Token" para `catalogo-filmes/.env.local`. Explique o que é uma variável de ambiente e por que esse arquivo não vai para o git.
- [ ] **Step 6:** README com 3 seções curtas: "Rodar no computador" (`npm install`, `.env.local`, `npm run dev`), "Testes" (`npm test`) e "Publicar" (preenchido na Tarefa 10).
- [ ] **Step 7:** **Checkpoint:** `npm run dev` e abrir http://localhost:3000, mostrando a página padrão do Next.
- [ ] **Step 8:** Commit: `chore: cria projeto Next.js com Vitest` (inclui `docs/`).

### Task 2: Cliente do TMDB

**Files:**
- Create: `src/lib/tmdb/client.ts`, `src/lib/tmdb/types.ts`
- Test: `tests/tmdb/client.test.ts`

**Interfaces:**
- Produces: `tmdbFetch<T>(path: string, params?: Record<string, string | number | undefined>, revalidate?: number): Promise<T>`, `class TmdbError extends Error { status: number }`, `imageUrl(path: string | null, size: 'w342' | 'w780' | 'w1280' | 'original'): string | null`, mais os tipos crus.

- [ ] **Step 1: Testes que falham** (mock de `global.fetch` com `vi.fn`):
```ts
it('envia Bearer, base url, language pt-BR e ignora params undefined', async () => {
  // TMDB_TOKEN='abc'; tmdbFetch('/discover/movie', { page: 2, x: undefined })
  // url === 'https://api.themoviedb.org/3/discover/movie?language=pt-BR&page=2'
  // headers.Authorization === 'Bearer abc'; init.next.revalidate === 3600
});
it('lança TmdbError com status quando a resposta não é ok', ...);        // fetch → 401 → rejects TmdbError status 401
it('lança TmdbError(500) quando TMDB_TOKEN não existe, sem chamar fetch', ...);
it('lança TmdbError(503) quando fetch rejeita (rede)', ...);
it('imageUrl monta url e devolve null sem caminho', () => {
  expect(imageUrl('/a.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/a.jpg');
  expect(imageUrl(null, 'w342')).toBeNull();
});
```
- [ ] **Step 2:** `npm test` e espere FAIL (módulo não existe).
- [ ] **Step 3:** Implemente em `client.ts` com `import 'server-only'` no topo (`npm i server-only`; no Vitest, crie um alias do pacote para um arquivo vazio). O parâmetro `language=pt-BR` vem primeiro e pode ser sobrescrito por `params.language`. O padrão de `revalidate` é 3600.
- [ ] **Step 4:** `npm test` e espere PASS.
- [ ] **Step 5:** **Checkpoint:** página temporária `src/app/teste/page.tsx` que mostra os títulos de `tmdbFetch('/movie/popular')`. Ver os títulos em português no navegador e depois apagar a página. Explique "isto rodou no servidor; abra o DevTools → Rede e veja que a chave não aparece".
- [ ] **Step 6:** Commit: `feat: cliente do TMDB no servidor`.

### Task 3: Agrupamento de provedores e disponibilidade

**Files:**
- Create: `src/lib/providers/grouping.ts`, `src/lib/providers/availability.ts`, `src/lib/providers/free.ts`, `src/lib/providers/service.ts`
- Test: `tests/providers/grouping.test.ts`, `tests/providers/availability.test.ts`, `tests/fixtures/providers-br.json`

**Interfaces:**
- Consumes: `tmdbFetch`, `TmdbProvider`, `TmdbRegionOffers`
- Produces: `baseServiceName(name: string): string`, `groupProviders(raw: TmdbProvider[]): ServiceGroup[]` (ordenado por `priority`), `FREE_PROVIDER_IDS: number[]`, `availableServices(offers: TmdbRegionOffers | undefined, selection: Selection, groups: ServiceGroup[]): ServiceLabel[]`, `getServiceGroups(): Promise<ServiceGroup[]>` (busca `/watch/providers/movie?watch_region=BR`, `revalidate` 86400). `Selection` é importado de `src/lib/selection.ts`; crie só o tipo agora, e a Tarefa 4 completa o arquivo.

Regras (spec §6): plano com anúncios entra no mesmo serviço; canal (`/channel/i` no nome) é um grupo separado com `isChannel: true`; "grátis" conta qualquer provedor que esteja em `free` ou `ads`; `rent`/`buy` nunca contam.

- [ ] **Step 1:** Grave `tests/fixtures/providers-br.json` a partir da resposta real de `/watch/providers/movie?watch_region=BR` (via curl com o token, campo `results`). Com ela, preencha `FREE_PROVIDER_IDS` com os IDs dos serviços gratuitos que aparecerem (por exemplo Pluto TV, Plex, Libreflix, Mercado Play). Comente o nome de cada ID.
- [ ] **Step 2: Testes que falham:**
```ts
expect(baseServiceName('Netflix Standard with Ads')).toBe('Netflix');
expect(baseServiceName('Amazon Prime Video with Ads')).toBe('Amazon Prime Video');
expect(baseServiceName('Max')).toBe('Max');
// groupProviders com Netflix(8) + Netflix Standard with Ads(1796) + Paramount+ Amazon Channel(582)
//  → grupo { key:'netflix', providerIds:[8,1796], isChannel:false }
//  → grupo { key:'paramount-amazon-channel', isChannel:true }
//  → priority = menor display_priorities.BR do grupo; resultado ordenado por priority
// availableServices:
//  'conta Netflix com anúncios quando Netflix está marcado' (offers.ads=[1796]) → [{key:'netflix',free:false}]
//  'não conta aluguel/compra' (offers.rent=[8]) → []
//  'não conta canal se só o serviço principal está marcado' (flatrate=[582], services=['amazon-prime-video']) → []
//  'grátis ligado conta Pluto em free' → [{ name:'Pluto TV', free:true }]
//  'grátis desligado ignora Pluto' → []
//  'offers undefined' → []
//  'sem duplicatas e com serviços pagos antes dos grátis'
```
- [ ] **Step 3:** `npm test` e espere FAIL.
- [ ] **Step 4:** Implemente. A `key` é o slug do `baseServiceName` (minúsculas, sem acento, só `[a-z0-9-]`). `priority` usa `display_priorities.BR ?? display_priority ?? 999`.
- [ ] **Step 5:** `npm test` e espere PASS.
- [ ] **Step 6:** Commit: `feat: agrupa provedores e verifica disponibilidade`.

### Task 4: Seleção de streamings (cookie) e tela `/streamings`

**Files:**
- Create: `src/lib/selection.ts`, `src/lib/selection-server.ts`, `src/components/ProviderPicker.tsx`, `src/app/streamings/page.tsx`
- Test: `tests/selection.test.ts`

**Interfaces:**
- Consumes: `getServiceGroups`, `ServiceGroup`
- Produces: `SELECTION_COOKIE = 'cinelivre-selecao'`, `parseSelection(raw: string | undefined, validKeys?: string[]): Selection | null`, `serializeSelection(s: Selection): string`, `getSelection(): Promise<Selection | null>` (server), `saveSelection(formData: FormData)` (server action: grava o cookie por 1 ano, `sameSite: 'lax'`, e redireciona para `/`).

**Decisão do plano (desvio pequeno da spec):** a seleção fica num **cookie** em vez de no localStorage. Continua guardada só no aparelho, mas assim o servidor consegue ler e montar as páginas já filtradas. Ela fica isolada nesses dois arquivos para a etapa 2 (login).

- [ ] **Step 1: Testes que falham:**
```ts
expect(parseSelection(serializeSelection({ services: ['netflix'], includeFree: true })))
  .toEqual({ services: ['netflix'], includeFree: true });
expect(parseSelection(undefined)).toBeNull();
expect(parseSelection('lixo{')).toBeNull();
expect(parseSelection('{"services":"netflix"}')).toBeNull();
expect(parseSelection(serializeSelection({ services: ['netflix','sumiu'], includeFree: false }), ['netflix']))
  .toEqual({ services: ['netflix'], includeFree: false });
expect(parseSelection(serializeSelection({ services: [], includeFree: false }))).toBeNull(); // nada escolhido = sem seleção
expect(parseSelection(serializeSelection({ services: [], includeFree: true })))
  .toEqual({ services: [], includeFree: true });
```
- [ ] **Step 2:** `npm test` e espere FAIL. **Step 3:** implemente. **Step 4:** `npm test` e espere PASS.
- [ ] **Step 5:** Página `/streamings`: título "Quais streamings você assina?", texto "Dá para mudar depois em ⚙.", grade com os 9 primeiros grupos sem `isChannel` (com logo), um botão "+ outros" que mostra o resto (incluindo os canais), a caixa "Incluir também filmes grátis (com anúncios)" marcada por padrão e o botão "Começar". Se a pessoa já tem seleção, a página vem pré-marcada. Se enviar sem nada marcado e com grátis desligado, aparece "Escolha pelo menos um streaming ou inclua os grátis." (validação no servidor; a página é exibida de novo com a mensagem).
- [ ] **Step 6:** **Checkpoint:** abrir `/streamings`, marcar dois serviços e clicar em Começar. No DevTools → Aplicativo → Cookies, ver o cookie `cinelivre-selecao`. Explique cookie × localStorage.
- [ ] **Step 7:** Commit: `feat: escolha de streamings salva no aparelho`.

### Task 5: Busca de listas com verificação por filme

**Files:**
- Create: `src/lib/movies/discover.ts`, `src/lib/concurrency.ts`
- Test: `tests/movies/discover.test.ts`, `tests/concurrency.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `imageUrl`, `availableServices`, `FREE_PROVIDER_IDS`, `ServiceGroup`, `Selection`
- Produces:
  - `buildDiscoverParams(selection: Selection, groups: ServiceGroup[], filters: DiscoverFilters, page: number): Record<string, string | number>`
  - `mapWithConcurrency<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]>` (mantém a ordem)
  - `toMovieCard(item: TmdbMovieListItem, services: ServiceLabel[]): MovieCard`
  - `discoverMovies(selection, groups, filters, opts?: { pages?: number }): Promise<MovieCard[]>`: busca `pages` páginas (padrão 1), pega `/movie/{id}/watch/providers` de cada filme (limite 10, revalidate 21600), descarta os que ficam com `services` vazio e remove duplicatas por id
  - `HOME_ROWS: { id: string; title: string; filters: (today: Date) => DiscoverFilters }[]` na ordem: `em-alta` "Em alta esta semana" (popularity.desc); `bem-avaliados` "Bem avaliados" (vote_average.desc, minVotes 300); `lancamentos` "Lançamentos recentes" (popularity.desc, releasedFrom = hoje − 365 dias, releasedTo = hoje); e gêneros com popularity.desc: Comédia 35, Ação 28, Terror 27, Romance 10749, Animação 16 (títulos com esses nomes).

- [ ] **Step 1: Testes que falham:**
```ts
// buildDiscoverParams
// seleção netflix([8,1796]) + max([1899]), includeFree false, popularity:
//   watch_region 'BR', with_watch_providers '8|1796|1899', with_watch_monetization_types 'flatrate|ads',
//   sort_by 'popularity.desc', include_adult 'false', page 1
// includeFree true → with_watch_providers inclui FREE_PROVIDER_IDS; monetization 'flatrate|free|ads'
// só grátis (services []) → with_watch_providers = só FREE_PROVIDER_IDS
// filtros → with_genres '35|10749' (OR), with_runtime.lte 120, vote_average.gte 7,
//           vote_count.gte 300, primary_release_date.gte '2015-01-01'
// minRating definido sem minVotes → vote_count.gte 50 (evita nota alta com poucos votos)
// HOME_ROWS lancamentos com today=2026-11-24 → releasedFrom '2025-11-24', releasedTo '2026-11-24'
// toMovieCard: year = '2021' de '2021-05-02'; '' quando release_date vazio; posterUrl null sem poster_path
// discoverMovies (fetch mockado): filme sem serviço da pessoa é descartado; filme com serviço recebe as etiquetas
// mapWithConcurrency: nunca mais que `limit` em paralelo; mantém a ordem
```
- [ ] **Step 2:** `npm test` e espere FAIL. **Step 3:** implemente. **Step 4:** `npm test` e espere PASS.
- [ ] **Step 5:** Commit: `feat: listas do discover filtradas pelos streamings da pessoa`.

### Task 6: Tela inicial (layout A)

**Files:**
- Create: `src/components/Header.tsx`, `Footer.tsx`, `Hero.tsx`, `MovieRow.tsx`, `MovieCard.tsx`, `src/app/error.tsx`, `src/app/loading.tsx`, `public/tmdb-logo.svg`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `tests/movies/hero.test.ts`

**Interfaces:**
- Consumes: `getSelection`, `getServiceGroups`, `discoverMovies`, `HOME_ROWS`, `MovieCard`
- Produces: `pickHero(movies: MovieCard[]): MovieCard | null` (o primeiro com `backdropUrl`) em `src/lib/movies/discover.ts`; os componentes `<MovieCard movie />` e `<MovieRow title movies />`, reusados nas Tarefas 8 e 9.

- [ ] **Step 1: Teste que falha:** `pickHero` pula filmes sem backdrop; devolve `null` para a lista vazia ou quando nenhum filme tem backdrop.
- [ ] **Step 2:** FAIL, implemente, PASS.
- [ ] **Step 3:** `page.tsx`: sem seleção → `redirect('/streamings')`. Busca as linhas de `HOME_ROWS` em paralelo. Uma linha vazia não aparece. Se todas vierem vazias, mostre "Não achamos filmes nos seus streamings agora." com um link para ⚙.
- [ ] **Step 4:** Componentes conforme o esboço aprovado (`.superpowers/brainstorm/*/content/tela-inicial.html`, opção A):
  - Header: "CINELIVRE" (link para `/`), lupa (link para `/busca`) e "Meus streamings ⚙" (link para `/streamings`).
  - Hero: backdrop com degradê, o texto "EM DESTAQUE · no seu streaming", título, "★ 8,1 · gênero · ano" e o botão amarelo "Ver detalhes".
  - Abaixo do hero: o botão "🎲 O que eu assisto hoje?" (link para `/sugestoes`).
  - MovieRow: rolagem horizontal com `scroll-snap`.
  - MovieCard: pôster 2:3 com a etiqueta do primeiro serviço (ou "Grátis" quando `free`), link para `/filme/{id}`. Sem pôster, mostra um bloco cinza com o título.
  - Footer: logo do TMDB e o texto de atribuição exato (Global Constraints).
- [ ] **Step 5:** `error.tsx` com o texto da Review Focus nº 1 e o botão "Tentar de novo" (`reset()`). `loading.tsx` com fileiras em esqueleto. Configure `images.remotePatterns` para `image.tmdb.org` em `next.config` e use `next/image`.
- [ ] **Step 6:** **Checkpoint:** abrir `/` no computador e no modo celular do DevTools (375px). Conferir que as etiquetas batem com os streamings escolhidos. Mudar o `TMDB_TOKEN` para um valor errado, ver a página de erro amigável e depois voltar o token certo.
- [ ] **Step 7:** Commit: `feat: tela inicial com destaque e fileiras`.

### Task 7: Detalhe do filme

**Files:**
- Create: `src/lib/movies/details.ts`, `src/app/filme/[id]/page.tsx`, `src/app/filme/[id]/not-found.tsx`
- Test: `tests/movies/details.test.ts`, `tests/fixtures/movie-details.json`

**Interfaces:**
- Consumes: `tmdbFetch`, `imageUrl`, `availableServices`, `getSelection`, `getServiceGroups`
- Produces: `brCertification(releaseDates): string | null`, `pickTrailer(videos): string | null` (YouTube key), `formatRuntime(min: number | null): string | null`, `getMovieDetails(id: number, selection: Selection | null, groups: ServiceGroup[]): Promise<MovieDetails | null>`, onde `MovieDetails = MovieCard & { overview: string; runtime: string | null; genres: string[]; certification: string | null; trailerKey: string | null; cast: string[]; allServicesBR: { name: string; logoUrl: string | null; mine: boolean }[] }`.

- [ ] **Step 1:** Grave a fixture a partir de um pedido real `/movie/{id}?append_to_response=videos,credits,release_dates,watch/providers&include_video_language=pt,en`.
- [ ] **Step 2: Testes que falham:**
```ts
// brCertification: pega iso_3166_1 'BR', primeira certification não vazia → '14'; sem BR → null
// pickTrailer: prefere type 'Trailer' site 'YouTube' em pt; senão em en; senão null
// formatRuntime(125) → '2h05'; formatRuntime(90) → '1h30'; formatRuntime(45) → '45min'; 0/null → null
// getMovieDetails: overview vazio em pt-BR → busca de novo com language 'en-US' e usa aquele overview
// getMovieDetails: TMDB 404 → null
// allServicesBR: lista flatrate+free+ads do BR (sem rent/buy), sem duplicatas, mine=true nos da pessoa
// cast: no máximo 6 nomes
```
- [ ] **Step 3:** FAIL, implemente, PASS.
- [ ] **Step 4:** Página conforme o esboço (`outras-telas.html`, cartão 3): backdrop, pôster, "Título (ano)", "★ nota · gêneros · duração · classificação", sinopse, "Onde assistir" (os da pessoa destacados em amarelo e os outros apagados, mais a linha "Dados de streaming: JustWatch"), o botão "▶ Ver trailer" (abre `https://www.youtube.com/watch?v={key}` em nova aba; não aparece se for null) e "Elenco: ...". Id não numérico ou `null` → `notFound()`. Deixe um espaço reservado (comentário) para o botão de favoritar da etapa 2.
- [ ] **Step 5:** **Checkpoint:** tocar num pôster da tela inicial e conferir o detalhe e o trailer. Abrir `/filme/999999999` e ver a página "Filme não encontrado".
- [ ] **Step 6:** Commit: `feat: página de detalhe do filme`.

### Task 8: "O que eu assisto hoje?" e "Me surpreenda"

**Files:**
- Create: `src/lib/movies/filters.ts`, `src/components/FilterForm.tsx`, `src/components/MovieGrid.tsx`, `src/components/SurpriseButton.tsx`, `src/app/sugestoes/page.tsx`
- Test: `tests/movies/filters.test.ts`

**Interfaces:**
- Consumes: `discoverMovies`, `MovieCard`, `getSelection`, `getServiceGroups`, gêneros de `/genre/movie/list` (revalidate 86400)
- Produces: `parseFilterParams(sp: Record<string, string | string[] | undefined>): DiscoverFilters`, `pickRandom<T>(items: T[], rng?: () => number): T | undefined`.

Os filtros ficam na URL (`/sugestoes?generos=35,10749&duracao=120&nota=7&desde=2015`), então dá para recarregar e compartilhar o link. Opções: duração {90: "Até 1h30", 120: "Até 2h", vazio: "Qualquer"}; nota {6, 7, 8, vazio}; época {2015, 2000, vazio: "Qualquer"} → `releasedFrom = 'AAAA-01-01'`.

- [ ] **Step 1: Testes que falham:**
```ts
expect(parseFilterParams({ generos: '35,10749', duracao: '120', nota: '7', desde: '2015' }))
  .toEqual({ sortBy: 'popularity.desc', genres: [35, 10749], maxRuntime: 120, minRating: 7, releasedFrom: '2015-01-01' });
expect(parseFilterParams({})).toEqual({ sortBy: 'popularity.desc' });
expect(parseFilterParams({ generos: 'abc,35', duracao: '-5', nota: '99', desde: 'x' }))
  .toEqual({ sortBy: 'popularity.desc', genres: [35] });          // valores inválidos são ignorados
expect(pickRandom([], () => 0)).toBeUndefined();
expect(pickRandom(['a','b','c'], () => 0.99)).toBe('c');
```
- [ ] **Step 2:** FAIL, implemente, PASS.
- [ ] **Step 3:** A página chama `discoverMovies(..., { pages: 3 })` e mostra "Mostrando N filmes nos seus streamings", a grade de pôsteres e o `SurpriseButton` ("🔀 Me surpreenda", componente cliente que recebe os ids e faz `router.push('/filme/' + id)`). Sem resultados: "Nenhum filme com esses filtros nos seus streamings. Tente tirar algum filtro." O FilterForm usa `<form method="get">` com chips de gênero (checkbox) e grupos de opções, conforme o esboço (cartão 2). Sem seleção → `redirect('/streamings')`.
- [ ] **Step 4:** **Checkpoint:** escolher Comédia + até 2h, ver os resultados, clicar em "Me surpreenda" e cair no detalhe de um deles. Recarregar a página e ver que os filtros continuam marcados.
- [ ] **Step 5:** Commit: `feat: filtros de sugestões e me surpreenda`.

### Task 9: Busca por nome

**Files:**
- Create: `src/lib/movies/search.ts`, `src/app/busca/page.tsx`
- Modify: `src/components/MovieCard.tsx` (estado "Não está nos seus streamings")
- Test: `tests/movies/search.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `toMovieCard`, `availableServices`, `mapWithConcurrency`
- Produces: `normalizeQuery(q: string | undefined): string | null` (trim; vazio → null), `searchMovies(q: string, selection: Selection | null, groups: ServiceGroup[]): Promise<MovieCard[]>` (primeira página de `/search/movie` com `include_adult=false`, verificação por filme igual à da Tarefa 5, filmes com serviço primeiro e ordem original mantida dentro de cada grupo).

- [ ] **Step 1: Testes que falham:**
```ts
expect(normalizeQuery('   ')).toBeNull();
expect(normalizeQuery(undefined)).toBeNull();
expect(normalizeQuery('  ação & cia ')).toBe('ação & cia');
// searchMovies com fetch mockado: url contém 'query=a%C3%A7%C3%A3o+%26+cia' (ou %20) e include_adult=false
// ordena: filmes com services.length>0 antes dos sem, mantendo a ordem relativa
// normalizeQuery null → página não chama tmdbFetch (teste via searchMovies não ser chamado: a página checa antes)
```
- [ ] **Step 2:** FAIL, implemente, PASS.
- [ ] **Step 3:** Página com um campo de busca (`<form method="get">`, `name="q"`, autofocus) e a grade de resultados. O MovieCard sem serviço mostra a etiqueta cinza "Não está nos seus streamings". Sem resultados: "Nenhum filme encontrado para "{q}"." Funciona mesmo sem seleção (todos os filmes aparecem como "Não está nos seus streamings").
- [ ] **Step 4:** **Checkpoint:** buscar um filme que está num dos seus streamings e um que não está, e ver as duas etiquetas.
- [ ] **Step 5:** Commit: `feat: busca por nome`.

### Task 10: Revisão final e publicação na Vercel

**Files:**
- Modify: `catalogo-filmes/README.md`, `src/app/layout.tsx` (metadata: título "CineLivre", descrição, `lang="pt-BR"`)

- [ ] **Step 1:** `npm test` e espere todos os testes PASS. `npm run build` deve terminar sem erros nem avisos de tipo. `npm run lint` deve ficar limpo.
- [ ] **Step 2:** Conferência manual a 375px e a 1280px em todas as páginas: nenhuma rolagem horizontal da página, rodapé com a atribuição em todas, contraste legível.
- [ ] **Step 3:** **Ação da autora (com orientação):** criar um repositório no GitHub e enviar o código (`git push`). Depois, criar conta na Vercel, importar o repositório com Root Directory = `catalogo-filmes`, adicionar `TMDB_TOKEN` em Environment Variables e fazer o deploy. Completar a seção "Publicar" do README com esses passos.
- [ ] **Step 4:** **Checkpoint:** abrir o link da Vercel no celular, escolher streamings e navegar pelas quatro telas.
- [ ] **Step 5:** Commit: `docs: instruções de publicação`.
