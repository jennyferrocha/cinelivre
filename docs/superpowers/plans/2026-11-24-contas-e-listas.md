# CineLivre — Contas e listas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login opcional com e-mail e senha (Supabase) para marcar filmes como "Quero assistir" / "Já assisti", abas dessas listas na tela inicial, filmes já vistos fora das sugestões e streamings guardados na conta.

**Architecture:** Supabase Auth com `@supabase/ssr`: a sessão vive em cookies, é renovada no `src/proxy.ts` e lida no servidor (sempre dentro de `<Suspense>`, regra do Cache Components). Duas tabelas com RLS (`movie_marks`, `user_settings`). As marcações chegam ao navegador uma vez por página, por um contexto (`MarksProvider`), e os botões mudam na hora (otimista) chamando server actions.

**Tech Stack:** Next.js 16.4 (App Router, Cache Components), TypeScript, Tailwind 4, Vitest, `@supabase/supabase-js`, `@supabase/ssr`.

**Spec:** `docs/superpowers/specs/2026-11-24-contas-e-listas-design.md` (leia junto). Base: `docs/superpowers/specs/2026-11-24-catalogo-filmes-design.md`.

## Global Constraints

- Tudo dentro de `catalogo-filmes/`. Leia `AGENTS.md` e o guia `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md` antes da Tarefa 1.
- Dependências novas: só `@supabase/supabase-js` e `@supabase/ssr`.
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (chave pública, feita para o navegador). A `service_role` nunca aparece no código, no `.env.example` nem nos testes.
- **Sem as duas variáveis, o app funciona como hoje** (sem botões de conta). Login é opcional; nada exige conta exceto marcar.
- Toda leitura de sessão (`cookies()`/`auth.getUser()`) fica dentro de `<Suspense>`; usar `auth.getUser()` (valida no Supabase) para decidir quem é a pessoa, nunca só `getSession()`.
- RLS ligada em todas as tabelas; políticas só `auth.uid() = user_id`.
- Textos em pt-BR, exatamente: "Entrar", "Criar conta", "Sair", "E-mail ou senha incorretos", "Este e-mail já tem conta", "A senha precisa ter pelo menos 6 caracteres", "Não foi possível salvar. Tente de novo.", "Usando os streamings da sua conta.", "Entre para guardar os filmes que você quer ver", "Você ainda não marcou nenhum filme.", "＋ Quero assistir", "✓ Na sua lista", "✓ Já assisti", "✓ Você já assistiu".
- Abas: `Para você` (`/`), `Quero assistir` (`/?aba=quero`), `Já assisti` (`/?aba=assisti`).
- Cores/fontes atuais (fundo roxo em degradê, destaque `#d8c820`, Sora/Plus Jakarta Sans). 375px sem rolagem lateral.
- Quem acompanha é iniciante: cada tarefa termina com **Checkpoint** no navegador e 2–4 frases explicando o conceito novo.

## Review Focus

1. **Supabase fora do ar ou variáveis ausentes:** o app continua navegável sem conta; marcar mostra "Não foi possível salvar. Tente de novo."; nenhuma tela de erro. Testes nas Tarefas 1 e 3.
2. **`?next=` malicioso no /entrar** (`//site.com`, `https://...`, `/\\x`): depois do login a pessoa vai para `/`, nunca para outro site. Teste na Tarefa 2.
3. **Sessão expirada ao marcar:** a action devolve "precisa entrar" e o botão leva a /entrar com o filme pendente, sem erro técnico. Teste na Tarefa 3.
4. **Marcação pendente inválida** (`?marcar=abc:quero`, `123:outra`, filme inexistente no TMDB): ignorada; o login acontece normalmente. Teste na Tarefa 4.
5. **Pessoa que já viu quase tudo de uma fileira:** a fileira é completada com outra página do TMDB e uma fileira que fica vazia simplesmente não aparece. Teste na Tarefa 5.

---

## Mapa de arquivos (em `catalogo-filmes/`)

| Arquivo | Responsabilidade |
|---|---|
| `supabase/schema.sql` | Tabelas, RLS e políticas (a autora roda no SQL Editor) |
| `src/lib/supabase/config.ts` | Lê e valida as variáveis (`supabaseConfig()`) |
| `src/lib/supabase/server.ts` | `createSupabaseServer()` com cookies do Next |
| `src/proxy.ts` | Renova a sessão a cada pedido |
| `src/lib/auth/session.ts` | `getCurrentUser()` |
| `src/lib/auth/rules.ts` | Puras: `safeNext`, `authErrorMessage`, `parsePendingMark` |
| `src/lib/auth/actions.ts` | Server actions `signIn`, `signUp`, `signOut` |
| `src/app/entrar/page.tsx`, `src/components/AuthForm.tsx`, `src/components/UserMenu.tsx` | Telas e topo |
| `src/lib/marks/rules.ts` | Puras: `nextStatus`, `watchedIds`, `marksToCards` |
| `src/lib/marks/store.ts` | `getMarks`, `saveMark`, `deleteMark` (Supabase) |
| `src/lib/marks/actions.ts` | Server action `toggleMark` |
| `src/components/MarksProvider.tsx`, `MarkToggle.tsx` | Estado das marcações no navegador e botões |
| `src/lib/movies/discover.ts` | + `excludeIds` e preenchimento de fileira |
| `src/components/HomeTabs.tsx`, `src/components/MarkedList.tsx` | Abas e listas |
| `src/lib/settings/rules.ts`, `src/lib/settings/store.ts` | Streamings na conta |
| `tests-integration/rls.test.ts`, `vitest.integration.config.ts` | Teste de segurança opcional |

## Tipos compartilhados

```ts
// src/lib/marks/rules.ts
export type MarkStatus = "quero" | "assisti";
export type MarkSnapshot = { movieId: number; title: string; year: string; posterPath: string | null; rating: number };
export type Mark = MarkSnapshot & { status: MarkStatus; markedAt: string };
// src/lib/auth/session.ts
export type CurrentUser = { id: string; email: string };
```

---

### Task 1: Supabase ligado ao app (sem mudar nada visível)

**Files:**
- Create: `supabase/schema.sql`, `src/lib/supabase/config.ts`, `src/lib/supabase/server.ts`, `src/proxy.ts`, `src/lib/auth/session.ts`
- Modify: `package.json` (deps), `.env.example`, `README.md` (seção "Contas (Supabase)")
- Test: `tests/supabase/config.test.ts`, `tests/auth/session.test.ts`

**Interfaces:**
- Produces: `supabaseConfig(env?: Record<string, string | undefined>): { url: string; key: string } | null`; `createSupabaseServer(): Promise<SupabaseClient> | null` (null sem config); `getCurrentUser(): Promise<CurrentUser | null>` (null sem config, sem sessão ou se o Supabase falhar).

- [ ] **Step 1:** `npm install @supabase/supabase-js @supabase/ssr`.
- [ ] **Step 2: Testes que falham:**
```ts
expect(supabaseConfig({})).toBeNull();
expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "não é url", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" })).toBeNull();
expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" }))
  .toEqual({ url: "https://x.supabase.co", key: "k" });
// getCurrentUser (mock de @/lib/supabase/server): sem config → null; auth.getUser com erro/exceção → null;
// usuário { id: "u1", email: "a@b.c" } → { id: "u1", email: "a@b.c" }
```
- [ ] **Step 3:** FAIL → implemente → PASS. `server.ts` segue o padrão `createServerClient(url, key, { cookies: { getAll, setAll } })` do `@supabase/ssr`, com `setAll` num try/catch (Server Components não podem gravar cookie; o proxy cuida disso). `proxy.ts` cria o cliente com os cookies do `NextRequest`/`NextResponse`, chama `auth.getUser()` e devolve a resposta; sem config, só `NextResponse.next()`. Matcher exclui `_next/static`, `_next/image`, `favicon.ico` e arquivos com extensão de imagem.
- [ ] **Step 4:** `supabase/schema.sql` conforme spec §6: tabelas `movie_marks` (PK `(user_id, movie_id)`, `status` com `check (status in ('quero','assisti'))`, `rating numeric not null default 0`, `marked_at timestamptz not null default now()`, FK `auth.users on delete cascade`) e `user_settings` (PK `user_id`, `services text[] not null default '{}'`, `include_free boolean not null default true`, `updated_at timestamptz not null default now()`); `enable row level security` nas duas; políticas `select/insert/update/delete` com `using (auth.uid() = user_id)` e `with check (auth.uid() = user_id)`; índice `movie_marks (user_id, status, marked_at desc)`.
- [ ] **Step 5:** `.env.example` ganha as duas variáveis com valores de exemplo; README explica onde achar URL e chave publishable e avisa para nunca usar a `service_role`.
- [ ] **Step 6:** `npm test`, `npx tsc --noEmit`, `npm run lint` → tudo PASS.
- [ ] **Step 7: Checkpoint (ação da autora, com orientação):** rodar `supabase/schema.sql` no SQL Editor; conferir em Table Editor as duas tabelas com o cadeado de RLS; colar URL e chave no `.env.local`; reiniciar `npm run dev` e ver o app igual a antes. Conceito: o que é o proxy e por que a sessão é um cookie.
- [ ] **Step 8:** Commit `feat: supabase configurado (cliente, proxy, sessão, schema)`.

### Task 2: Entrar, criar conta e sair

**Files:**
- Create: `src/lib/auth/rules.ts`, `src/lib/auth/actions.ts`, `src/app/entrar/page.tsx`, `src/components/AuthForm.tsx`, `src/components/UserMenu.tsx`
- Modify: `src/components/Header.tsx`
- Test: `tests/auth/rules.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServer`, `getCurrentUser`
- Produces: `safeNext(next: string | string[] | undefined): string`; `authErrorMessage(error: { code?: string; message?: string }): string`; actions `signIn(prev: AuthState, form: FormData): Promise<AuthState>`, `signUp(prev, form)`, `signOut(): Promise<void>` com `AuthState = { error: string | null }`. Os campos do form: `email`, `senha`, `next`, `marcar` (este último usado na Tarefa 4).

- [ ] **Step 1: Testes que falham:**
```ts
expect(safeNext("/filme/12?x=1")).toBe("/filme/12?x=1");
expect(safeNext(["/busca", "/x"])).toBe("/busca");
for (const bad of [undefined, "", "//evil.com", "https://evil.com", "/\\evil.com", "evil", "javascript:alert(1)"])
  expect(safeNext(bad)).toBe("/");
expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos");
expect(authErrorMessage({ code: "user_already_exists" })).toBe("Este e-mail já tem conta");
expect(authErrorMessage({ code: "weak_password" })).toBe("A senha precisa ter pelo menos 6 caracteres");
expect(authErrorMessage({ code: "algo_novo" })).toBe("Não foi possível entrar agora. Tente de novo.");
```
- [ ] **Step 2:** FAIL → implemente `rules.ts` → PASS.
- [ ] **Step 3:** Actions: `signIn` usa `signInWithPassword`; `signUp` usa `signUp` (confirmação desligada no painel, então a sessão já volta); ambas validam e-mail não vazio e senha ≥ 6 antes de chamar o Supabase e, se der certo, `redirect(safeNext(next))`. Sem config do Supabase → `{ error: "Contas indisponíveis no momento." }`. `signOut` chama `auth.signOut()` e `redirect("/")`.
- [ ] **Step 4:** `/entrar?modo=criar&next=...`: título e botão "Entrar" ou "Criar conta", link que alterna o modo mantendo `next`, `useActionState` com a mensagem de erro em `role="alert"`, `autoComplete` `email`/`current-password`/`new-password`. Quem já está logado e abre /entrar vai para `safeNext(next)`.
- [ ] **Step 5:** Header: um `<Suspense fallback={<span className="w-20" />}>` com `UserMenu` (servidor). Sem config → nada; sem usuário → `LoginLink` (pequeno componente cliente em `UserMenu.tsx`) que monta `/entrar?next=` com `usePathname()` + `useSearchParams()` da página atual; com usuário → botão com ícone de perfil que abre um menu (`<details>`) com o e-mail e o botão "Sair" (form com `signOut`). A 375px o topo continua cabendo (o "Entrar" vira só ícone abaixo de `sm`).
- [ ] **Step 6: Checkpoint:** criar uma conta, sair, entrar de novo, errar a senha e ver a mensagem; ver o usuário em Authentication → Users. Conceito: server action de formulário e por que a senha nunca passa pelo nosso código guardada.
- [ ] **Step 7:** Commit `feat: entrar, criar conta e sair`.

### Task 3: Marcações no banco (sem interface ainda)

**Files:**
- Create: `src/lib/marks/rules.ts`, `src/lib/marks/store.ts`, `src/lib/marks/actions.ts`
- Test: `tests/marks/rules.test.ts`, `tests/marks/actions.test.ts`

**Interfaces:**
- Consumes: `createSupabaseServer`, `getCurrentUser`, `toMovieCard`/`MovieCard`
- Produces:
  - `nextStatus(current: MarkStatus | null, clicked: MarkStatus): MarkStatus | null` (clicar no mesmo desmarca; no outro, troca)
  - `watchedIds(marks: Mark[]): Set<number>`
  - `snapshotFromCard(card: MovieCard): MarkSnapshot` (`posterPath` = parte de `posterUrl` depois de `/w342`, ou null)
  - `marksToCards(marks: Mark[], status: MarkStatus): MovieCard[]` (só o status pedido, `markedAt` desc, `services: []`, `posterUrl` via `imageUrl(posterPath, "w342")`)
  - `getMarks(userId: string): Promise<Mark[]>`; `saveMark(userId, snapshot: MarkSnapshot, status: MarkStatus)` (upsert em `(user_id, movie_id)`, `marked_at = now()`); `deleteMark(userId, movieId)`
  - action `toggleMark(snapshot: MarkSnapshot, clicked: MarkStatus, current: MarkStatus | null): Promise<{ status: MarkStatus | null } | { error: "login" | "falhou" }>`; ao terminar, `revalidatePath("/")`

- [ ] **Step 1: Testes que falham:**
```ts
expect(nextStatus(null, "quero")).toBe("quero");
expect(nextStatus("quero", "quero")).toBeNull();
expect(nextStatus("quero", "assisti")).toBe("assisti");
expect(nextStatus("assisti", "assisti")).toBeNull();
expect(snapshotFromCard({ id: 7, title: "X", year: "2020", rating: 7.1, posterUrl: "https://image.tmdb.org/t/p/w342/abc.jpg" } as MovieCard))
  .toEqual({ movieId: 7, title: "X", year: "2020", posterPath: "/abc.jpg", rating: 7.1 });
expect(snapshotFromCard({ id: 7, title: "X", year: "", rating: 0, posterUrl: null } as MovieCard).posterPath).toBeNull();
expect([...watchedIds([m(1,"assisti"), m(2,"quero"), m(3,"assisti")])]).toEqual([1, 3]);
expect(marksToCards([m(1,"quero","2026-01-01"), m(2,"quero","2026-03-01"), m(3,"assisti")], "quero").map(c => c.id)).toEqual([2, 1]);
// toggleMark (mocks de getCurrentUser e store): sem usuário → { error: "login" };
// saveMark lança → { error: "falhou" }; (null,"quero") → saveMark chamado, { status: "quero" };
// ("quero","quero") → deleteMark chamado, { status: null }; movieId <= 0 ou não inteiro → { error: "falhou" } sem tocar no banco
```
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** Commit `feat: marcações de filmes no banco`.

### Task 4: Botões de marcar (pôster e detalhe) e marcação pendente

**Files:**
- Create: `src/components/MarksProvider.tsx`, `src/components/MarkToggle.tsx`
- Modify: `src/components/MovieCard.tsx`, `src/app/filme/[id]/page.tsx`, `src/app/page.tsx`, `src/app/sugestoes/page.tsx`, `src/app/busca/page.tsx`, `src/lib/auth/rules.ts`, `src/lib/auth/actions.ts`, `src/components/AuthForm.tsx`
- Test: `tests/auth/rules.test.ts` (+ `parsePendingMark`), `tests/auth/pending.test.ts`

**Interfaces:**
- Consumes: `toggleMark`, `getMarks`, `saveMark`, `getMovieDetails`, `nextStatus`
- Produces: `MarksProvider({ loggedIn: boolean; initial: Record<number, MarkStatus>; children })`; `MarkToggle({ movie: MarkSnapshot; variant: "card" | "detail" })`; `parsePendingMark(v: string | string[] | undefined): { movieId: number; status: MarkStatus } | null` (formato `"<id>:quero|assisti"`); `applyPendingMark(userId: string, pending): Promise<void>` em `actions.ts` (busca o filme com `getMovieDetails`; se não existir ou falhar, não faz nada).

- [ ] **Step 1: Testes que falham:**
```ts
expect(parsePendingMark("603:quero")).toEqual({ movieId: 603, status: "quero" });
expect(parsePendingMark(["603:assisti"])).toEqual({ movieId: 603, status: "assisti" });
for (const bad of [undefined, "", "abc:quero", "603:outra", "603", "-1:quero", "1.5:quero"]) expect(parsePendingMark(bad)).toBeNull();
// applyPendingMark (mocks): filme existe → saveMark(userId, snapshot do filme, status);
// getMovieDetails devolve null ou lança → saveMark não é chamado e não lança
```
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** `signIn`/`signUp` leem o campo `marcar`; depois de autenticar, `await applyPendingMark(user.id, parsePendingMark(marcar))` antes do `redirect`. `/entrar` repassa `?marcar=` para o form.
- [ ] **Step 4:** `MarksProvider` (cliente) guarda o mapa e expõe `useMark(id)` com `useOptimistic`. `MarkToggle`: sem login → `<Link href={"/entrar?next=" + encodeURIComponent(pathname+search) + "&marcar=" + id + ":" + status}>`; com login → chama `toggleMark`; `{ error: "login" }` → `router.push` para o mesmo link; `{ error: "falhou" }` → desfaz e mostra "Não foi possível salvar. Tente de novo." (`role="status"`). Variante `card`: dois botões redondos pequenos no canto superior direito do pôster (🔖 Quero assistir / ✓ Já assisti, `aria-pressed`, `aria-label` com o título), que não disparam o link do pôster (`preventDefault`), visíveis sempre no celular e no hover/foco no computador. Variante `detail`: os dois botões grandes com os textos das Global Constraints, no lugar do comentário "etapa 2" da página do filme.
- [ ] **Step 5:** Cada página com pôsteres (`/`, `/sugestoes`, `/busca`, `/filme/[id]`) busca `getCurrentUser()` e `getMarks()` **dentro do Suspense que já existe** e envolve o conteúdo em `MarksProvider`. Na busca, filme com status `assisti` mostra o selo "✓ Já assisti" sobre o pôster.
- [ ] **Step 6: Checkpoint:** sem login, tocar 🔖 num pôster → /entrar → entrar → voltar à mesma página com o filme marcado. Marcar e desmarcar na página do filme; recarregar e ver que ficou salvo. Conceito: atualização otimista.
- [ ] **Step 7:** Commit `feat: botões de quero assistir e já assisti`.

### Task 5: Esconder o que já assistiu

**Files:**
- Modify: `src/lib/movies/discover.ts`, `src/app/page.tsx`, `src/app/sugestoes/page.tsx`
- Test: `tests/movies/discover.test.ts`

**Interfaces:**
- Consumes: `watchedIds`, `getMarks`, `getCurrentUser`
- Produces: `discoverMovies(selection, groups, filters, opts?: { pages?: number; excludeIds?: Set<number>; minResults?: number })`: remove os `excludeIds` e, se sobrarem menos que `minResults` (padrão 8), busca a página seguinte, até no máximo 3 páginas extras.

- [ ] **Step 1: Testes que falham (fetch simulado como nos testes atuais):**
```ts
// página 1 com ids [1,2,3]; excludeIds {1,2}; minResults 2 → pede a página 2 ([4,5]) e devolve [3,4,5]
// excludeIds vazio → só a página 1 (1 pedido ao /discover)
// páginas 1..4 todas com filmes excluídos → para depois de 3 páginas extras e devolve []
// excludeIds remove também filme que estaria no destaque (pickHero sobre o resultado não o escolhe)
```
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** Tela inicial: com login, `excludeIds = watchedIds(marks)` em todas as fileiras (o destaque e o Top 10 saem delas). Sugestões e "Me surpreenda": o mesmo. Busca e detalhe: nada muda.
- [ ] **Step 4: Checkpoint:** marcar "Já assisti" no filme do destaque, voltar ao início e ver outro filme no lugar; ver que ele ainda aparece na busca com o selo.
- [ ] **Step 5:** Commit `feat: filmes já assistidos saem das sugestões`.

### Task 6: Abas "Quero assistir" e "Já assisti"

**Files:**
- Create: `src/components/HomeTabs.tsx`, `src/components/MarkedList.tsx`, `src/lib/marks/tabs.ts`
- Modify: `src/app/page.tsx`
- Test: `tests/marks/tabs.test.ts`

**Interfaces:**
- Consumes: `marksToCards`, `attachServices(items, selection, groups, { keepUnavailable: true })`, `MovieGrid`
- Produces: `type HomeTab = "para-voce" | "quero" | "assisti"`; `parseTab(v): HomeTab` (inválido → `"para-voce"`); `HomeTabs({ active: HomeTab })` (links `/`, `/?aba=quero`, `/?aba=assisti`, `aria-current="page"`).

- [ ] **Step 1: Testes que falham:**
```ts
expect(parseTab(undefined)).toBe("para-voce");
expect(parseTab("quero")).toBe("quero");
expect(parseTab(["assisti"])).toBe("assisti");
expect(parseTab("xyz")).toBe("para-voce");
```
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** `HomeTabs` logo abaixo do topo, fora do Suspense (não lê sessão), estilo de abas sublinhadas em amarelo. Na aba de lista, a tela não mostra o destaque nem as fileiras: mostra título, `MarkedList` (servidor, dentro de Suspense) com `MovieGrid` dos `marksToCards`, cujas etiquetas de streaming vêm de `attachServices` com `keepUnavailable: true` (os fora dos streamings mostram "Não está nos seus streamings"). Sem login: "Entre para guardar os filmes que você quer ver" + botão "Entrar" (`/entrar?next=/?aba=...`). Lista vazia: "Você ainda não marcou nenhum filme." + "Toque em 🔖 ou ✓ em qualquer pôster."
- [ ] **Step 4: Checkpoint:** marcar três filmes, abrir cada aba, recarregar `/?aba=quero` e ver a aba certa; ver um filme fora dos seus streamings com a etiqueta. Conceito: estado na URL.
- [ ] **Step 5:** Commit `feat: abas quero assistir e já assisti`.

### Task 7: Streamings na conta

**Files:**
- Create: `src/lib/settings/rules.ts`, `src/lib/settings/store.ts`
- Modify: `src/lib/selection-server.ts`, `src/lib/selection-actions.ts`, `src/lib/auth/actions.ts`, `src/app/layout.tsx` (aviso)
- Test: `tests/settings/rules.test.ts`

**Interfaces:**
- Consumes: `Selection`, `parseSelection`, `getCurrentUser`
- Produces: `reconcileOnLogin(account: Selection | null, device: Selection | null): { selection: Selection | null; copyToAccount: boolean; notice: boolean }`; `getAccountSelection(userId): Promise<Selection | null>`; `saveAccountSelection(userId, s: Selection): Promise<void>`. `getSelection()` passa a devolver a da conta quando há usuário e ela existe (senão, o cookie). Aviso via cookie de uso único `cinelivre-aviso=streamings-da-conta`.

- [ ] **Step 1: Testes que falham:**
```ts
const A = { services: ["netflix"], includeFree: true }, B = { services: ["hbo-max"], includeFree: false };
expect(reconcileOnLogin(A, B)).toEqual({ selection: A, copyToAccount: false, notice: true });
expect(reconcileOnLogin(A, { ...A, services: ["netflix"] })).toEqual({ selection: A, copyToAccount: false, notice: false }); // iguais (ordem não importa)
expect(reconcileOnLogin(null, B)).toEqual({ selection: B, copyToAccount: true, notice: false });
expect(reconcileOnLogin(A, null)).toEqual({ selection: A, copyToAccount: false, notice: false });
expect(reconcileOnLogin(null, null)).toEqual({ selection: null, copyToAccount: false, notice: false });
```
- [ ] **Step 2:** FAIL → implemente → PASS.
- [ ] **Step 3:** No login (`signIn`/`signUp`): aplica `reconcileOnLogin`, grava o cookie de seleção com o resultado, copia para a conta se `copyToAccount`, grava o cookie de aviso se `notice`. `saveSelection` com login também grava na conta. `getSelection()` lê a conta quando logada (uma consulta; falha do Supabase → cai no cookie). O layout mostra o aviso "Usando os streamings da sua conta." uma vez (componente que lê e apaga o cookie, dentro de Suspense) e some sozinho após alguns segundos.
- [ ] **Step 4: Checkpoint:** entrar no navegador normal com Netflix; abrir uma janela anônima, escolher HBO Max, entrar com a mesma conta e ver o aviso e a Netflix de volta; mudar os streamings numa janela e recarregar a outra.
- [ ] **Step 5:** Commit `feat: streamings guardados na conta`.

### Task 8: Teste de segurança (RLS) e revisão

**Files:**
- Create: `tests-integration/rls.test.ts`, `vitest.integration.config.ts`
- Modify: `package.json` (script `"test:seguranca": "vitest run --config vitest.integration.config.ts"`), `vitest.config.ts` (excluir `tests-integration/**`), `README.md`

- [ ] **Step 1:** Teste (pula com `describe.skip` + aviso se as variáveis faltarem): cria duas contas com `signUp` usando a chave pública e e-mails `teste+<aleatório>@example.com`; A insere uma marcação; B tenta `select` → lista vazia; B tenta `update`/`delete` da linha de A → 0 linhas afetadas; B tenta `insert` com `user_id` de A → erro de RLS; o mesmo para `user_settings`. No fim, cada conta apaga as próprias linhas.
- [ ] **Step 2:** `npm run test:seguranca` → PASS (com `.env.local` preenchido). `npm test` continua sem rodar este arquivo.
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npx next build` → tudo PASS. Conferência a 375px e 1280px de `/`, `/?aba=quero`, `/entrar`, `/filme/<id>` logado e deslogado.
- [ ] **Step 4:** README: como apagar as contas de teste (Authentication → Users) e o lembrete de adicionar as duas variáveis na Vercel.
- [ ] **Step 5:** Commit `test: regras de segurança das listas`.
