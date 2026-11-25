// Conferência do que chega do navegador nas ações de séries e estrelas (dados podem ser forjados).
import type { EpisodeRef } from "@/lib/series/progress";

/** Dados da série guardados junto com a marcação, para as abas abrirem rápido. */
export type SeriesSnapshot = { seriesId: number; title: string; year: string; posterPath: string | null; rating: number };

const MAX_EPISODES = 2000;

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function validSeriesSnapshot(s: SeriesSnapshot): boolean {
  return (
    !!s &&
    isInt(s.seriesId, 1, 9_999_999_999) &&
    typeof s.title === "string" &&
    s.title.trim().length > 0 &&
    s.title.length <= 300 &&
    typeof s.year === "string" &&
    /^(\d{4})?$/.test(s.year) &&
    (s.posterPath === null || (typeof s.posterPath === "string" && /^\/[\w.-]{1,120}$/.test(s.posterPath))) &&
    typeof s.rating === "number" &&
    Number.isFinite(s.rating) &&
    s.rating >= 0 &&
    s.rating <= 10
  );
}

/** De 1 a 2000 episódios, temporada 0–999, episódio 1–9999, sem repetidos. */
export function validEpisodes(list: unknown): list is EpisodeRef[] {
  if (!Array.isArray(list) || list.length === 0 || list.length > MAX_EPISODES) return false;
  const seen = new Set<string>();
  for (const e of list) {
    if (!e || typeof e !== "object") return false;
    const { season, episode } = e as Record<string, unknown>;
    if (!isInt(season, 0, 999) || !isInt(episode, 1, 9999)) return false;
    const key = `${season}:${episode}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

/** Estrelas: inteiro de 1 a 5, ou null para apagar. */
export function validStars(v: unknown): v is number | null {
  return v === null || isInt(v, 1, 5);
}

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/** Os dados do pôster da série, no formato guardado com a marcação. */
export function seriesSnapshotFromCard(card: {
  id: number;
  title: string;
  year: string;
  rating: number;
  posterUrl: string | null;
}): SeriesSnapshot {
  const posterPath = card.posterUrl?.startsWith(POSTER_BASE) ? card.posterUrl.slice(POSTER_BASE.length) : null;
  return { seriesId: card.id, title: card.title, year: card.year, posterPath, rating: card.rating };
}
