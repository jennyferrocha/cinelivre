import { describe, expect, it } from "vitest";
import { backFallback, backSteps, onLoad, onNavigate, readStack } from "@/lib/back";

/** Simula a sequência: carregamento + navegações (pop = voltar/avançar do navegador). */
function run(start: string, steps: { to: string; pop?: boolean }[], navType = "navigate") {
  let stack = onLoad(["/antigo"], start, navType);
  for (const s of steps) stack = onNavigate(stack, s.to, !!s.pop);
  return stack;
}

describe("backSteps", () => {
  it("volta para a tela anterior do app", () => {
    const stack = run("/?tipo=series", [{ to: "/serie/1" }]);
    expect(backSteps(stack, "/serie/1")).toBe(1);
  });

  it("aberta direto por link: não há para onde voltar no app", () => {
    expect(backSteps(run("/serie/1", []), "/serie/1")).toBeNull();
  });

  it("trocar de temporada não conta como tela anterior (e nunca sai do site)", () => {
    const stack = run("/serie/1", [{ to: "/serie/1?temporada=2" }]);
    expect(backSteps(stack, "/serie/1?temporada=2")).toBeNull();
    const vindo = run("/busca?q=x", [{ to: "/serie/1" }, { to: "/serie/1?temporada=2" }, { to: "/serie/1?temporada=3" }]);
    expect(backSteps(vindo, "/serie/1?temporada=3")).toBe(3);
  });

  it("pula a tela de login depois de entrar", () => {
    const stack = run("/?tipo=series", [{ to: "/serie/1" }, { to: "/entrar?next=%2Fserie%2F1" }, { to: "/serie/1" }]);
    expect(backSteps(stack, "/serie/1")).toBe(3);
  });

  it("voltar do navegador tira a página da trilha; avançar põe de novo", () => {
    let stack = run("/", [{ to: "/serie/1" }, { to: "/", pop: true }]);
    expect(stack).toEqual(["/"]);
    stack = onNavigate(stack, "/serie/1", true); // avançar
    expect(backSteps(stack, "/serie/1")).toBe(1);
  });

  it("A → B → voltar → Voltar na A não sai do site", () => {
    const stack = run("/serie/1", [{ to: "/?tipo=series" }, { to: "/serie/1", pop: true }]);
    expect(backSteps(stack, "/serie/1")).toBeNull();
  });

  it("trilha que não termina na página atual: não confia", () => {
    expect(backSteps(["/", "/serie/2"], "/serie/1")).toBeNull();
  });
});

describe("voltar várias páginas de uma vez", () => {
  it("a trilha encolhe até a página de chegada", () => {
    const stack = run("/busca?q=x", [{ to: "/serie/1" }, { to: "/serie/1?temporada=2" }, { to: "/busca?q=x", pop: true }]);
    expect(stack).toEqual(["/busca?q=x"]);
  });
});

describe("onLoad", () => {
  it("abrir a aba (ou voltar de outro site) começa do zero; recarregar mantém", () => {
    expect(onLoad(["/", "/serie/1"], "/serie/1", "navigate")).toEqual(["/serie/1"]);
    expect(onLoad(["/", "/serie/1"], "/serie/1", "back_forward")).toEqual(["/serie/1"]);
    expect(onLoad(["/", "/serie/1"], "/serie/1", "reload")).toEqual(["/", "/serie/1"]);
    expect(onLoad(["/", "/x"], "/serie/1", "reload")).toEqual(["/serie/1"]);
  });
});

describe("onNavigate", () => {
  it("mesma página não repete; trilha tem no máximo 30", () => {
    expect(onNavigate(["/"], "/", false)).toEqual(["/"]);
    const long = Array.from({ length: 30 }, (_, i) => `/p${i}`);
    expect(onNavigate(long, "/novo", false)).toHaveLength(30);
  });
});

describe("readStack", () => {
  it("sem sessionStorage ou com dado estragado: vazia", () => {
    expect(readStack({ getItem: () => "{x" })).toEqual([]);
    expect(readStack({ getItem: () => JSON.stringify({ a: 1 }) })).toEqual([]);
    expect(
      readStack({
        getItem: () => {
          throw new Error("bloqueado");
        },
      }),
    ).toEqual([]);
    expect(readStack(null)).toEqual([]);
    expect(readStack({ getItem: () => JSON.stringify(["/", 3, "/a"]) })).toEqual(["/", "/a"]);
  });
});

describe("backFallback", () => {
  it("série volta para Séries; filme para a tela inicial", () => {
    expect(backFallback("tv")).toBe("/?tipo=series");
    expect(backFallback("movie")).toBe("/");
  });
});
