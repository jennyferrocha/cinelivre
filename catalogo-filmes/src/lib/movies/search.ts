import "server-only";
import { attachServices, type MovieCard } from "@/lib/movies/discover";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { tmdbFetch } from "@/lib/tmdb/client";
import { attachSeriesServices } from "@/lib/series/discover";
import type { TmdbMovieListItem, TmdbPaged, TmdbTvListItem } from "@/lib/tmdb/types";

/** O texto digitado, sem espaços nas pontas. Busca vazia → null (nem chama o TMDB). */
export function normalizeQuery(q: string | string[] | undefined): string | null {
  const value = (Array.isArray(q) ? q[0] : q)?.trim();
  return value ? value : null;
}

type MultiResult =
  | (TmdbMovieListItem & { media_type: "movie" })
  | (TmdbTvListItem & { media_type: "tv" })
  | { media_type: "person"; id: number };

/**
 * Busca filmes e séries pelo nome (pessoas ficam de fora). Mostra todos os encontrados:
 * os que estão nos streamings da pessoa vêm primeiro (com a etiqueta), na ordem do TMDB.
 */
export async function searchTitles(
  query: string,
  selection: Selection | null,
  groups: ServiceGroup[],
): Promise<MovieCard[]> {
  const data = await tmdbFetch<TmdbPaged<MultiResult>>("/search/multi", {
    query,
    include_adult: "false",
  });
  const movies = data.results.filter((r): r is TmdbMovieListItem & { media_type: "movie" } => r.media_type === "movie");
  const series = data.results.filter((r): r is TmdbTvListItem & { media_type: "tv" } => r.media_type === "tv");
  const [movieCards, seriesCards] = await Promise.all([
    attachServices(movies, selection, groups, { keepUnavailable: true }),
    attachSeriesServices(series, selection, groups, { keepUnavailable: true }),
  ]);
  // Volta para a ordem do TMDB (filme e série podem ter o mesmo id: a chave inclui o tipo).
  const key = (kind: string, id: number) => `${kind}:${id}`;
  const byKey = new Map([
    ...movieCards.map((c) => [key("movie", c.id), c] as const),
    ...seriesCards.map((c) => [key("tv", c.id), c] as const),
  ]);
  const ordered = data.results.flatMap((r) => byKey.get(key(r.media_type, r.id)) ?? []);
  const unique = ordered.filter((c, i) => ordered.findIndex((o) => o === c) === i);
  return [...unique.filter((c) => c.services.length > 0), ...unique.filter((c) => c.services.length === 0)];
}
