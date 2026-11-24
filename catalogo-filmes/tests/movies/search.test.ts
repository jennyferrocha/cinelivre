import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeQuery, searchMovies } from "@/lib/movies/search";
import type { ServiceGroup } from "@/lib/providers/grouping";

const groups: ServiceGroup[] = [
  { key: "netflix", name: "Netflix", logoPath: "", providerIds: [8], isChannel: false, priority: 0 },
];

const item = (id: number) => ({
  id,
  title: `Filme ${id}`,
  poster_path: null,
  backdrop_path: null,
  vote_average: 7,
  release_date: "2020-01-01",
  genre_ids: [],
  overview: "",
});

describe("normalizeQuery", () => {
  it("vazio ou só espaços vira null", () => {
    expect(normalizeQuery("   ")).toBeNull();
    expect(normalizeQuery("")).toBeNull();
    expect(normalizeQuery(undefined)).toBeNull();
  });

  it("tira espaços das pontas e mantém acentos e símbolos", () => {
    expect(normalizeQuery("  ação & cia ")).toBe("ação & cia");
  });

  it("usa o primeiro valor quando vem repetido", () => {
    expect(normalizeQuery(["duna", "x"])).toBe("duna");
  });
});

describe("searchMovies (com TMDB simulado)", () => {
  const fetchMock = vi.fn();
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/search/movie")) {
        return json({ page: 1, total_pages: 1, total_results: 3, results: [item(1), item(2), item(3)] });
      }
      if (url.includes("/movie/2/watch/providers")) {
        return json({ results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "" }] } } });
      }
      return json({ results: {} });
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("codifica a busca e não traz filmes adultos", async () => {
    await searchMovies("ação & cia", null, groups);
    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toMatch(/query=a%C3%A7%C3%A3o(\+|%20)%26(\+|%20)cia/);
    expect(url).toContain("include_adult=false");
  });

  it("filmes nos streamings da pessoa vêm primeiro, mantendo a ordem", async () => {
    const movies = await searchMovies("filme", { services: ["netflix"], includeFree: false }, groups);
    expect(movies.map((m) => m.id)).toEqual([2, 1, 3]);
    expect(movies[0].services.map((s) => s.name)).toEqual(["Netflix"]);
    expect(movies[1].services).toEqual([]);
  });

  it("sem seleção mostra tudo, sem etiqueta e sem consultar streamings", async () => {
    const movies = await searchMovies("filme", null, groups);
    expect(movies.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(movies.every((m) => m.services.length === 0)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
