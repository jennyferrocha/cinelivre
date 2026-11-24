import { describe, expect, it } from "vitest";
import { formatRating, parseFilterParams, parseRating, pickRandom, RATING_OPTIONS, unavailableLabel } from "@/lib/movies/filters";

describe("parseRating", () => {
  it("aceita as opções 6, 7 e 8", () => {
    expect(RATING_OPTIONS).toEqual([6, 7, 8]);
    expect(parseRating("7")).toBe(7);
    expect(parseRating(["8", "6"])).toBe(8);
  });

  it("ignora valores ausentes ou inválidos", () => {
    expect(parseRating(undefined)).toBeUndefined();
    expect(parseRating("")).toBeUndefined();
    expect(parseRating("abc")).toBeUndefined();
    expect(parseRating("99")).toBeUndefined();
    expect(parseRating("7.5")).toBeUndefined();
    expect(parseRating("5")).toBeUndefined();
  });
});

describe("formatRating", () => {
  it("usa vírgula e uma casa decimal", () => {
    expect(formatRating(7.25)).toBe("7,3");
    expect(formatRating(8)).toBe("8,0");
  });

  it("nota zero não aparece", () => {
    expect(formatRating(0)).toBeNull();
  });
});

describe("parseFilterParams", () => {
  it("lê todos os filtros da URL", () => {
    expect(parseFilterParams({ generos: "35,10749", duracao: "120", nota: "7", desde: "2015" })).toEqual({
      sortBy: "popularity.desc",
      genres: [35, 10749],
      maxRuntime: 120,
      minRating: 7,
      releasedFrom: "2015-01-01",
    });
  });

  it("sem filtros fica só a ordenação", () => {
    expect(parseFilterParams({})).toEqual({ sortBy: "popularity.desc" });
  });

  it("ignora valores inválidos", () => {
    expect(parseFilterParams({ generos: "abc,35", duracao: "-5", nota: "99", desde: "x" })).toEqual({
      sortBy: "popularity.desc",
      genres: [35],
    });
    expect(parseFilterParams({ duracao: "100", desde: "1999" })).toEqual({ sortBy: "popularity.desc" });
  });

  it("aceita gêneros repetidos na URL (?generos=35&generos=28)", () => {
    expect(parseFilterParams({ generos: ["35", "28", "35"] })).toEqual({ sortBy: "popularity.desc", genres: [35, 28] });
  });
});

describe("pickRandom", () => {
  it("lista vazia devolve undefined", () => {
    expect(pickRandom([], () => 0)).toBeUndefined();
  });

  it("usa o sorteio para escolher", () => {
    expect(pickRandom(["a", "b", "c"], () => 0.99)).toBe("c");
    expect(pickRandom(["a", "b", "c"], () => 0)).toBe("a");
  });
});

describe("unavailableLabel", () => {
  it("quem escolheu streamings: o filme pode estar em outro serviço", () => {
    expect(unavailableLabel(true)).toBe("Não está nos seus streamings");
  });

  it("quem não escolheu (o app olhou todos): não está em nenhum", () => {
    expect(unavailableLabel(false)).toBe("Não está em nenhum streaming");
  });
});
