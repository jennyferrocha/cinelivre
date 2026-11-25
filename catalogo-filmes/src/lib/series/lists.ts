// Agrupa as séries da pessoa por situação, para "Continuar assistindo" e as abas de séries.
// Puro (testável); quem busca os formatos no TMDB é `loadTrackedSeries`, em lists-server.ts.
import {
  seriesProgress,
  seriesSituation,
  situationWithoutShape,
  type Progress,
  type SeriesShape,
  type SeriesSituation,
} from "@/lib/series/progress";
import type { EpisodeMark, SeriesMark } from "@/lib/series/store";

export type TrackedSeries = {
  mark: SeriesMark;
  situation: SeriesSituation;
  /** null quando o TMDB não respondeu. */
  progress: Progress | null;
  /** Última vez que a pessoa mexeu nela (episódio marcado ou botão). */
  lastWatchedAt: string;
};

const MAX_CONTINUE = 20;

const recentFirst = (a: TrackedSeries, b: TrackedSeries) => b.lastWatchedAt.localeCompare(a.lastWatchedAt);

export function groupTracked(
  state: { series: SeriesMark[]; episodes: EpisodeMark[] },
  shapes: Map<number, SeriesShape | null>,
): TrackedSeries[] {
  const result: TrackedSeries[] = [];
  for (const mark of state.series) {
    const episodes = state.episodes.filter((e) => e.seriesId === mark.seriesId);
    const shape = shapes.get(mark.seriesId) ?? null;
    const flags = { want: mark.want, stopped: mark.stopped };
    const situation = shape ? seriesSituation(flags, shape, episodes) : situationWithoutShape(flags, episodes);
    if (!situation) continue;
    const lastEpisode = episodes.reduce((max, e) => (e.watchedAt > max ? e.watchedAt : max), "");
    result.push({
      mark,
      situation,
      progress: shape ? seriesProgress(shape, episodes) : null,
      lastWatchedAt: lastEpisode > mark.updatedAt ? lastEpisode : mark.updatedAt,
    });
  }
  return result;
}

/** "Continuar assistindo": acompanhando e com próximo episódio já exibido, mais recente primeiro. */
export function continueWatching(list: TrackedSeries[]): TrackedSeries[] {
  return list
    .filter((t) => t.situation === "acompanhando" && t.progress?.next)
    .sort(recentFirst)
    .slice(0, MAX_CONTINUE);
}

export function bySituation(list: TrackedSeries[], situation: SeriesSituation): TrackedSeries[] {
  return list.filter((t) => t.situation === situation).sort(recentFirst);
}
