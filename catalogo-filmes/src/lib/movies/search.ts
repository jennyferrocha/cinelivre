import "server-only";
import { attachServices, type MovieCard } from "@/lib/movies/discover";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbMovieListItem, TmdbPaged } from "@/lib/tmdb/types";

/** O texto digitado, sem espaços nas pontas. Busca vazia → null (nem chama o TMDB). */
export function normalizeQuery(q: string | string[] | undefined): string | null {
  const value = (Array.isArray(q) ? q[0] : q)?.trim();
  return value ? value : null;
}

/**
 * Busca filmes pelo nome. Mostra todos os encontrados: os que estão nos
 * streamings da pessoa vêm primeiro (com a etiqueta), na ordem do TMDB.
 */
export async function searchMovies(
  query: string,
  selection: Selection | null,
  groups: ServiceGroup[],
): Promise<MovieCard[]> {
  const data = await tmdbFetch<TmdbPaged<TmdbMovieListItem>>("/search/movie", {
    query,
    include_adult: "false",
  });
  const cards = await attachServices(data.results, selection, groups, { keepUnavailable: true });
  return [...cards.filter((c) => c.services.length > 0), ...cards.filter((c) => c.services.length === 0)];
}
