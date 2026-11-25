import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceGroup } from "@/lib/providers/grouping";
import { buildTvDiscoverParams, discoverSeries, SERIES_ROWS, toSeriesCard } from "@/lib/series/discover";
import type { TmdbTvListItem } from "@/lib/tmdb/types";

const groups: ServiceGroup[] = [
  { key: "netflix", name: "Netflix", logoPath: "", providerIds: [8], isChannel: false, priority: 0 },
];
const sel = { services: ["netflix"], includeFree: false };

const item = (over: Partial<TmdbTvListItem> = {}): TmdbTvListItem => ({
  id: 1,
  name: "Série",
  poster_path: "/p.jpg",
  backdrop_path: "/b.jpg",
  vote_average: 8.456,
  first_air_date: "2011-04-17",
  genre_ids: [18],
  overview: "",
  ...over,
});

describe("buildTvDiscoverParams", () => {
  it("usa os streamings da pessoa e tira notícias e talk shows", () => {
    expect(buildTvDiscoverParams(sel, groups, { sortBy: "popularity.desc" }, 2)).toMatchObject({
      watch_region: "BR",
      with_watch_providers: "8",
      with_watch_monetization_types: "flatrate|ads",
      sort_by: "popularity.desc",
      page: 2,
      without_genres: "10763|10767",
      include_adult: "false",
    });
  });

  it("datas usam a estreia da série; duração não se aplica", () => {
    const p = buildTvDiscoverParams(
      sel,
      groups,
      { sortBy: "popularity.desc", releasedFrom: "2025-01-01", releasedTo: "2025-12-31", maxRuntime: 30 },
      1,
    );
    expect(p["first_air_date.gte"]).toBe("2025-01-01");
    expect(p["first_air_date.lte"]).toBe("2025-12-31");
    expect(p).not.toHaveProperty("primary_release_date.gte");
    expect(p).not.toHaveProperty("with_runtime.lte");
  });

  it("nota mínima e gêneros", () => {
    const p = buildTvDiscoverParams(sel, groups, { sortBy: "vote_average.desc", minRating: 8, genres: [18] }, 1);
    expect(p).toMatchObject({ "vote_average.gte": 8, "vote_count.gte": 50, with_genres: "18" });
  });
});

describe("toSeriesCard", () => {
  it("vira cartão de série", () => {
    expect(toSeriesCard(item({ id: 1399, name: "GoT" }), [])).toMatchObject({
      id: 1399,
      kind: "tv",
      title: "GoT",
      year: "2011",
      rating: 8.5,
      posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
    });
  });

  it("sem data, ano vazio", () => {
    expect(toSeriesCard(item({ first_air_date: "" }), []).year).toBe("");
  });
});

describe("SERIES_ROWS", () => {
  it("tem as fileiras combinadas", () => {
    expect(SERIES_ROWS.map((r) => r.id)).toEqual([
      "em-alta",
      "bem-avaliadas",
      "estreias",
      "drama",
      "comedia",
      "crime",
      "ficcao",
      "animacao",
    ]);
    expect(SERIES_ROWS.find((r) => r.id === "ficcao")!.filters(new Date()).genres).toEqual([10765]);
  });
});

describe("discoverSeries (com TMDB simulado)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
    fetchMock.mockImplementation(async (url: string) => {
      const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
      if (url.includes("/discover/tv")) {
        return json({ page: 1, total_pages: 1, total_results: 2, results: [item({ id: 1 }), item({ id: 2 })] });
      }
      if (url.includes("/tv/1/watch/providers")) {
        return json({ results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "" }] } } });
      }
      if (url.includes("/tv/2/watch/providers")) {
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

  it("só séries com oferta de assinatura/grátis, conferindo /tv/{id}", async () => {
    const result = await discoverSeries(sel, groups, { sortBy: "popularity.desc" });
    expect(result.map((c) => c.id)).toEqual([1]);
    expect(result[0].kind).toBe("tv");
    expect(result[0].services.map((s) => s.key)).toEqual(["netflix"]);
    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls.some((u) => u.includes("/movie/"))).toBe(false);
  });
});
