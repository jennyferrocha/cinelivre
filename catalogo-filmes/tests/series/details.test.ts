import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceGroup } from "@/lib/providers/grouping";
import {
  brContentRating,
  episodeStatus,
  formatYears,
  getSeason,
  getSeriesDetails,
  getSeriesShape,
  pickSeason,
  seasonsLabel,
  type SeasonSummary,
} from "@/lib/series/details";

const groups: ServiceGroup[] = [
  { key: "netflix", name: "Netflix", logoPath: "", providerIds: [8], isChannel: false, priority: 0 },
];
const sel = { services: ["netflix"], includeFree: false };
const today = new Date("2026-11-24T12:00:00Z");

describe("formatYears", () => {
  it("série que terminou: início–fim; mesmo ano: um ano só", () => {
    expect(formatYears("2011-04-17", "2019-05-19", "Ended")).toBe("2011–2019");
    expect(formatYears("2020-01-01", "2020-03-01", "Canceled")).toBe("2020");
  });
  it("série que continua: Desde AAAA", () => {
    expect(formatYears("2019-07-01", "2024-01-01", "Returning Series")).toBe("Desde 2019");
  });
  it("sem datas: vazio", () => {
    expect(formatYears(null, null, "Planned")).toBe("");
  });
});

describe("seasonsLabel", () => {
  it("singular, plural e zero", () => {
    expect(seasonsLabel(1)).toBe("1 temporada");
    expect(seasonsLabel(4)).toBe("4 temporadas");
    expect(seasonsLabel(0)).toBeNull();
  });
});

describe("episodeStatus", () => {
  it("hoje ou antes = exibido", () => {
    expect(episodeStatus("2026-11-24", today)).toEqual({ aired: true });
    expect(episodeStatus("2020-01-01", today)).toEqual({ aired: true });
  });
  it("futuro mostra a estreia; sem data, a definir", () => {
    expect(episodeStatus("2027-03-12", today)).toEqual({ aired: false, label: "Estreia 12/03/2027" });
    expect(episodeStatus(null, today)).toEqual({ aired: false, label: "Data a definir" });
    expect(episodeStatus("", today)).toEqual({ aired: false, label: "Data a definir" });
  });
});

describe("pickSeason", () => {
  const s: SeasonSummary[] = [
    { number: 1, label: "T1", episodeCount: 8 },
    { number: 2, label: "T2", episodeCount: 8 },
    { number: 0, label: "Especiais", episodeCount: 3 },
  ];
  it("usa a temporada pedida quando existe", () => {
    expect(pickSeason("2", s)).toBe(2);
    expect(pickSeason("0", s)).toBe(0);
    expect(pickSeason(["2", "1"], s)).toBe(2);
  });
  it("valor inválido abre a primeira temporada", () => {
    for (const bad of [undefined, "", "abc", "-1", "99", "1.5"]) expect(pickSeason(bad, s)).toBe(1);
  });
  it("sem temporada na URL, abre a preferida (onde a pessoa parou) se existir", () => {
    expect(pickSeason(undefined, s, 2)).toBe(2);
    expect(pickSeason(undefined, s, 7)).toBe(1);
    expect(pickSeason("1", s, 2)).toBe(1);
    expect(pickSeason("abc", s, 2)).toBe(2);
  });

  it("só especiais: abre os especiais; nenhuma: null", () => {
    expect(pickSeason(undefined, [{ number: 0, label: "Especiais", episodeCount: 2 }])).toBe(0);
    expect(pickSeason(undefined, [])).toBeNull();
  });
});

describe("brContentRating", () => {
  it("pega a do Brasil", () => {
    expect(
      brContentRating({ results: [{ iso_3166_1: "US", rating: "TV-MA" }, { iso_3166_1: "BR", rating: "16" }] }),
    ).toBe("16");
    expect(brContentRating({ results: [{ iso_3166_1: "US", rating: "TV-MA" }] })).toBeNull();
    expect(brContentRating(undefined)).toBeNull();
  });
});

describe("getSeriesDetails e getSeason (com TMDB simulado)", () => {
  const fetchMock = vi.fn();
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
  const series = {
    id: 10,
    name: "Série X",
    overview: "Resumo",
    poster_path: "/p.jpg",
    backdrop_path: "/b.jpg",
    vote_average: 8.4,
    first_air_date: "2019-01-01",
    last_air_date: "2024-05-01",
    status: "Ended",
    number_of_seasons: 2,
    last_episode_to_air: { season_number: 2, episode_number: 8, air_date: "2024-05-01" },
    next_episode_to_air: null,
    genres: [{ id: 18, name: "Drama" }],
    seasons: [
      { season_number: 0, name: "Especiais", episode_count: 2 },
      { season_number: 2, name: "Temporada 2", episode_count: 8 },
      { season_number: 1, name: "Temporada 1", episode_count: 10 },
      { season_number: 3, name: "Temporada 3", episode_count: 0 },
    ],
    content_ratings: { results: [{ iso_3166_1: "BR", rating: "14" }] },
    aggregate_credits: { cast: [{ name: "A" }, { name: "B" }] },
    videos: { results: [] },
    "watch/providers": {
      results: { BR: { flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.png" }] } },
    },
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/tv/10/season/1")) {
        return json({
          season_number: 1,
          episodes: [
            { episode_number: 1, name: "Piloto", overview: "x", runtime: 45, air_date: "2019-01-01", still_path: "/s.jpg" },
            { episode_number: 2, name: "Depois", overview: "", runtime: null, air_date: "2027-03-12", still_path: null },
          ],
        });
      }
      if (url.includes("/tv/10?") || url.endsWith("/tv/10")) return json(series);
      return new Response("{}", { status: 404 });
    });
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("monta a série com temporadas em ordem e especiais no fim", async () => {
    const d = await getSeriesDetails(10, sel, groups);
    expect(d).toMatchObject({
      id: 10,
      kind: "tv",
      title: "Série X",
      years: "2019–2024",
      seasonsLabel: "2 temporadas",
      genres: ["Drama"],
      certification: "14",
      cast: ["A", "B"],
    });
    expect(d!.seasons).toEqual([
      { number: 1, label: "T1", episodeCount: 10 },
      { number: 2, label: "T2", episodeCount: 8 },
      { number: 0, label: "Especiais", episodeCount: 2 },
    ]);
    expect(d!.services.map((s) => s.key)).toEqual(["netflix"]);
    expect(d!.allServicesBR).toEqual([
      { key: "netflix", name: "Netflix", logoUrl: "https://image.tmdb.org/t/p/w92/n.png", mine: true },
    ]);
  });

  it("traz o formato da série para calcular o progresso", async () => {
    const d = await getSeriesDetails(10, sel, groups);
    expect(d!.shape).toEqual({
      seasons: [
        { number: 1, episodeCount: 10 },
        { number: 2, episodeCount: 8 },
      ],
      lastAired: { season: 2, episode: 8 },
      finished: true,
      nextAirDate: null,
    });
    expect(await getSeriesShape(10)).toEqual(d!.shape);
    expect(await getSeriesShape(99)).toBeNull();
  });

  it("série que não existe = null", async () => {
    expect(await getSeriesDetails(99, sel, groups)).toBeNull();
  });

  it("episódios com duração, imagem e estreia futura", async () => {
    const eps = await getSeason(10, 1, today);
    expect(eps).toEqual([
      {
        number: 1,
        title: "Piloto",
        overview: "x",
        runtime: "45min",
        stillUrl: "https://image.tmdb.org/t/p/w300/s.jpg",
        status: { aired: true },
      },
      {
        number: 2,
        title: "Depois",
        overview: "",
        runtime: null,
        stillUrl: null,
        status: { aired: false, label: "Estreia 12/03/2027" },
      },
    ]);
  });

  it("temporada que não existe = null", async () => {
    expect(await getSeason(10, 9, today)).toBeNull();
  });
});
