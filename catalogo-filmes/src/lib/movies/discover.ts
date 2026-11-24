import "server-only";
import { mapWithConcurrency } from "@/lib/concurrency";
import { availableServices, type ServiceLabel } from "@/lib/providers/availability";
import { FREE_PROVIDER_IDS } from "@/lib/providers/free";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { imageUrl, tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbMovieListItem, TmdbPaged, TmdbWatchProvidersResponse } from "@/lib/tmdb/types";

export type DiscoverFilters = {
  sortBy: "popularity.desc" | "vote_average.desc";
  genres?: number[];
  maxRuntime?: number;
  minRating?: number;
  minVotes?: number;
  /** AAAA-MM-DD */
  releasedFrom?: string;
  releasedTo?: string;
};

export type MovieCard = {
  id: number;
  title: string;
  overview: string;
  year: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  genreIds: number[];
  services: ServiceLabel[];
};

const MAX_PARALLEL = 10;
const PROVIDERS_REVALIDATE = 21600; // 6 horas
const DEFAULT_MIN_VOTES_WITH_RATING = 50;

/** Monta os parâmetros do /discover/movie para a seleção e os filtros da pessoa. */
export function buildDiscoverParams(
  selection: Selection,
  groups: ServiceGroup[],
  filters: DiscoverFilters,
  page: number,
): Record<string, string | number> {
  const paidIds = groups
    .filter((g) => selection.services.includes(g.key))
    .flatMap((g) => g.providerIds);
  const providerIds = [...paidIds, ...(selection.includeFree ? FREE_PROVIDER_IDS : [])];

  const params: Record<string, string | number> = {
    watch_region: "BR",
    with_watch_providers: providerIds.join("|"),
    with_watch_monetization_types: selection.includeFree ? "flatrate|free|ads" : "flatrate|ads",
    sort_by: filters.sortBy,
    include_adult: "false",
    page,
  };
  if (filters.genres?.length) params.with_genres = filters.genres.join("|");
  if (filters.maxRuntime) params["with_runtime.lte"] = filters.maxRuntime;
  if (filters.minRating) params["vote_average.gte"] = filters.minRating;
  const minVotes = filters.minVotes ?? (filters.minRating ? DEFAULT_MIN_VOTES_WITH_RATING : undefined);
  if (minVotes) params["vote_count.gte"] = minVotes;
  if (filters.releasedFrom) params["primary_release_date.gte"] = filters.releasedFrom;
  if (filters.releasedTo) params["primary_release_date.lte"] = filters.releasedTo;
  return params;
}

/** Aplica a nota mínima escolhida pela pessoa, mantendo o mínimo de votos da fileira. */
export function withMinRating(filters: DiscoverFilters, minRating?: number): DiscoverFilters {
  return minRating ? { ...filters, minRating } : filters;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const genreRow = (id: string, title: string, genre: number) => ({
  id,
  title,
  filters: (): DiscoverFilters => ({ sortBy: "popularity.desc", genres: [genre] }),
});

export const HOME_ROWS: { id: string; title: string; filters: (today: Date) => DiscoverFilters }[] = [
  { id: "em-alta", title: "Em alta esta semana", filters: () => ({ sortBy: "popularity.desc" }) },
  { id: "bem-avaliados", title: "Bem avaliados", filters: () => ({ sortBy: "vote_average.desc", minVotes: 300 }) },
  {
    id: "lancamentos",
    title: "Lançamentos recentes",
    filters: (today) => ({
      sortBy: "popularity.desc",
      releasedFrom: isoDate(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)),
      releasedTo: isoDate(today),
    }),
  },
  genreRow("comedia", "Comédia", 35),
  genreRow("acao", "Ação", 28),
  genreRow("terror", "Terror", 27),
  genreRow("romance", "Romance", 10749),
  genreRow("animacao", "Animação", 16),
];

export function toMovieCard(item: TmdbMovieListItem, services: ServiceLabel[]): MovieCard {
  return {
    id: item.id,
    title: item.title,
    overview: item.overview ?? "",
    year: item.release_date ? item.release_date.slice(0, 4) : "",
    posterUrl: imageUrl(item.poster_path, "w342"),
    backdropUrl: imageUrl(item.backdrop_path, "w1280"),
    rating: Math.round(item.vote_average * 10) / 10,
    genreIds: item.genre_ids ?? [],
    services,
  };
}

/** O filme do destaque: o primeiro que tem imagem de fundo. */
export function pickHero(movies: MovieCard[]): MovieCard | null {
  return movies.find((m) => m.backdropUrl) ?? null;
}

/**
 * Confere, filme por filme, em quais streamings da pessoa ele está.
 * Sem `keepUnavailable`, descarta quem não está em nenhum.
 */
export async function attachServices(
  items: TmdbMovieListItem[],
  selection: Selection | null,
  groups: ServiceGroup[],
  opts: { keepUnavailable?: boolean } = {},
): Promise<MovieCard[]> {
  const unique = items.filter((item, i) => items.findIndex((other) => other.id === item.id) === i);
  let failures = 0;
  let lastError: unknown;
  const cards = await mapWithConcurrency(unique, MAX_PARALLEL, async (item) => {
    if (!selection) return toMovieCard(item, []);
    try {
      const providers = await tmdbFetch<TmdbWatchProvidersResponse>(
        `/movie/${item.id}/watch/providers`,
        {},
        PROVIDERS_REVALIDATE,
      );
      return toMovieCard(item, availableServices(providers.results?.BR, selection, groups));
    } catch (error) {
      // Uma consulta que falha esconde só esse filme (na dúvida, esconder).
      failures++;
      lastError = error;
      return toMovieCard(item, []);
    }
  });
  // Se todas falharam, o TMDB está fora: deixa o erro chegar à página amigável.
  if (unique.length > 0 && failures === unique.length) throw lastError;
  return opts.keepUnavailable ? cards : cards.filter((c) => c.services.length > 0);
}

const MAX_EXTRA_PAGES = 3;
const DEFAULT_MIN_RESULTS = 8;

/**
 * Lista de filmes do discover, só com o que a pessoa consegue assistir.
 * `excludeIds` tira filmes (os que ela já assistiu); se a lista ficar com menos de
 * `minResults`, busca as páginas seguintes (no máximo 3 a mais) para completar.
 */
export async function discoverMovies(
  selection: Selection,
  groups: ServiceGroup[],
  filters: DiscoverFilters,
  opts: { pages?: number; excludeIds?: Set<number>; minResults?: number } = {},
): Promise<MovieCard[]> {
  const exclude = opts.excludeIds ?? new Set<number>();
  const minResults = opts.minResults ?? DEFAULT_MIN_RESULTS;
  const fetchPage = (page: number) =>
    tmdbFetch<TmdbPaged<TmdbMovieListItem>>("/discover/movie", buildDiscoverParams(selection, groups, filters, page));
  const keep = (items: TmdbMovieListItem[]) => items.filter((item) => !exclude.has(item.id));

  const firstPages = Array.from({ length: opts.pages ?? 1 }, (_, i) => i + 1);
  const responses = await Promise.all(firstPages.map(fetchPage));
  let movies = await attachServices(keep(responses.flatMap((r) => r.results)), selection, groups);

  let page = firstPages.length;
  const totalPages = Math.max(...responses.map((r) => r.total_pages ?? 1));
  while (exclude.size > 0 && movies.length < minResults && page < firstPages.length + MAX_EXTRA_PAGES && page < totalPages) {
    page += 1;
    const extra = await attachServices(keep((await fetchPage(page)).results), selection, groups);
    const seen = new Set(movies.map((m) => m.id));
    movies = [...movies, ...extra.filter((m) => !seen.has(m.id))];
  }
  return movies;
}
