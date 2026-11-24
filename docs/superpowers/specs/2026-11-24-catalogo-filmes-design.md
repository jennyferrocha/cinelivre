# Catálogo de filmes nos streamings — Design

Data: 2026-11-24 · Status: rascunho para aprovação

## 1. Intenção

Um web app que ajuda a pessoa a **decidir o que assistir agora**, mostrando só filmes que ela
realmente consegue ver nos streamings que assina (e, se quiser, nos gratuitos com anúncios), no
Brasil. Os dados vêm da API do TMDB (filmes) e, através dela, do JustWatch (onde cada filme está).

Para quem: a própria autora e qualquer pessoa que receber o link. Uso público, sem cadastro nesta
primeira versão.

Estilo visual: inspirado na Netflix (fundo escuro, destaque grande no topo, fileiras horizontais de
pôsteres), mas com identidade própria — **sem usar nome, logo, cores de marca ou outros elementos
da Netflix**.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos (v1)**
- A pessoa escolhe seus streamings uma vez e a partir daí tudo que vê está disponível para ela.
- A tela inicial já sugere filmes sem a pessoa precisar fazer nada.
- Filtros simples ("o que eu assisto hoje?") levam a uma lista curta de sugestões.
- Página de detalhe com tudo que ajuda a decidir: sinopse, nota, duração, classificação, elenco,
  trailer e onde assistir.
- Funciona bem no celular (a maioria vai abrir pelo link no celular) e no computador.
- Publicado na internet com um link compartilhável.

**Não-objetivos (v1)** — ficam para a etapa 2, já planejada
- Login, cadastro, banco de dados.
- Favoritos e "já assisti".
- Recomendações baseadas no gosto/histórico da pessoa.

**Fora do escopo**
- Séries (só filmes).
- Outros países além do Brasil.
- Aluguel/compra (Apple TV, Google Play etc.).
- App nas lojas (Play Store / App Store).

**Anti-objetivos** (seria um fracasso mesmo funcionando)
- Sugerir filmes que a pessoa não consegue assistir nos serviços que marcou.
- Expor a chave da API do TMDB no navegador.
- Parecer uma cópia da Netflix (marca, logo, nome).
- Ser lento ou travar a ponto de a pessoa desistir antes de escolher.

## 3. Restrições

- **Dados por país:** a disponibilidade nos streamings é sempre consultada com `watch_region=BR`.
- **Créditos obrigatórios:** o TMDB exige atribuição ("Este produto usa a API do TMDB, mas não é
  endossado ou certificado pelo TMDB", com o logo do TMDB) e exige crédito ao JustWatch nos dados
  de "onde assistir". Os dois aparecem no rodapé do app e na seção "Onde assistir" do detalhe.
- **Chave da API:** fica só no servidor (variável de ambiente). Nenhum pedido ao TMDB sai direto do
  navegador.
- **Idioma:** interface e dados em português (`language=pt-BR`). Quando não houver sinopse em
  português, mostrar a em inglês em vez de deixar vazio.
- **Custo:** tudo dentro de planos gratuitos (TMDB grátis para uso não comercial; Vercel grátis).
- **Pré-requisito da autora:** criar conta no TMDB e gerar uma chave de API (Read Access Token).
- **Quem constrói:** o Claude Code constrói, junto com a autora, que é iniciante em programação.
  O plano deve ter etapas pequenas, cada uma terminando com algo que ela consiga ver funcionando
  (no navegador), com explicações curtas dos conceitos novos (servidor x navegador, variável de
  ambiente, publicar na Vercel). Poucas dependências; código organizado e legível; README com
  passos simples para rodar localmente e publicar.

## 4. Abordagens consideradas

| Abordagem | Prós | Contras |
|---|---|---|
| **A. Next.js com parte de servidor** (escolhida) | Chave do TMDB protegida; login e banco (ex.: Supabase) entram no mesmo projeto na etapa 2; muito material disponível; publicação grátis na Vercel | Um pouco mais de conceitos (o que roda no servidor x no navegador) |
| B. React simples (Vite), só no navegador | Mais simples de entender e começar | Chave do TMDB visível no navegador; etapa 2 pode exigir peças extras ou reorganização |
| HTML/JS puro (descartada) | Nada a instalar | Com filtros, várias listas e login depois, vira código difícil de manter |

**Escolha: A**, pela segurança da chave e porque já deixa o caminho pronto para a etapa 2.

## 5. O que foi decidido (comportamento)

### 5.1 Primeira visita — escolher streamings
- Tela com a grade de serviços disponíveis no Brasil (lista vinda do TMDB
  `/watch/providers/movie?watch_region=BR`, mostrando os mais relevantes primeiro e "+ outros").
- A pessoa marca os que assina. Opção "Incluir também filmes grátis (com anúncios)", **ligada por
  padrão**.
- Escolhas salvas no próprio aparelho (localStorage). Botão ⚙ "Meus streamings" no topo para mudar
  a qualquer momento.
- Sem streaming marcado, o app não segue para a tela inicial (pede ao menos um, ou só "grátis").

### 5.2 Tela inicial (layout "A" aprovado nos esboços)
- **Topo:** nome/logo do app, lupa de busca, botão ⚙ "Meus streamings".
- **Destaque grande:** um filme popular disponível nos streamings da pessoa, com imagem de fundo
  (backdrop), título, nota, gênero, duração e botão "Ver detalhes".
- **Botão "🎲 O que eu assisto hoje?"** logo abaixo, que abre a tela de filtros.
- **Fileiras horizontais** (deslizam para o lado; cada pôster tem etiqueta do streaming onde está):
  - Em alta esta semana
  - Bem avaliados
  - Lançamentos recentes
  - Uma fileira por gênero popular (ex.: Comédia, Ação, Terror, Romance, Animação)
- Tocar em qualquer pôster abre o detalhe.

### 5.3 "O que eu assisto hoje?" — filtros e sugestões
- Filtros: gênero (vários), duração máxima (ex.: até 1h30 / até 2h / qualquer), nota mínima
  (ex.: 6+, 7+, 8+), época (ex.: lançados a partir de 2015 / 2000 / qualquer).
- Mostra quantos filmes combinam ("42 filmes nos seus streamings") e a grade de pôsteres.
- Botão **"🔀 Me surpreenda"**: sorteia um filme entre os resultados e abre o detalhe dele.
- Sem resultados: mensagem amigável sugerindo afrouxar algum filtro.

### 5.4 Busca por nome
- A lupa busca qualquer filme pelo título (TMDB `/search/movie`).
- Os resultados mostram todos os filmes encontrados; os que estão nos streamings da pessoa aparecem
  primeiro, com a etiqueta do serviço; os outros aparecem com "Não está nos seus streamings".

### 5.5 Detalhe do filme
- Imagem de fundo, pôster, título, ano, nota, gêneros, duração, classificação indicativa (Brasil).
- Sinopse em português.
- **Onde assistir:** os serviços em que está disponível no Brasil, destacando os que a pessoa
  assina. Crédito ao JustWatch.
- Botão "▶ Ver trailer" (YouTube, quando existir), elenco principal.

### 5.6 Dados do TMDB (referência para quem constrói)
- Listas e filtros: `/discover/movie` com `watch_region=BR`, `with_watch_providers=<ids separados por |>`,
  `with_watch_monetization_types=flatrate|free|ads` (sem `free|ads` se a pessoa desligou os
  gratuitos), `language=pt-BR`, mais os parâmetros de cada fileira/filtro
  (`sort_by`, `with_genres`, `with_runtime.lte`, `vote_average.gte`, `vote_count.gte`,
  `primary_release_date.gte`).
- Detalhe: `/movie/{id}?append_to_response=videos,credits,release_dates,watch/providers`.
- Imagens: `https://image.tmdb.org/t/p/<tamanho>/<caminho>`.

## 6. Decisões minhas (a autora pode revisar)

- **"Chegaram recentemente" virou "Lançamentos recentes".** O TMDB não informa *quando* um filme
  entrou num streaming, só se ele está lá agora. A fileira mostra filmes lançados nos últimos
  ~12 meses que já estão nos streamings da pessoa.
- **"Em alta esta semana"** = filmes mais populares no momento (ordenação por popularidade do
  TMDB) filtrados pelos streamings da pessoa. A lista "trending" do TMDB não filtra por streaming.
- **"Bem avaliados"** exige um mínimo de votos (ex.: 300+) para não aparecerem filmes com nota
  alta e poucos votos.
- **Grátis com anúncios ligado por padrão**, pois são filmes que a pessoa pode ver sem pagar nada.
- **Como os streamings marcados viram IDs do TMDB** (regra: na dúvida, esconder um filme é melhor
  do que sugerir um que a pessoa não consegue ver):
  - *Planos com anúncios de serviços pagos* (ex.: "Netflix Standard with Ads") contam junto com o
    serviço principal: marcar "Netflix" inclui os dois IDs. A grade mostra um cartão por serviço.
  - *Canais dentro de outro serviço* (ex.: "Paramount+ Amazon Channel") **não** contam
    automaticamente; só entram se a pessoa marcar esse canal em "+ outros".
  - *"Incluir grátis"* adiciona automaticamente todos os serviços gratuitos disponíveis no Brasil
    (ex.: Pluto TV, Plex, Libreflix), identificados pelo tipo de disponibilidade `free`/`ads` nos
    dados do TMDB, e conta só as ofertas `free`/`ads` deles.
  - Essa regra de agrupamento fica num único lugar do código e tem teste.
- **Nome do app provisório** ("CineLivre" nos esboços); a autora pode escolher outro depois.
- **Paleta:** fundo quase preto com uma cor de destaque própria (amarelo nos esboços), longe do
  vermelho da Netflix.

## 7. Preparação para a etapa 2 (não construir agora)

A etapa 2 vai adicionar login, cadastro, favoritos e "já assisti" com um banco de dados
(provável: Supabase). Na v1, basta que:
- a escolha de streamings fique isolada num único lugar do código, para depois poder vir da conta
  da pessoa em vez do localStorage;
- os cartões de filme e o detalhe tenham espaço para um futuro botão de favoritar/"já vi".

## 8. Deixado para quem constrói

- Estrutura de pastas, bibliotecas de estilo (ex.: Tailwind) e componentes.
- Como fazer o cache dos pedidos ao TMDB (para ficar rápido e respeitar limites).
- Quantos filmes por fileira, rolagem infinita ou "ver mais" na tela de filtros.
- Valores exatos das opções de filtros e quais gêneros ganham fileira.
- Detalhes visuais finos (fontes, animações), respeitando o estilo aprovado nos esboços.
- Testes: o suficiente para garantir que os filtros montam os pedidos certos ao TMDB e que nunca
  aparecem filmes fora dos streamings escolhidos.
