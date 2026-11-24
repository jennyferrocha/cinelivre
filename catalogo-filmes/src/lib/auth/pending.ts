import "server-only";
import type { PendingMark } from "@/lib/auth/rules";
import { snapshotFromCard } from "@/lib/marks/rules";
import { saveMark } from "@/lib/marks/store";
import { getMovieDetails } from "@/lib/movies/details";

/**
 * Logo depois de entrar: marca o filme que a pessoa tinha tocado sem estar logada.
 * Qualquer problema (filme inexistente, TMDB ou banco fora) é ignorado: o login continua.
 * Fica fora do arquivo de server actions de propósito: recebe o id da pessoa e não pode
 * ser chamado direto pelo navegador.
 */
export async function applyPendingMark(userId: string, pending: PendingMark | null): Promise<void> {
  if (!pending) return;
  try {
    const movie = await getMovieDetails(pending.movieId, null, []);
    if (!movie) return;
    await saveMark(userId, snapshotFromCard(movie), pending.status);
  } catch {
    // ignora
  }
}
