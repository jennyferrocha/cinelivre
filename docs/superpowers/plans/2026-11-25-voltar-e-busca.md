# Seta "Voltar" e busca centralizada — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Páginas de série e de filme ganham "← Voltar" abaixo do "CineLivre" (volta para a tela anterior do app, ou para Séries/Filmes), e a busca do topo fica no meio, com "Buscar filme ou série".

**Architecture:** Um rastreador cliente no layout guarda na `sessionStorage` a página atual e a anterior a cada troca de página; funções puras decidem se dá para voltar com `router.back()` ou se vale o destino padrão. O topo passa a ser uma grade de 3 colunas a partir de `sm`.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-25-voltar-e-busca-design.md`

Caminhos relativos a `catalogo-filmes/`.

## Global Constraints

- Texto da seta: "← Voltar" (seta como ícone, texto "Voltar"). Destino padrão: série → `/?tipo=series`; filme → `/`.
- Placeholder da busca: "Buscar filme ou série" (o `aria-label` já é esse).
- `sessionStorage` pode falhar (aba privada, bloqueio): toda leitura/escrita em try/catch; sem ela, vale o destino padrão.
- O "CineLivre" continua levando a `/`.

## Review Focus

1. **Recarregar a página da série** não pode fazer a seta "voltar" para a própria série ou sair do site. Teste em `nextTrail`/`canGoBack` (Tarefa 1).
2. **Abrir a série direto por link** (primeira página da aba): a seta vai para `/?tipo=series`, nunca `router.back()` para fora do site. Teste em `canGoBack` (Tarefa 1).
3. **`sessionStorage` indisponível:** a seta funciona com o destino padrão. Teste em `readTrail` (Tarefa 1).
4. **Celular 375px:** topo sem rolagem lateral com o placeholder maior. Conferência na Tarefa 2.
5. **Página de filme:** a seta aparece e volta do mesmo jeito. Conferência na Tarefa 2.

---

### Task 1: Regra de voltar

**Files:**
- Create: `src/lib/back.ts`
- Test: `tests/back.test.ts`

**Interfaces:**
- Produces: `type Trail = { last?: string; prev?: string }`; `nextTrail(trail: Trail, current: string): Trail` (mesma página → igual; outra → `{ prev: last, last: current }`); `canGoBack(trail: Trail, current: string): boolean` (`prev` existe, é diferente de `current` e `last === current`); `readTrail(storage: Pick<Storage, "getItem"> | null): Trail` (JSON inválido/erro → `{}`); `writeTrail(storage, trail): void` (erro ignorado); `TRAIL_KEY = "cinelivre-trilha"`; `backFallback(kind: "tv" | "movie"): string`.

- [ ] **Step 1: Testes que falham:**
```ts
expect(nextTrail({}, "/")).toEqual({ last: "/", prev: undefined });
expect(nextTrail({ last: "/" }, "/serie/1")).toEqual({ last: "/serie/1", prev: "/" });
expect(nextTrail({ last: "/serie/1", prev: "/" }, "/serie/1")).toEqual({ last: "/serie/1", prev: "/" }); // recarregar
expect(canGoBack({ last: "/serie/1", prev: "/" }, "/serie/1")).toBe(true);
expect(canGoBack({ last: "/serie/1" }, "/serie/1")).toBe(false); // abriu direto
expect(canGoBack({ last: "/x", prev: "/" }, "/serie/1")).toBe(false);
expect(readTrail({ getItem: () => "{x" })).toEqual({});
expect(readTrail({ getItem: () => { throw new Error(); } })).toEqual({});
expect(readTrail(null)).toEqual({});
expect(backFallback("tv")).toBe("/?tipo=series"); expect(backFallback("movie")).toBe("/");
```
- [ ] **Step 2:** `npx vitest run tests/back.test.ts` → FAIL; implemente; → PASS.
- [ ] **Step 3:** Commit `feat: regra da seta voltar`.

### Task 2: Seta nas páginas e busca no meio do topo

**Files:**
- Create: `src/components/NavigationTrail.tsx` (cliente; grava a trilha a cada mudança de `pathname + search`), `src/components/BackLink.tsx` (cliente)
- Modify: `src/app/layout.tsx` (`NavigationTrail` dentro de `<Suspense>`), `src/app/serie/[id]/page.tsx`, `src/app/filme/[id]/page.tsx`, `src/components/Header.tsx`

**Interfaces:**
- Consumes: Tarefa 1 inteira.
- Produces: `BackLink({ kind: "tv" | "movie" })` — link "← Voltar" com `href = backFallback(kind)`; ao clicar, se `canGoBack(readTrail(sessionStorage), atual)`, `preventDefault()` + `router.back()`.

- [ ] **Step 1:** `BackLink` no topo da página (série e filme): faixa absoluta logo abaixo do topo (`top-16`, `z-20`, `px-4 sm:px-10`), com sombra no texto como as abas da tela inicial; `main` ganha `relative`. Também nos esqueletos de carregamento não (só no conteúdo).
- [ ] **Step 2:** `Header`: a partir de `sm`, grade `grid-cols-[1fr_auto_1fr]` (logo à esquerda, busca no meio, botões à direita); no celular continua em linha. Placeholder "Buscar filme ou série"; campo `sm:w-72`.
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit`, `npm run lint` → PASS.
- [ ] **Step 4: Navegador:** tela inicial de Séries → abrir uma série → "← Voltar" volta para Séries; busca → abrir série → Voltar volta aos resultados; abrir `/serie/1399` direto → Voltar leva a `/?tipo=series`; recarregar a série e Voltar continua indo para a tela anterior; página de filme igual (direto → `/`); 1280px busca centralizada; 375px sem rolagem lateral.
- [ ] **Step 5:** Commit `feat: seta voltar e busca no meio do topo`.
