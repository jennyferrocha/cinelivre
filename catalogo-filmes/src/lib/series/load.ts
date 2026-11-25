import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import type { EpisodeRef } from "@/lib/series/progress";
import { getSeriesMarks, getSeriesTracking, type EpisodeMark, type SeriesMark } from "@/lib/series/store";
import { supabaseConfig } from "@/lib/supabase/config";

export type SeriesMarksState = {
  /** Contas ligadas (Supabase configurado). */
  enabled: boolean;
  loggedIn: boolean;
  series: SeriesMark[];
  episodes: EpisodeMark[];
};

/** Quem está logado e as séries que acompanha. Lê a sessão: chamar dentro de um <Suspense>. */
export async function loadSeriesMarks(): Promise<SeriesMarksState> {
  if (!supabaseConfig()) return { enabled: false, loggedIn: false, series: [], episodes: [] };
  const user = await getCurrentUser();
  if (!user) return { enabled: true, loggedIn: false, series: [], episodes: [] };
  return { enabled: true, loggedIn: true, ...(await getSeriesMarks(user.id)) };
}

/** Séries que a pessoa já está vendo (algum episódio regular) ou largou: saem das sugestões. */
export function trackedSeriesIds(state: Pick<SeriesMarksState, "series" | "episodes">): Set<number> {
  const ids = new Set(state.episodes.filter((e) => e.season > 0).map((e) => e.seriesId));
  for (const s of state.series) if (s.stopped) ids.add(s.seriesId);
  return ids;
}

/** O acompanhamento de uma série (página da série). Lê a sessão: chamar dentro de um <Suspense>. */
export async function loadSeriesTracking(seriesId: number): Promise<{
  enabled: boolean;
  loggedIn: boolean;
  initial: { want: boolean; stopped: boolean; stars: number | null; watched: EpisodeRef[] };
}> {
  const empty = { want: false, stopped: false, stars: null, watched: [] };
  if (!supabaseConfig()) return { enabled: false, loggedIn: false, initial: empty };
  const user = await getCurrentUser();
  if (!user) return { enabled: true, loggedIn: false, initial: empty };
  const { mark, episodes } = await getSeriesTracking(user.id, seriesId);
  return {
    enabled: true,
    loggedIn: true,
    initial: {
      want: mark?.want ?? false,
      stopped: mark?.stopped ?? false,
      stars: mark?.stars ?? null,
      watched: episodes.map((e) => ({ season: e.season, episode: e.episode })),
    },
  };
}
