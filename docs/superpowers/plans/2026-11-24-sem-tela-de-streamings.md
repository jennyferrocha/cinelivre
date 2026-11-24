# Sem tela obrigatória de streamings — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Primeira visita vai direto aos filmes; sem escolha, o app usa "todos os streamings do Brasil" e mostra uma faixa convidando a escolher.

**Architecture:** Uma função de servidor, `getEffectiveSelection()`, devolve a escolha real (conta ou cookie) ou, se não houver, a escolha virtual com todos os grupos + grátis, junto com `chosen: boolean`. Todas as telas que hoje chamam `getSelection()` para mostrar filmes passam a usá-la; `/streamings` continua usando `getSelection()` (formulário marcado só com escolha real).

**Tech Stack:** Next.js 16, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-sem-tela-de-streamings-design.md`

## Global Constraints

- Nunca sugerir filme sem oferta `flatrate`/`free`/`ads` no Brasil (aluguel/compra não contam): a escolha virtual passa pela mesma verificação por filme de hoje.
- "Todos" = todos os `ServiceGroup` (inclusive canais) + `includeFree: true`.
- Texto exato da faixa: "Mostrando filmes de todos os streamings." e botão "Escolher meus streamings" (→ `/streamings`).
- A escolha virtual nunca é gravada (nem cookie, nem conta).

## Review Focus

1. **Logada sem escolha na conta nem no aparelho:** recebe "todos" e a faixa, sem redirecionamento. Teste na Tarefa 1.
2. **Cookie corrompido:** tratado como "sem escolha" (todos + faixa), nunca erro. Teste na Tarefa 1.
3. **Login com escolha virtual:** `syncSelectionOnLogin` não copia "todos" para a conta (já lê só o cookie real) — conferir que nada grava a virtual. Teste na Tarefa 1.
4. **Busca sem escolha:** etiquetas com o serviço, não "Não está nos seus streamings" em tudo. Conferência no navegador na Tarefa 2.
5. **Tela `/streamings` sem escolha:** formulário aparece sem nada marcado (não "todos marcados"). Conferência na Tarefa 2.

---

### Task 1: Escolha efetiva

**Files:**
- Modify: `catalogo-filmes/src/lib/selection.ts`, `catalogo-filmes/src/lib/selection-server.ts`
- Test: `catalogo-filmes/tests/selection.test.ts`, `catalogo-filmes/tests/settings/selection-server.test.ts`

**Interfaces:**
- Produces: `allServicesSelection(groups: { key: string }[]): Selection` em `selection.ts`; `getEffectiveSelection(): Promise<{ selection: Selection; chosen: boolean }>` em `selection-server.ts`.

- [ ] **Step 1: Testes que falham:**
```ts
expect(allServicesSelection([{ key: "netflix" }, { key: "paramount-plus-amazon-channel" }]))
  .toEqual({ services: ["netflix", "paramount-plus-amazon-channel"], includeFree: true });
// getEffectiveSelection (mesmos mocks de getSelection):
// sem cookie e sem login → { selection: { services: ["netflix","hbo-max"], includeFree: true }, chosen: false }
// cookie corrompido ("{x") → chosen false (todos)
// logada sem escolha na conta e sem cookie → chosen false
// cookie válido → { selection: cookie, chosen: true }; conta → { selection: conta, chosen: true }
```
- [ ] **Step 2:** `npm test` → FAIL; implemente; `npm test` → PASS.
- [ ] **Step 3:** Commit `feat: escolha efetiva com todos os streamings`.

### Task 2: Telas sem redirecionamento e faixa

**Files:**
- Create: `catalogo-filmes/src/components/AllStreamingsBanner.tsx`
- Modify: `src/app/page.tsx`, `src/app/sugestoes/page.tsx`, `src/app/busca/page.tsx`, `src/app/filme/[id]/page.tsx`

**Interfaces:**
- Consumes: `getEffectiveSelection`
- Produces: `AllStreamingsBanner()` (faixa com os textos das Global Constraints).

- [ ] **Step 1:** Tela inicial (aba "Para você") e `/sugestoes`: trocar `getSelection` + `redirect("/streamings")` por `getEffectiveSelection()`; quando `chosen === false`, mostrar `AllStreamingsBanner` acima do filtro de nota (início) e no topo do conteúdo (sugestões). Abas de lista, busca e detalhe: usar `.selection` da escolha efetiva.
- [ ] **Step 2:** `npm test`, `npx tsc --noEmit`, `npm run lint` → PASS.
- [ ] **Step 3: Checkpoint no navegador (perfil limpo, sem cookie):** `/` abre com filmes e a faixa (sem ir para `/streamings`); `/sugestoes` idem; `/busca?q=matrix` mostra serviços nas etiquetas; `/streamings` sem nada marcado; depois de escolher Netflix, a faixa some. 375px sem rolagem lateral.
- [ ] **Step 4:** Commit `feat: sem tela obrigatória de streamings`.
