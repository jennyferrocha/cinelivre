// Regras puras das listas "Quero assistir" e "Já assisti" (rodam no servidor e no navegador).
import type { MovieCard } from "@/lib/movies/discover";

export type MarkStatus = "quero" | "assisti";

/** Dados do filme guardados junto com a marcação, para as abas abrirem sem consultar o TMDB. */
export type MarkSnapshot = { movieId: number; title: string; year: string; posterPath: string | null; rating: number };

export type Mark = MarkSnapshot & { status: MarkStatus; markedAt: string };

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/** Tocar num botão marca; tocar de novo desmarca; tocar no outro troca de lista. */
export function nextStatus(current: MarkStatus | null, clicked: MarkStatus): MarkStatus | null {
  return current === clicked ? null : clicked;
}

export function snapshotFromCard(card: MovieCard): MarkSnapshot {
  const posterPath = card.posterUrl?.startsWith(POSTER_BASE) ? card.posterUrl.slice(POSTER_BASE.length) : null;
  return { movieId: card.id, title: card.title, year: card.year, posterPath, rating: card.rating };
}

/** Ids dos filmes que a pessoa já assistiu (para tirá-los das sugestões). */
export function watchedIds(marks: Mark[]): Set<number> {
  return new Set(marks.filter((m) => m.status === "assisti").map((m) => m.movieId));
}

/** Uma lista como pôsteres, dos marcados mais recentemente para os mais antigos. */
export function marksToCards(marks: Mark[], status: MarkStatus): MovieCard[] {
  return marks
    .filter((m) => m.status === status)
    .sort((a, b) => b.markedAt.localeCompare(a.markedAt))
    .map((m) => ({
      id: m.movieId,
      title: m.title,
      overview: "",
      year: m.year,
      posterUrl: m.posterPath ? `${POSTER_BASE}${m.posterPath}` : null,
      backdropUrl: null,
      rating: m.rating,
      genreIds: [],
      services: [],
    }));
}
