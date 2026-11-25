# CineLivre — Seta "Voltar" e busca centralizada — Design curto

Data: 2026-11-25 · Status: rascunho para aprovação

**Intenção.** Depois de marcar episódios na página da série, não há um jeito claro de sair dela (o
"CineLivre" leva para Filmes). A autora quer uma seta de voltar e a busca mais visível, com o texto
"Buscar filme ou série", centralizada no topo.

**Decidido com a autora**
- Seta **abaixo do nome "CineLivre"**, nas páginas de série e de filme (texto "← Voltar").
- **Abordagem A:** volta para a tela de onde a pessoa veio dentro do CineLivre (como o voltar do
  celular). Sem tela anterior no app (abriu por link): série → `/?tipo=series`; filme → `/`.
- Busca com o texto "Buscar filme ou série", centralizada no topo.

**Abordagens consideradas**
| Abordagem | Trade-off |
|---|---|
| **A. Tela anterior** (escolhida) | Funciona como o voltar do celular e mantém busca/rolagem; o destino varia |
| B. Sempre a parte de Séries | Previsível; perde os resultados da busca |

**Minhas decisões (a autora pode revisar)**
- A seta rola junto com a página (não fica presa no topo).
- No computador a busca fica no meio do topo; no celular não há espaço para centralizar, então ela
  continua entre o logo e os botões, e o texto aparece cortado.
- "Veio de dentro do app" = já houve uma troca de página no CineLivre nesta aba (guardado na sessão
  do navegador); senão vale o destino padrão.

**Deixado para quem constrói:** nome do componente, como registrar a navegação interna, testes da
regra do destino (com e sem tela anterior, série e filme).
