# CineLivre — Contas e listas (etapa 2) — Design

Data: 2026-11-24 · Status: aprovado pela autora em 2026-11-24 · Continua: `2026-11-24-catalogo-filmes-design.md`

## 1. Intenção

Deixar a pessoa **guardar o que quer ver e o que já viu**, e usar isso para o app sugerir melhor:
o que ela já assistiu sai das sugestões. Para as listas (e a escolha de streamings) acompanharem a
pessoa entre aparelhos, ela pode **entrar com e-mail e senha** (Supabase).

O app continua servindo quem só recebeu o link e quer uma sugestão rápida: **nada exige conta**,
exceto marcar filmes.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Marcar um filme como **"Quero assistir"** ou **"Já assisti"** no pôster e na página do filme.
- **Abas na tela inicial:** "Para você" (as fileiras de hoje), "Quero assistir", "Já assisti".
- **Entrar / criar conta / sair** com e-mail e senha.
- Com login, filmes de "Já assisti" **somem** do destaque, do Top 10, das fileiras, de
  "O que eu assisto hoje?" e do "Me surpreenda".
- A **escolha de streamings fica na conta** e vale em qualquer aparelho em que a pessoa entrar.

**Não-objetivos (agora)**
- Login com Google/Apple, confirmação de e-mail, perfil com foto ou nome, apagar conta pelo app.
- **"Esqueci minha senha"** (decisão da autora): o e-mail padrão do Supabase só envia para a equipe do
  projeto e poucos por hora; para todos, exigiria um serviço de e-mail (SMTP, ex.: Resend) e
  provavelmente um domínio próprio. Volta numa etapa futura. Até lá, quem esquecer cria outra conta.
- Notas/estrelas próprias, comentários, listas compartilhadas, recomendações pelo gosto.
- Séries (continua só filmes).

**Anti-objetivos** (seria um fracasso mesmo funcionando)
- Exigir conta para usar o app ou empurrar a pessoa para um cadastro antes de ela ver qualquer filme.
- Uma pessoa conseguir ler ou alterar as listas de outra.
- Filmes já assistidos aparecerem por um instante e depois sumirem (nada de "piscar").
- A chave secreta do Supabase (`service_role`) ou a do TMDB chegarem ao navegador ou ao git.
- Perder as marcações ou a escolha de streamings de alguém sem aviso.

## 3. Restrições

- **Supabase** (plano grátis): Auth (e-mail e senha) + Postgres. Pacotes `@supabase/supabase-js` e
  `@supabase/ssr` (as únicas dependências novas).
- **Confirmação de e-mail desligada** (decisão da autora): a conta vale logo após o cadastro. Custo
  aceito: alguém pode criar conta com o e-mail de outra pessoa; o app só guarda listas de filmes.
- **Chaves:** só a URL do projeto e a chave pública (`publishable`/`anon`) vão para o app, em variáveis
  de ambiente (`.env.local` e Vercel). A `service_role` nunca é usada pelo app.
- **Segurança no banco:** Row Level Security ligada em todas as tabelas; cada pessoa só lê e altera as
  próprias linhas (`auth.uid() = user_id`). Isso vale mesmo que alguém chame o Supabase direto do
  navegador com a chave pública.
- **Next 16 com Cache Components:** tudo que lê a sessão fica atrás de `<Suspense>` (guia
  `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`); a sessão
  é renovada pelo `proxy` do Next (antigo middleware), como o `@supabase/ssr` recomenda.
- Continuam valendo as restrições do design da etapa 1 (pt-BR, Brasil, TMDB só no servidor, créditos,
  375px sem rolagem lateral, quem acompanha é iniciante: tarefas pequenas, cada uma com algo para ver).

## 4. Abordagens consideradas

| Abordagem | Trade-off |
|---|---|
| **A. Login e listas no servidor (Supabase Auth + `@supabase/ssr` + tabelas com RLS)** (escolhida) | Mesmo formato do app (servidor monta tudo); filmes vistos saem antes de a página chegar; mais conceitos novos (cookie de sessão, RLS) |
| B. Login e listas só no navegador | Mais simples, mas a página chega com os filmes vistos e depois os esconde (pisca); vai contra a arquitetura atual |
| C. Auth.js para login + Supabase só como banco | Peça extra sem ganho: o Supabase já faz o login |

## 5. O que foi decidido (comportamento)

### 5.1 Entrar, criar conta, sair
- Topo: quem não entrou vê **"Entrar"**; quem entrou vê um ícone de perfil com o e-mail e **"Sair"**.
- Tela **/entrar**: e-mail + senha, botão "Entrar" e link "Criar conta" (mesma tela, alterna o modo).
  Sem "Esqueci minha senha" (ver não-objetivos). Erros em português ("E-mail ou senha incorretos", "Este e-mail já tem conta",
  "A senha precisa ter pelo menos 6 caracteres").
- Depois de entrar ou criar conta, a pessoa **volta para onde estava**. Se ela entrou porque tocou num
  botão de marcar, o filme **já fica marcado** ao voltar.
- Sair: volta para a tela inicial, sem listas; a escolha de streamings do aparelho continua (ver 5.5).

### 5.2 Marcar filmes
- **Pôster (MovieCard):** um ícone pequeno no canto superior direito: 🔖 "Quero assistir" (vazado/
  cheio) e, ao lado ou num toque longo, ✓ "Já assisti". Toque rápido, sem sair da fileira.
- **Página do filme:** dois botões grandes: "＋ Quero assistir" / "✓ Já assisti", que mostram o estado
  atual ("✓ Na sua lista", "✓ Você já assistiu") e desmarcam ao tocar de novo.
- **Um filme fica em uma lista por vez:** marcar "Já assisti" tira de "Quero assistir" (e vice-versa).
- **Sem login:** tocar em qualquer um dos botões leva a /entrar (ver 5.1).
- A mudança aparece na hora (o botão muda antes de o servidor responder); se der erro, volta ao estado
  anterior e mostra "Não foi possível salvar. Tente de novo."

### 5.3 Abas da tela inicial
```
CineLivre      ( 🔍 Buscar filme )  ⚙  [Entrar]
 [ Para você ]  Quero assistir  ·  Já assisti
 ─────────────
```
- **Para você:** a tela inicial de hoje (destaque, filtro de nota, fileiras).
- **Quero assistir:** grade com todos os filmes marcados, do mais recente para o mais antigo. Os que
  estão nos streamings da pessoa mostram a etiqueta do serviço; os que **não** estão (ou saíram)
  mostram "Não está nos seus streamings", como na busca. Nunca some um filme da lista sozinho.
- **Já assisti:** grade com os filmes marcados, do mais recente para o mais antigo.
- **Sem login:** as abas de lista mostram um convite: "Entre para guardar os filmes que você quer ver"
  com o botão "Entrar". Lista vazia: "Você ainda não marcou nenhum filme." com dica de onde marcar.
- A aba escolhida fica no endereço (ex.: `/?aba=quero`) para recarregar e compartilhar o link certo.

### 5.4 Esconder o que já assistiu
- Com login, os filmes em "Já assisti" são removidos **no servidor**, antes de a página ser enviada,
  de: destaque, Top 10, todas as fileiras, "O que eu assisto hoje?" e "Me surpreenda".
- **Busca** continua mostrando todos (serve para achar um filme específico), com o selo "✓ Já assisti".
- **Página do filme** abre normalmente, com o botão "✓ Você já assistiu" marcado.

### 5.5 Streamings na conta
- Ao **salvar** os streamings com login, a escolha vai para a conta (e também para o cookie do aparelho).
- Ao **entrar** num aparelho: se a conta já tem uma escolha, **vale a da conta** (substitui a do
  aparelho). Se a conta ainda não tem (primeiro login), a escolha do aparelho é copiada para a conta.
- Ao **sair**, o aparelho mantém a última escolha no cookie, e o app continua funcionando sem conta.
- **Enquanto está logada, a conta é a fonte da verdade:** cada página lê a escolha de `user_settings`
  (uma consulta por pedido). Mudar no celular já vale no notebook logado, sem entrar de novo.
- Quando, ao entrar, a escolha da conta **substitui uma diferente** do aparelho, aparece um aviso
  curto: "Usando os streamings da sua conta." (nada some sem aviso).

## 6. Dados (referência para quem constrói)

Tabelas no Supabase (schema `public`, RLS ligada, políticas só para o dono):

- `movie_marks`: `user_id uuid` (→ `auth.users`, apagar em cascata), `movie_id int`,
  `status text` ('quero' | 'assisti'), `title text`, `year text`, `poster_path text null`,
  `rating numeric`, `marked_at timestamptz default now()`. Chave primária `(user_id, movie_id)`: um
  filme só pode estar numa lista por vez.
- `user_settings`: `user_id uuid` (chave primária), `services text[]`, `include_free boolean`,
  `updated_at timestamptz`.
- O título, ano, pôster e nota são **guardados junto com a marcação** para as abas abrirem rápido sem
  consultar o TMDB filme a filme; só a etiqueta de streaming é conferida na hora (mesma verificação
  por filme da etapa 1).
- O SQL de criação (tabelas + políticas) fica versionado no repositório e a autora roda uma vez no
  painel do Supabase (SQL Editor), com orientação.

## 7. Decisões minhas (a autora pode revisar)

- **Senha mínima de 6 caracteres** (padrão do Supabase).
- **Busca mostra os já assistidos** com selo; só as sugestões os escondem.
- **Uma lista por vez** por filme; marcar uma tira da outra.
- **Aba "Quero assistir" mostra todos**, inclusive os fora dos streamings, com etiqueta.
- **Dados do filme guardados na marcação** (título, ano, pôster, nota), em vez de buscar no TMDB.
- **Vale a escolha de streamings da conta** ao entrar; a do aparelho só é copiada se a conta não tiver.
- **Aba no endereço** (`?aba=`), como os filtros.
- **Streamings lidos da conta a cada página** enquanto logada (não só no momento do login), com o
  aviso acima quando substituem a escolha do aparelho.
- **Teste das regras de segurança (RLS):** um teste separado e opcional (`npm run test:seguranca`),
  fora do `npm test`, que roda contra o projeto real: cria duas contas descartáveis só com a chave
  pública (possível porque a confirmação de e-mail está desligada) e confere que uma não lê nem altera
  as marcações da outra. Não usa a `service_role`. As contas de teste usam e-mails
  `teste+<aleatório>@example.com` e podem ser apagadas no painel.
- Como os filmes vistos saem das fileiras, uma fileira pode ficar mais curta; se ficar com menos de
  ~8 filmes, buscar mais uma página do TMDB para completar.

## 8. Deixado para quem constrói

- Estrutura de arquivos, nomes de componentes e onde fica o cliente do Supabase (servidor x navegador).
- Ícones e animação dos botões de marcar; layout exato das abas no celular.
- Como invalidar o cache das listas depois de marcar (ex.: `revalidatePath`/`cacheTag`).
- Mensagens de erro exatas além das citadas.
- Testes: o suficiente para garantir que (1) filmes "Já assisti" nunca aparecem nas sugestões com
  login, (2) uma pessoa não lê nem altera marcações de outra (testar as políticas RLS), (3) entrar
  preserva o filme que a pessoa tentou marcar, (4) a regra de streamings da conta x aparelho.
- Passos para a autora: criar o projeto no Supabase, rodar o SQL, desligar "Confirm email" em
  Authentication → Providers → Email, copiar URL e chave pública para `.env.local` e Vercel.
