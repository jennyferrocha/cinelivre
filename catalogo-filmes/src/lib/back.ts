// Regra da seta "← Voltar". Guarda na sessão do navegador a trilha de páginas que a pessoa
// abriu dentro do CineLivre nesta aba, espelhando o histórico (o voltar do navegador tira a
// última). A seta volta pelo histórico até a tela anterior de verdade, pulando outras
// temporadas da mesma página e a tela de login. Sem tela anterior no app, vai para Séries/Filmes.

export type Stack = string[];

export const STACK_KEY = "cinelivre-trilha";
const MAX = 30;

const pathOf = (url: string) => url.split("?")[0];

/**
 * Página carregada do zero. Recarregar mantém a trilha; abrir a aba, um link ou voltar de
 * outro site começa uma nova (não dá para saber o que há antes no histórico).
 */
export function onLoad(stack: Stack, current: string, navType: string): Stack {
  return navType === "reload" && stack.at(-1) === current ? stack : [current];
}

/** Troca de página dentro do app. `pop` = veio do voltar/avançar do navegador. */
export function onNavigate(stack: Stack, current: string, pop: boolean): Stack {
  if (stack.at(-1) === current) return stack;
  if (pop) {
    // Voltou (uma ou várias páginas): a trilha encolhe até a página de chegada.
    const i = stack.lastIndexOf(current);
    if (i >= 0) return stack.slice(0, i + 1);
  }
  return [...stack, current].slice(-MAX);
}

/**
 * Quantas páginas voltar no histórico para chegar à tela anterior (outra página, que não seja
 * o login). null = não há tela anterior do app (a seta usa o destino padrão).
 */
export function backSteps(stack: Stack, current: string): number | null {
  if (stack.at(-1) !== current) return null; // trilha desatualizada: não confia
  for (let i = stack.length - 2; i >= 0; i--) {
    const path = pathOf(stack[i]);
    if (path === pathOf(current) || path === "/entrar") continue;
    return stack.length - 1 - i;
  }
  return null;
}

export function readStack(storage: Pick<Storage, "getItem"> | null): Stack {
  try {
    const raw = storage?.getItem(STACK_KEY);
    const data: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeStack(storage: Pick<Storage, "setItem"> | null, stack: Stack): void {
  try {
    storage?.setItem(STACK_KEY, JSON.stringify(stack));
  } catch {
    // sem sessionStorage: a seta usa o destino padrão
  }
}

/** Para onde a seta vai quando não há tela anterior no app. */
export function backFallback(kind: "tv" | "movie"): string {
  return kind === "tv" ? "/?tipo=series" : "/";
}
