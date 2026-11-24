import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/movie-details.json";
import { brCertification, formatRuntime, getMovieDetails, pickTrailer, withEnglishOverview } from "@/lib/movies/details";
import type { ServiceGroup } from "@/lib/providers/grouping";

const groups: ServiceGroup[] = [
  { key: "hbo-max", name: "HBO Max", logoPath: "/max.jpg", providerIds: [1899, 1825], isChannel: false, priority: 0 },
  { key: "claro-video", name: "Claro video", logoPath: "/claro.jpg", providerIds: [484], isChannel: false, priority: 5 },
];

describe("brCertification", () => {
  it("pega a primeira classificação não vazia do Brasil", () => {
    expect(
      brCertification({
        results: [
          { iso_3166_1: "US", release_dates: [{ certification: "R", type: 3 }] },
          { iso_3166_1: "BR", release_dates: [{ certification: "", type: 1 }, { certification: "14", type: 3 }] },
        ],
      }),
    ).toBe("14");
  });

  it("sem Brasil devolve null", () => {
    expect(brCertification({ results: [{ iso_3166_1: "US", release_dates: [{ certification: "R", type: 3 }] }] })).toBeNull();
    expect(brCertification(undefined)).toBeNull();
  });
});

describe("pickTrailer", () => {
  const v = (type: string, lang: string, key: string, site = "YouTube") => ({ type, iso_639_1: lang, key, site });

  it("prefere trailer do YouTube em português", () => {
    expect(pickTrailer({ results: [v("Trailer", "en", "en1"), v("Teaser", "pt", "tz"), v("Trailer", "pt", "pt1")] })).toBe("pt1");
  });

  it("senão usa o em inglês", () => {
    expect(pickTrailer({ results: [v("Clip", "pt", "c"), v("Trailer", "en", "en1"), v("Trailer", "pt", "vimeo", "Vimeo")] })).toBe("en1");
  });

  it("sem trailer devolve null", () => {
    expect(pickTrailer({ results: [v("Clip", "pt", "c")] })).toBeNull();
    expect(pickTrailer(undefined)).toBeNull();
  });
});

describe("formatRuntime", () => {
  it("formata horas e minutos", () => {
    expect(formatRuntime(125)).toBe("2h05");
    expect(formatRuntime(90)).toBe("1h30");
    expect(formatRuntime(45)).toBe("45min");
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("getMovieDetails (com TMDB simulado)", () => {
  const fetchMock = vi.fn();
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("monta o detalhe a partir da resposta do TMDB", async () => {
    fetchMock.mockResolvedValue(json(fixture));
    const movie = await getMovieDetails(460465, { services: ["hbo-max"], includeFree: false }, groups);

    expect(movie).not.toBeNull();
    expect(movie!.title).toBe("Mortal Kombat");
    expect(movie!.year).toBe("2021");
    expect(movie!.runtime).toBe("1h50");
    expect(movie!.certification).toBe("16");
    expect(movie!.trailerKey).toBeTruthy();
    expect(movie!.genres.length).toBeGreaterThan(0);
    expect(movie!.cast).toHaveLength(6);
    expect(movie!.services.map((s) => s.key)).toEqual(["hbo-max"]);

    const url: string = fetchMock.mock.calls[0][0];
    expect(url).toContain("/movie/460465?");
    expect(url).toContain("append_to_response=videos%2Ccredits%2Crelease_dates%2Cwatch%2Fproviders");
  });

  it("onde assistir: assinatura e grátis do Brasil, sem aluguel/compra, sem repetir e marcando os da pessoa", async () => {
    fetchMock.mockResolvedValue(json(fixture));
    const movie = await getMovieDetails(460465, { services: ["hbo-max"], includeFree: false }, groups);

    // fixture: flatrate 1899 (HBO Max), 484 (Claro), 1825 (HBO Max Amazon Channel → mesmo grupo); buy 2, 10
    expect(movie!.allServicesBR).toEqual([
      { key: "hbo-max", name: "HBO Max", logoUrl: "https://image.tmdb.org/t/p/w92/max.jpg", mine: true },
      { key: "claro-video", name: "Claro video", logoUrl: "https://image.tmdb.org/t/p/w92/claro.jpg", mine: false },
    ]);
  });

  it("sinopse vazia em português busca a em inglês", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes("language=en-US") ? json({ ...fixture, overview: "In English" }) : json({ ...fixture, overview: "" }),
    );
    const movie = await getMovieDetails(460465, null, groups);
    expect(movie!.overview).toBe("In English");
    expect(movie!.services).toEqual([]);
  });

  it("destaque sem sinopse em português ganha a em inglês", async () => {
    fetchMock.mockResolvedValue(json({ ...fixture, overview: "In English" }));
    const card = { id: 460465, overview: "", title: "Mortal Kombat" } as Parameters<typeof withEnglishOverview>[0];
    const result = await withEnglishOverview(card);
    expect(result.overview).toBe("In English");
    expect(fetchMock.mock.calls[0][0]).toContain("language=en-US");
  });

  it("destaque que já tem sinopse não chama o TMDB", async () => {
    const card = { id: 1, overview: "Em português", title: "X" } as Parameters<typeof withEnglishOverview>[0];
    expect(await withEnglishOverview(card)).toBe(card);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("filme que não existe (404) devolve null", async () => {
    fetchMock.mockResolvedValue(json({ success: false }, 404));
    expect(await getMovieDetails(999999999, null, groups)).toBeNull();
  });

  it("outros erros do TMDB continuam sendo erro", async () => {
    fetchMock.mockResolvedValue(json({}, 500));
    await expect(getMovieDetails(1, null, groups)).rejects.toThrow();
  });
});
