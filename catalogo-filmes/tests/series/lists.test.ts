import { describe, expect, it } from "vitest";
import { bySituation, continueWatching, groupTracked } from "@/lib/series/lists";
import type { SeriesShape } from "@/lib/series/progress";
import type { EpisodeMark, SeriesMark } from "@/lib/series/store";

const shape: SeriesShape = { seasons: [{ number: 1, episodeCount: 3 }], lastAired: { season: 1, episode: 3 }, finished: false, nextAirDate: null };
const mark = (seriesId: number, over: Partial<SeriesMark> = {}): SeriesMark => ({
  seriesId,
  title: `S${seriesId}`,
  year: "2020",
  posterPath: null,
  rating: 8,
  want: false,
  stopped: false,
  stars: null,
  updatedAt: "2026-01-01T00:00:00Z",
  ...over,
});
const ep = (seriesId: number, episode: number, watchedAt: string): EpisodeMark => ({ seriesId, season: 1, episode, watchedAt });

describe("groupTracked e continueWatching", () => {
  const state = {
    series: [mark(1), mark(2), mark(3, { want: true }), mark(4, { stars: 5 }), mark(5), mark(6, { stopped: true })],
    episodes: [
      ep(1, 1, "2026-03-01T00:00:00Z"), // série 1: viu E1 → próximo E2
      ep(2, 1, "2026-05-01T00:00:00Z"), ep(2, 2, "2026-05-01T00:00:00Z"), ep(2, 3, "2026-05-01T00:00:00Z"), // série 2: em dia
      ep(5, 1, "2026-04-01T00:00:00Z"), // série 5: TMDB fora (shape null)
      ep(6, 1, "2026-02-01T00:00:00Z"),
    ],
  };
  const shapes = new Map<number, SeriesShape | null>([[1, shape], [2, shape], [3, shape], [4, shape], [5, null], [6, shape]]);
  const list = groupTracked(state, shapes);

  it("cada série na sua situação; só estrelas não entra em lista nenhuma", () => {
    expect(Object.fromEntries(list.map((t) => [t.mark.seriesId, t.situation]))).toEqual({
      1: "acompanhando",
      2: "acompanhando",
      3: "quero",
      5: "acompanhando",
      6: "parei",
    });
  });

  it("continuar assistindo: só quem tem próximo episódio, último marcado primeiro", () => {
    expect(continueWatching(list).map((t) => t.mark.seriesId)).toEqual([1]);
  });

  it("abas: mais recente primeiro", () => {
    expect(bySituation(list, "acompanhando").map((t) => t.mark.seriesId)).toEqual([2, 5, 1]);
  });
});

describe("trackedSeriesIds", () => {
  it("séries com episódio regular marcado ou largadas saem das sugestões; só 'quero' e só especiais ficam", async () => {
    const { trackedSeriesIds } = await import("@/lib/series/load");
    const ids = trackedSeriesIds({
      series: [mark(1), mark(2, { want: true }), mark(3, { stopped: true }), mark(4)],
      episodes: [ep(1, 1, "2026-01-01T00:00:00Z"), { seriesId: 4, season: 0, episode: 1, watchedAt: "2026-01-01T00:00:00Z" }],
    });
    expect([...ids].sort()).toEqual([1, 3]);
  });
});
