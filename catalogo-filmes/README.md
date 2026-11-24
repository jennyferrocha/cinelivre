# CineLivre

Catálogo de filmes que mostra só o que está disponível agora nos streamings que você assina, no Brasil.
Dados: [TMDB](https://www.themoviedb.org/) e JustWatch.

## Rodar no computador

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e cole o seu token do TMDB
   (themoviedb.org → Configurações → API → "API Read Access Token").
3. Rode `npm run dev` e abra http://localhost:3000

## Contas (Supabase, opcional)

Sem estas variáveis o app funciona normalmente, só sem login e listas.

1. Crie um projeto em supabase.com e, em **Authentication → Sign In / Providers → Email**, desligue
   **Confirm email**.
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Em **Table Editor** devem aparecer `movie_marks` e `user_settings` com o selo de RLS ligado.
3. Em **Project Settings → API Keys** (e **Data API** para a URL), copie a **Project URL** e a chave
   **publishable** (ou **anon public**) para o `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
   ⚠️ Nunca use a chave **secret / service_role**: ela ignora as regras de segurança.
4. Reinicie o `npm run dev`.

## Testes

`npm test`

## Publicar (Vercel, grátis)

O código fica no GitHub e a Vercel publica o site a partir dele. O token do TMDB **não** vai para o
GitHub (o arquivo `.env.local` é ignorado pelo git); ele é cadastrado direto na Vercel.

1. **GitHub:** crie um repositório vazio em github.com (sem README) e, na pasta raiz do curso, rode:
   ```bash
   git remote add origin https://github.com/<seu-usuario>/<nome-do-repositorio>.git
   git push -u origin main
   ```
2. **Vercel:** entre em vercel.com com a conta do GitHub → **Add New… → Project** → importe o repositório.
3. Em **Root Directory**, escolha `catalogo-filmes` (o app fica nessa subpasta).
4. Em **Environment Variables**, adicione `TMDB_TOKEN` com o mesmo valor do seu `.env.local`.
5. Clique em **Deploy**. Em ~1 minuto sai o link `https://<nome>.vercel.app`.

Depois disso, todo `git push` na branch `main` publica uma versão nova sozinho.

**Se o site abrir com "Não conseguimos carregar os filmes agora":** confira se o `TMDB_TOKEN` está
certo em Vercel → Project → Settings → Environment Variables e faça um novo deploy.
