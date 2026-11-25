import "server-only";
import { mapWithConcurrency } from "@/lib/concurrency";
import { getSeriesShape } from "@/lib/series/details";
import { groupTracked, type TrackedSeries } from "@/lib/series/lists";
import type { SeriesMarksState } from "@/lib/series/load";
import type { SeriesShape } from "@/lib/series/progress";

const MAX_SERIES = 200;
const MAX_PARALLEL = 10;

/**
 * As séries da pessoa com a situação calculada. Consulta o formato de cada uma no TMDB
 * (guardado por 6 horas); a que falhar usa só o que está guardado.
 */
export async function loadTrackedSeries(state: SeriesMarksState): Promise<TrackedSeries[]> {
  const series = [...state.series].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_SERIES);
  const shapes = await mapWithConcurrency(series, MAX_PARALLEL, (s) => getSeriesShape(s.seriesId));
  const byId = new Map<number, SeriesShape | null>(series.map((s, i) => [s.seriesId, shapes[i]]));
  return groupTracked({ series, episodes: state.episodes }, byId);
}
