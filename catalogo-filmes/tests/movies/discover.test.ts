import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  attachServices,
  buildDiscoverParams,
  discoverMovies,
  HOME_ROWS,
  pickHero,
  toMovieCard,
  withMinRating,
  type MovieCard,
} from "@/lib/movies/discover";
import { FREE_PROVIDER_IDS } from "@/lib/providers/free";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { TmdbMovieListItem } from "@/lib/tmdb/types";

const groups: ServiceGroup[] = [
  { key: "netflix", name: "Netflix", logoPath: "", providerIds: [8, 1796], isChannel: false, priority: 0 },
  { key: "hbo-max", name: "HBO Max", logoPath: "", providerIds: [1899], isChannel: false, priority: 10 },
];

const popular = { sortBy: "popularity.desc" } as const;

describe("buildDiscoverParams", () => {
  it("monta streamings pagos sem grátis", () => {
    const params = buildDiscoverParams({ services: ["netflix", "hbo-max"], includeFree: false }, groups, popular, 1);
    expect(params).toEqual({
      watch_region: "BR",
      with_watch_providers: "8|1796|1899",
      with_watch_monetization_types: "flatrate|ads",
      sort_by: "popularity.desc",
      include_adult: "false",
      page: 1,
    });
  });

  it("com grátis inclui os serviços gratuitos", () => {
    const params = buildDiscoverParams({ services: ["netflix"], includeFree: true }, groups, popular, 2);
    expect(params.with_watch_providers).toBe(["8", "1796", ...FREE_PROVIDER_IDS].join("|"));
    expect(params.with_watch_monetization_types).toBe("flatrate|free|ads");
    expect(params.page).toBe(2);
  });

  it("só grátis usa só os serviços gratuitos", () => {
    const params = buildDiscoverParams({ services: [], includeFree: true }, groups, popular, 1);
    expect(params.with_watch_providers).toBe(FREE_PROVIDER_IDS.join("|"));
  });

  it("aplica os filtros", () => {
    const params = buildDiscoverParams({ services: ["netflix"], includeFree: false }, groups, {
      sortBy: "vote_average.desc",
      genres: [35, 10749],
      maxRuntime: 120,
      minRating: 7,
      minVotes: 300,
      releasedFrom: "2015-01-01",
      releasedTo: "2026-11-24",
    }, 1);
    expect(params).toMatchObject({
      sort_by: "vote_average.desc",
      with_genres: "35|10749",
      "with_runtime.lte": 120,
      "vote_average.gte": 7,
      "vote_count.gte": 300,
      "primary_release_date.gte": "2015-01-01",
      "primary_release_date.lte": "2026-11-24",
    });
  });

  it("nota mínima sem mínimo de votos usa 50 votos", () => {
    const params = buildDiscoverParams({ services: ["netflix"], includeFree: false }, groups, { ...popular, minRating: 8 }, 1);
    expect(params["vote_count.gte"]).toBe(50);
  });
});

describe("withMinRating", () => {
  const sel = { services: ["netflix"], includeFree: false };
  const today = new Date("2026-11-24T12:00:00Z");
  const row = (id: string) => HOME_ROWS.find((r) => r.id === id)!.filters(today);

  it("em alta com nota 7 pede 7+ e 50 votos", () => {
    const params = buildDiscoverParams(sel, groups, withMinRating(row("em-alta"), 7), 1);
    expect(params["vote_average.gte"]).toBe(7);
    expect(params["vote_count.gte"]).toBe(50);
  });

  it("bem avaliados mantém o mínimo maior de votos", () => {
    const params = buildDiscoverParams(sel, groups, withMinRating(row("bem-avaliados"), 7), 1);
    expect(params["vote_average.gte"]).toBe(7);
    expect(params["vote_count.gte"]).toBe(300);
  });

  it("sem nota não muda os filtros", () => {
    const filters = row("em-alta");
    expect(withMinRating(filters, undefined)).toBe(filters);
    expect(buildDiscoverParams(sel, groups, withMinRating(filters, undefined), 1)).not.toHaveProperty("vote_average.gte");
  });
});

describe("HOME_ROWS", () => {
  it("tem as fileiras na ordem da tela inicial", () => {
    expect(HOME_ROWS.map((r) => r.title)).toEqual([
      "Em alta esta semana",
      "Bem avaliados",
      "Lançamentos recentes",
      "Comédia",
      "Ação",
      "Terror",
      "Romance",
      "Animação",
    ]);
  });

  it("bem avaliados exige 300 votos", () => {
    const row = HOME_ROWS.find((r) => r.id === "bem-avaliados")!;
    expect(row.filters(new Date("2026-11-24"))).toEqual({ sortBy: "vote_average.desc", minVotes: 300 });
  });

  it("lançamentos recentes cobre os últimos 365 dias", () => {
    const row = HOME_ROWS.find((r) => r.id === "lancamentos")!;
    expect(row.filters(new Date("2026-11-24T12:00:00Z"))).toEqual({
      sortBy: "popularity.desc",
      releasedFrom: "2025-11-24",
      releasedTo: "2026-11-24",
    });
  });

  it("fileira de gênero filtra pelo gênero", () => {
    const row = HOME_ROWS.find((r) => r.title === "Romance")!;
    expect(row.filters(new Date())).toEqual({ sortBy: "popularity.desc", genres: [10749] });
  });
});

const item = (over: Partial<TmdbMovieListItem> = {}): TmdbMovieListItem => ({
  id: 1,
  title: "Filme",
  poster_path: "/p.jpg",
  backdrop_path: "/b.jpg",
  vote_average: 8.14,
  release_date: "2021-05-02",
  genre_ids: [18],
  overview: "",
  ...over,
});

describe("toMovieCard", () => {
  it("converte o filme do TMDB", () => {
    expect(toMovieCard(item(), [])).toEqual({
      id: 1,
      title: "Filme",
      overview: "",
      year: "2021",
      posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/w1280/b.jpg",
      rating: 8.1,
      genreIds: [18],
      services: [],
    });
  });

  it("aguenta filme sem data e sem imagens", () => {
    const card = toMovieCard(item({ release_date: "", poster_path: null, backdrop_path: null }), []);
    expect(card.year).toBe("");
    expect(card.posterUrl).toBeNull();
    expect(card.backdropUrl).toBeNull();
  });
});

describe("pickHero", () => {
  const card = (id: number, backdropUrl: string | null) => ({ ...toMovieCard(item({ id }), []), backdropUrl }) as MovieCard;

  it("pula filmes sem imagem de fundo", () => {
    expect(pickHero([card(1, null), card(2, "x")])?.id).toBe(2);
  });

  it("devolve null sem candidatos", () => {
    expect(pickHero([])).toBeNull();
    expect(pickHero([card(1, null)])).toBeNull();
  });
});

describe("discoverMovies e attachServices (com TMDB simulado)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
    fetchMock.mockImplementation(async (url: string) => {
      const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
      if (url.includes("/discover/movie")) {
        return json({ page: 1, total_pages: 1, total_results: 3, results: [item({ id: 1 }), item({ id: 2 }), item({ id: 1 })] });
      }
      if (url.includes("/movie/1/watch/providers")) {
        return json({ results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "" }] } } });
      }
      if (url.includes("/movie/2/watch/providers")) {
        // só para alugar: não conta
        return json({ results: { BR: { rent: [{ provider_id: 8, provider_name: "Netflix", logo_path: "" }] } } });
      }
      return new Response("{}", { status: 404 });
    });
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const selection = { services: ["netflix"], includeFree: false };

  it("descarta filmes fora dos streamings da pessoa, remove repetidos e põe etiquetas", async () => {
    const movies = await discoverMovies(selection, groups, popular);
    expect(movies.map((m) => m.id)).toEqual([1]);
    expect(movies[0].services).toEqual([{ key: "netflix", name: "Netflix", free: false }]);
  });

  it("attachServices pode manter os indisponíveis (para a busca)", async () => {
    const movies = await attachServices([item({ id: 1 }), item({ id: 2 })], selection, groups, { keepUnavailable: true });
    expect(movies.map((m) => [m.id, m.services.length])).toEqual([
      [1, 1],
      [2, 0],
    ]);
  });

  it("sem seleção, attachServices marca tudo como indisponível", async () => {
    const movies = await attachServices([item({ id: 1 })], null, groups, { keepUnavailable: true });
    expect(movies[0].services).toEqual([]);
  });
});
