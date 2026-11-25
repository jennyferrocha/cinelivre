# CineLivre — Séries e acompanhamento de episódios — Design

Data: 2026-11-24 · Status: rascunho para aprovação

## Intenção

O CineLivre hoje mostra filmes dos streamings brasileiros e guarda duas listas por pessoa ("Quero
assistir" e "Já assisti"). A autora quer trazer séries para o app, num estilo de rastreador de
episódios, para três coisas:

1. **Lembrar em que episódio parou** em cada série.
2. **Descobrir o que assistir** (séries dos streamings da pessoa, como já acontece com filmes).
3. **Deixar registrado as séries assistidas.**

Além disso, a pessoa pode **dar de 1 a 5 estrelas** para séries (a série inteira) e para filmes.

## Metas, não-metas e anti-metas

**Metas**
- Séries no catálogo: tela inicial, busca e página da série, com onde assistir no Brasil.
- Marcar episódios assistidos, ver o progresso e o próximo episódio ("Continuar assistindo").
- Situação de cada série calculada sozinha: Quero assistir → Acompanhando → Já assisti.
- Estrelas pessoais (1 a 5) para séries e filmes.

**Não-metas (ficam para depois, se ela quiser)**
- Nota por episódio.
- Avisos de episódio novo (notificação/e-mail), calendário "Em breve", estatísticas.
- Parte social (comentários, reações, amigos).
- Usar as estrelas para escolher sugestões.
- "O que eu assisto hoje?" (`/sugestoes`) com séries: continua só de filmes.

**Anti-metas (seria um fracasso mesmo funcionando)**
- Quebrar ou mudar o comportamento atual dos filmes (listas, abas, busca, sugestões).
- Sugerir série que não dá para assistir em nenhum streaming (só aluguel/compra não conta).
- Copiar visual, marca ou nomes do TV Time: as funções são do mesmo tipo, o visual é o do CineLivre.
- Perder marcações de episódios (dois aparelhos marcando ao mesmo tempo não podem apagar um ao outro).

## Restrições

- Mesmo stack: Next.js 16 (App Router, Cache Components), Supabase (login e listas), TMDB (dados),
  Vercel. Mesma chave `TMDB_TOKEN`; nada de chave secreta do Supabase no app.
- TMDB tem o equivalente de tudo para séries: `/discover/tv`, `/tv/{id}`, `/tv/{id}/season/{n}`,
  `/tv/{id}/watch/providers`, `/search/tv` e `/search/multi`. Região BR, idioma pt-BR (com o resumo
  em inglês como reserva, igual aos filmes).
- Regra de disponibilidade igual à dos filmes: só ofertas `flatrate`/`free`/`ads` no Brasil.
- Sem escolha de streamings, vale "todos os streamings" (`getEffectiveSelection`), igual aos filmes.
- Marcar qualquer coisa exige estar logada, com o mesmo fluxo de hoje (marca pendente aplicada
  depois do login).
- Segurança: tabelas novas com RLS "cada pessoa só lê e altera as próprias linhas", como
  `movie_marks`.

## Abordagens (guardar as marcações)

| Abordagem | Trade-off |
|---|---|
| **A. Tabelas novas só para séries** (escolhida) | Não mexe no que funciona; situação calculada a partir dos episódios; um pouco de código parecido entre filmes e séries |
| B. Uma tabela "títulos" para filmes e séries | Menos repetição, mas exige migrar as marcações existentes e mexer em tudo que lê filmes |
| C. Um registro por série com a lista de episódios dentro | Menos linhas, mas cada marcação regrava a lista e dois aparelhos podem apagar um ao outro |

A autora escolheu **A** por ser mais segura para um site que já está no ar.

## Como funciona (decidido com a autora)

### Tela inicial
- Botão **"Filmes | Séries"** no topo da tela inicial. "Filmes" é a tela de hoje, sem mudanças.
- Em **Séries**, a primeira fileira é **"Continuar assistindo"** (só logada e com séries em
  andamento): o próximo episódio de cada série, com barra de progresso. Depois vêm fileiras de
  séries dos streamings da pessoa (com o filtro de nota), no mesmo estilo das de filmes.

### Página da série
- Topo: nome, anos, gênero, número de temporadas, nota do TMDB, onde assistir no Brasil e o resumo.
- Botão "＋ Quero assistir" e o resumo do progresso: "Próximo: T2 E6 · título" e "18 de 29 episódios".
- **Botões de temporada** (T1, T2, …). A página abre na temporada em que a pessoa parou (ou na T1).
- Cada episódio tem um círculo para marcar como assistido.
- Ao marcar um episódio com episódios anteriores não marcados, o app pergunta se quer marcar os
  anteriores também ("Marcar também os 3 anteriores? Sim · Não").
- "Marcar temporada inteira" marca todos os episódios já exibidos daquela temporada.
- Estrelas da série (1 a 5).

### As três situações (calculadas, nunca escolhidas à mão, exceto "Quero assistir")
- **Quero assistir:** a pessoa tocou em "Quero assistir" e ainda não marcou episódio nenhum.
- **Acompanhando:** marcou pelo menos um episódio e ainda faltam episódios já exibidos; ou viu
  todos os já exibidos, mas a série continua (mostra "Em dia · novo episódio em 12/03").
- **Já assisti:** viu todos os episódios já exibidos e a série terminou (ou foi cancelada).
- Quando sai episódio novo de uma série "em dia", ela volta a aparecer em "Continuar assistindo".
- **Parei de assistir** (escolhida pela autora, opção A): botão na página da série em
  andamento. A série sai de "Continuar assistindo" e de "Acompanhando" e vai para a lista
  "Parei de assistir", sem perder os episódios marcados. Marcar um episódio novo nela a traz de
  volta para "Acompanhando". Séries nessa lista também ficam fora das sugestões.

### Descobrir
- Fileiras de séries seguem a regra dos filmes: só o que está nos streamings da pessoa, filtro de
  nota, etiqueta do serviço no pôster.
- Séries em "Acompanhando" e "Já assisti" ficam fora das sugestões.

### Abas e busca
- Na parte de Séries, as abas "Quero assistir", "Acompanhando", "Já assisti" e "Parei de assistir"
  mostram só séries; a parte de Filmes continua igual.
- O campo "Buscar filme" passa a achar filmes e séries juntos, com uma etiqueta "Série" nos pôsteres
  de série.

### Estrelas
- Estrelas inteiras de 1 a 5, sem meia estrela. Tocar de novo na mesma estrela apaga a nota.
- Valem para a série inteira (nunca por episódio) e para filmes (na página do filme).
- Dá para avaliar a qualquer momento. Não mudam a nota do TMDB, que continua no pôster.
- Aparecem na página e embaixo dos pôsteres da aba "Já assisti".

### Etapas (cada uma vai ao ar sozinha)
1. **Séries no catálogo:** botão Filmes | Séries, fileiras de séries, busca com séries, página da
   série (temporadas e episódios para ver, sem marcar).
2. **Acompanhamento:** marcar episódios, as três situações, "Continuar assistindo", abas de séries,
   estrelas (séries e filmes), séries fora das sugestões.

### Dados (abordagem A)
- Tabela de **episódios marcados**: um registro por pessoa + série + temporada + episódio, com a data
  em que marcou. Marcar/desmarcar um episódio nunca regrava os outros.
- Tabela de **séries da pessoa**: um registro por pessoa + série com "quero assistir" (sim/não),
  "parei de assistir" (sim/não), estrelas (vazio ou 1 a 5) e os dados do pôster para as listas abrirem rápido (como `movie_marks`).
- **Filmes:** a tabela `movie_marks` ganha um campo de estrelas (vazio ou 1 a 5).
- Todas com RLS igual a `movie_marks`; o arquivo `supabase/schema.sql` ganha as tabelas novas e a
  autora roda o SQL de novo.

## Minhas decisões (a autora pode revisar)
- **"Próximo episódio"** = o primeiro episódio já exibido **depois do último marcado** (na ordem
  temporada/episódio). Se ela marcou E5 e disse "Não" aos anteriores, o próximo é E6; E1–E4 ficam
  sem marcar e só contam como "faltando" no total.
- **Especiais (temporada 0 do TMDB)** aparecem como "Especiais" no fim dos botões de temporada, mas
  **não contam** no progresso, no "próximo episódio", no "marcar anteriores" nem para "Já assisti".
- **Episódio que ainda não saiu** aparece com a data de estreia e não pode ser marcado.
- **Aba "Acompanhando"** na parte de Séries (entre "Quero assistir" e "Já assisti"), para as séries
  em andamento, inclusive as "em dia" que saíram de "Continuar assistindo".
- **"Marcar série inteira como assistida"** na página da série: marca todos os episódios já
  exibidos de uma vez (com confirmação), para registrar séries vistas há muito tempo.
- **"Quero assistir" é guardado e só entra no cálculo:** não é apagado ao marcar o primeiro
  episódio. Se ela desmarcar todos os episódios, a série volta para "Quero assistir" (se o "quero"
  estiver ligado) ou some das listas.
- **Estrelas em filme fora das listas:** dar estrelas a um filme que não está em nenhuma lista o
  coloca em "Já assisti" (quem avalia, assistiu). Apagar as estrelas não tira o filme da lista.
  Filme em "Quero assistir" que recebe estrelas passa para "Já assisti".
- **Estrelas em série sem marcação:** permitido; a série não entra em lista nenhuma por isso
  (as listas de séries vêm dos episódios e do "quero").

## Deixado para quem constrói
- Nomes de tabelas, colunas, rotas e componentes; como a URL guarda "Filmes | Séries".
- Quais fileiras de séries aparecem (seguir o espírito das de filmes: em alta, bem avaliadas…).
- Como guardar/cachear o total de episódios exibidos para calcular a situação sem pedir tudo ao TMDB
  em cada tela.
- Visual exato das estrelas, do aviso "marcar os anteriores" e da etiqueta "Série".
- Testes: situação calculada (inclusive série em andamento "em dia"), marcar anteriores, estrelas
  (marcar, trocar, apagar), segurança das tabelas novas (`test:seguranca`), disponibilidade.
