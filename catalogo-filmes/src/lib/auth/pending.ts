import "server-only";
import type { PendingMark } from "@/lib/auth/rules";
import { snapshotFromCard } from "@/lib/marks/rules";
import { saveMark } from "@/lib/marks/store";
import { getMovieDetails } from "@/lib/movies/details";
import { getSeriesDetails } from "@/lib/series/details";
import { airedEpisodes, episodeKey } from "@/lib/series/progress";
import { addEpisodes, upsertSeries } from "@/lib/series/store";
import { seriesSnapshotFromCard } from "@/lib/series/validate";

/**
 * Logo depois de entrar: marca o filme (ou a série / o episódio) que a pessoa tinha tocado sem estar logada.
 * Qualquer problema (filme inexistente, TMDB ou banco fora) é ignorado: o login continua.
 * Fica fora do arquivo de server actions de propósito: recebe o id da pessoa e não pode
 * ser chamado direto pelo navegador.
 */
export async function applyPendingMark(userId: string, pending: PendingMark | null): Promise<void> {
  if (!pending) return;
  try {
    if ("kind" in pending) {
      const series = await getSeriesDetails(pending.seriesId, null, []);
      if (!series) return;
      const snapshot = seriesSnapshotFromCard(series);
      if ("status" in pending) {
        await upsertSeries(userId, snapshot, { want: true });
        return;
      }
      const ep = pending.episode;
      const aired = new Set(airedEpisodes(series.shape).map(episodeKey));
      const known = ep.season === 0 ? series.seasons.some((s) => s.number === 0) : aired.has(episodeKey(ep));
      if (!known) return;
      await upsertSeries(userId, snapshot, { stopped: false });
      await addEpisodes(userId, series.id, [ep]);
      return;
    }
    const movie = await getMovieDetails(pending.movieId, null, []);
    if (!movie) return;
    await saveMark(userId, snapshotFromCard(movie), pending.status);
  } catch {
    // ignora
  }
}
