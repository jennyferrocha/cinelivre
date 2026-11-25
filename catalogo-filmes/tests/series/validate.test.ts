import { describe, expect, it } from "vitest";
import { seriesSnapshotFromCard, validEpisodes, validSeriesSnapshot, validStars } from "@/lib/series/validate";

describe("validEpisodes", () => {
  it("aceita episódios no formato do app", () => {
    expect(validEpisodes([{ season: 1, episode: 1 }])).toBe(true);
    expect(validEpisodes([{ season: 0, episode: 3 }, { season: 2, episode: 9999 }])).toBe(true);
  });

  it("recusa qualquer outra coisa", () => {
    const bads: unknown[] = [
      [],
      "x",
      null,
      [{ season: -1, episode: 1 }],
      [{ season: 1000, episode: 1 }],
      [{ season: 1, episode: 0 }],
      [{ season: 1, episode: 10000 }],
      [{ season: 1.5, episode: 1 }],
      [{ season: "1", episode: 1 }],
      [{ season: 1, episode: 1 }, { season: 1, episode: 1 }],
      Array.from({ length: 2001 }, (_, i) => ({ season: 1, episode: i + 1 })),
    ];
    for (const bad of bads) expect(validEpisodes(bad)).toBe(false);
  });
});

describe("validStars", () => {
  it("inteiro de 1 a 5 ou null", () => {
    for (const ok of [1, 5, null]) expect(validStars(ok)).toBe(true);
    for (const bad of [0, 6, 2.5, "3", undefined, Number.NaN]) expect(validStars(bad)).toBe(false);
  });
});

describe("validSeriesSnapshot", () => {
  const ok = { seriesId: 1, title: "X", year: "2020", posterPath: "/a.jpg", rating: 8 };
  it("aceita o formato do app", () => {
    expect(validSeriesSnapshot(ok)).toBe(true);
    expect(validSeriesSnapshot({ ...ok, posterPath: null, year: "" })).toBe(true);
  });
  it("recusa dados forjados", () => {
    for (const bad of [
      { seriesId: -1 },
      { seriesId: 1.5 },
      { title: "" },
      { title: "x".repeat(301) },
      { year: "20" },
      { posterPath: "http://x" },
      { rating: 11 },
      { rating: Number.NaN },
    ])
      expect(validSeriesSnapshot({ ...ok, ...bad })).toBe(false);
  });
});

describe("seriesSnapshotFromCard", () => {
  it("guarda só o que a lista precisa", () => {
    expect(
      seriesSnapshotFromCard({ id: 9, title: "S", year: "2020", rating: 8, posterUrl: "https://image.tmdb.org/t/p/w342/x.jpg" }),
    ).toEqual({ seriesId: 9, title: "S", year: "2020", posterPath: "/x.jpg", rating: 8 });
    expect(seriesSnapshotFromCard({ id: 9, title: "S", year: "", rating: 0, posterUrl: null }).posterPath).toBeNull();
  });
});
