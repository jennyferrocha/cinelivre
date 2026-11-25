import { describe, expect, it } from "vitest";
import { backFallback, canGoBack, nextTrail, readTrail } from "@/lib/back";

describe("nextTrail", () => {
  it("guarda a página atual e a anterior; recarregar não muda", () => {
    expect(nextTrail({}, "/")).toEqual({ last: "/", prev: undefined });
    expect(nextTrail({ last: "/" }, "/serie/1")).toEqual({ last: "/serie/1", prev: "/" });
    expect(nextTrail({ last: "/serie/1", prev: "/" }, "/serie/1")).toEqual({ last: "/serie/1", prev: "/" });
  });
});

describe("canGoBack", () => {
  it("só volta quando a tela anterior é do próprio app", () => {
    expect(canGoBack({ last: "/serie/1", prev: "/" }, "/serie/1")).toBe(true);
    expect(canGoBack({ last: "/serie/1" }, "/serie/1")).toBe(false);
    expect(canGoBack({ last: "/x", prev: "/" }, "/serie/1")).toBe(false);
    expect(canGoBack({ last: "/serie/1", prev: "/serie/1" }, "/serie/1")).toBe(false);
  });
});

describe("readTrail", () => {
  it("sem sessionStorage ou com dado estragado: trilha vazia", () => {
    expect(readTrail({ getItem: () => "{x" })).toEqual({});
    expect(
      readTrail({
        getItem: () => {
          throw new Error("bloqueado");
        },
      }),
    ).toEqual({});
    expect(readTrail(null)).toEqual({});
    expect(readTrail({ getItem: () => JSON.stringify({ last: "/a", prev: "/" }) })).toEqual({ last: "/a", prev: "/" });
  });
});

describe("backFallback", () => {
  it("série volta para Séries; filme para a tela inicial", () => {
    expect(backFallback("tv")).toBe("/?tipo=series");
    expect(backFallback("movie")).toBe("/");
  });
});
