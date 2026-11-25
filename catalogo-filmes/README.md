# CineLivre

Ajuda a decidir **o que assistir agora**: mostra só os filmes disponíveis nos streamings que você
assina no Brasil (e, se quiser, nos gratuitos com anúncios).
Dados: [TMDB](https://www.themoviedb.org/) e JustWatch.

## O que dá para fazer

- **Escolher seus streamings** uma vez (Netflix, Prime Video, HBO Max, Globoplay e outros).
- **Tela inicial** com um filme em destaque, Top 10 em alta e fileiras por gênero, com filtro de
  **nota mínima** (6+, 7+, 8+).
- **"O que eu assisto hoje?"**: filtros de gênero, duração, nota e época, mais o botão
  **"Me surpreenda"**, que sorteia um filme.
- **Séries**: o botão **"Filmes | Séries"** no topo da tela inicial troca para séries dos seus
  streamings, com destaque, Top 10 e fileiras por gênero.
- **Busca por nome** de filmes e séries, mostrando onde cada um está (ou "Não está nos seus streamings").
- **Página do filme** com sinopse, nota, duração, classificação, trailer, elenco e onde assistir.
- **Página da série** com resumo, temporadas (T1, T2… e Especiais), episódios com data de estreia
  e onde assistir.
- **Conta opcional** (e-mail e senha) para:
  - marcar filmes como **"Quero assistir"** ou **"Já assisti"**, nos pôsteres ou na página do filme;
  - ver essas listas nas **abas da tela inicial**;
  - **tirar das sugestões** o que você já assistiu;
  - levar a **escolha de streamings** para qualquer aparelho em que você entrar;
  - **acompanhar séries**: marcar episódios (com "marcar os anteriores", a temporada ou a série
    inteira), ver o próximo episódio em **"Continuar assistindo"** e as abas de séries
    (**Quero assistir, Acompanhando, Já assisti, Parei de assistir**);
  - dar **de 1 a 5 estrelas** para filmes e séries.

Sem conta, tudo funciona, exceto marcar filmes, episódios e dar estrelas.

## Tecnologias

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (login e banco de dados) e
Vitest (testes). A chave do TMDB fica só no servidor: nenhum pedido ao TMDB sai do navegador.

## Rodar no computador

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e cole o seu token do TMDB
   (themoviedb.org → Configurações → API → "API Read Access Token").
3. Rode `npm run dev` e abra http://localhost:3000

Só com o token do TMDB o app já funciona, sem a parte de contas. Para ligar as contas, siga a seção
abaixo.

## Contas (Supabase)

1. Crie um projeto em supabase.com e, em **Authentication → Sign In / Providers → Email**, desligue
   **Confirm email** (a conta vale logo após o cadastro).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Em **Table Editor** devem aparecer `movie_marks` e `user_settings` com o selo de RLS ligado.
   O RLS é a regra do banco que deixa cada pessoa ver e alterar só os próprios dados.
3. Em **Project Settings → API Keys** (e **Data API** para a URL), copie a **Project URL** e a chave
   **publishable** (ou **anon public**) para o `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
   ⚠️ Nunca use a chave **secret / service_role**: ela ignora as regras de segurança.
4. Reinicie o `npm run dev`. O botão **Entrar** aparece no topo.

Ainda não há "Esqueci minha senha": o e-mail padrão do Supabase só envia para a equipe do projeto.

## Testes

- `npm test`: todos os testes automáticos (não precisam de internet nem de chaves).
- `npm run test:seguranca` (opcional): confere as regras de segurança no seu projeto do Supabase.
  Cria duas contas descartáveis (`teste+rls...@example.com`) e verifica que uma não lê, não altera e
  não cria dados da outra. Depois, se quiser, apague essas contas em **Authentication → Users**.
- `npm run test:paginas` (opcional): com o app rodando (`npm run dev`), confere que a primeira
  visita abre direto nos filmes, com a faixa "Mostrando filmes de todos os streamings.". Para testar
  o site publicado: `SITE_URL=https://seu-site.vercel.app npm run test:paginas`.

## Onde fica cada coisa

| Pasta | O que tem |
|---|---|
| `src/app/` | As páginas: início, `/streamings`, `/sugestoes`, `/busca`, `/filme/[id]`, `/entrar` |
| `src/components/` | Peças da tela: pôster, fileiras, destaque, abas, botões de marcar, topo |
| `src/lib/tmdb/` | Conversa com o TMDB (só no servidor) |
| `src/lib/movies/` | Listas, filtros, busca e detalhe dos filmes |
| `src/lib/providers/` | Streamings e em quais deles cada filme está |
| `src/lib/auth/`, `src/lib/supabase/` | Login, sessão e conexão com o Supabase |
| `src/lib/marks/`, `src/lib/settings/` | Listas "Quero assistir"/"Já assisti" e streamings na conta |
| `src/proxy.ts` | Renova o login a cada página |
| `supabase/schema.sql` | Tabelas e regras de segurança do banco |
| `tests/`, `tests-integration/` | Testes automáticos e o teste de segurança |

## Publicar (Vercel, grátis)

O código fica no GitHub e a Vercel publica o site a partir dele. As chaves **não** vão para o GitHub
(o arquivo `.env.local` é ignorado pelo git); elas são cadastradas direto na Vercel.

1. **GitHub:** crie um repositório vazio em github.com (sem README) e, na pasta raiz do curso, rode:
   ```bash
   git remote add origin https://github.com/<seu-usuario>/<nome-do-repositorio>.git
   git push -u origin main
   ```
2. **Vercel:** entre em vercel.com com a conta do GitHub → **Add New… → Project** → importe o repositório.
3. Em **Root Directory**, escolha `catalogo-filmes` (o app fica nessa subpasta).
4. Em **Environment Variables**, adicione as três variáveis do seu `.env.local`:
   `TMDB_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Clique em **Deploy**. Em ~1 minuto sai o link `https://<nome>.vercel.app`.

Depois disso, todo `git push` na branch `main` publica uma versão nova sozinho.

## Se algo der errado

- **"Não conseguimos carregar os filmes agora":** confira o `TMDB_TOKEN` (no `.env.local` ou em
  Vercel → Project → Settings → Environment Variables) e, na Vercel, faça um novo deploy.
- **O botão "Entrar" não aparece:** faltam as duas variáveis do Supabase (ou a URL está errada).
  Depois de corrigir, reinicie o `npm run dev` ou faça um novo deploy.
- **"Contas indisponíveis no momento" ou "Não foi possível salvar":** o Supabase não respondeu.
  Confira se o projeto está ativo no painel (projetos grátis pausam depois de um tempo sem uso).
- **Cores estranhas (logo azul, fundo cinza):** alguma extensão de modo escuro do navegador
  (como a Night Eye) está recolorindo o site. Desative-a para este endereço.
