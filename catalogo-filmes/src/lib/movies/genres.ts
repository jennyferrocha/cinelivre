import "server-only";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbGenre } from "@/lib/tmdb/types";

/** Lista de gêneros de filme em português. */
export async function getGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>("/genre/movie/list", {}, 86400);
  return data.genres;
}

export function genreNames(ids: number[], all: TmdbGenre[]): string[] {
  return ids.flatMap((id) => all.find((g) => g.id === id)?.name ?? []);
}
