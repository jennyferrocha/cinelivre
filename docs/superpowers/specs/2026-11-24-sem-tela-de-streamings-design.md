# CineLivre — Sem tela obrigatória de streamings — Design curto

Data: 2026-11-24 · Status: rascunho para aprovação

**Intenção.** Quem abre o link pela primeira vez cai direto nos filmes, sem ser obrigado a escolher
streamings antes. A escolha continua disponível em "Meus streamings" (topo).

**Decidido com a autora**
- Sem escolha de streamings, o app mostra **filmes disponíveis em qualquer streaming do Brasil**
  (assinatura, grátis ou com anúncios), com a etiqueta do serviço. Continua valendo: nunca sugerir
  filme que não dá para assistir em lugar nenhum (só cinema, aluguel ou compra ficam de fora).
- **Abordagem A:** "sem escolha" = "todos os serviços marcados" (todos os grupos do Brasil + grátis),
  calculado num lugar só e usado por todas as telas.

**Abordagens consideradas**
| Abordagem | Trade-off |
|---|---|
| **A. Escolha virtual "todos os streamings"** (escolhida) | Mudança pequena num lugar; reaproveita a regra de disponibilidade e as etiquetas; pedido ao TMDB com lista longa de serviços |
| B. Modo "sem filtro de serviço" | Duas regras de disponibilidade para manter; risco de divergirem |

**Comportamento**
- `/` e `/sugestoes` não redirecionam mais para `/streamings`; sem escolha usam "todos os streamings".
- Uma faixa discreta aparece nessas duas telas quando a pessoa ainda não escolheu:
  "Mostrando filmes de todos os streamings." + botão "Escolher meus streamings" (→ `/streamings`).
  Some assim que existe uma escolha (no aparelho ou na conta).
- **Busca, página do filme e abas** usam a mesma regra: sem escolha, mostram onde cada filme está
  (em vez de "Não está nos seus streamings" em tudo).
- Escolher streamings funciona como hoje (cookie e, logada, conta). Logada sem escolha na conta nem
  no aparelho: também "todos os streamings".
- A tela `/streamings` continua igual (com o botão "Começar").

**Minhas decisões (a autora pode revisar)**
- "Todos" inclui os canais dentro de outros serviços (ex.: "Paramount+ Amazon Channel") e todos os
  grátis; lojas de aluguel/compra continuam fora.
- A faixa fica logo acima do filtro de nota na tela inicial e no topo de "O que eu assisto hoje?".
- O login não copia "todos os streamings" para a conta (só escolhas feitas de verdade vão para lá).

**Deixado para quem constrói:** onde fica a função da escolha efetiva, o visual exato da faixa,
testes (sem escolha → parâmetros com todos os serviços; faixa só sem escolha; sem redirecionamento).
