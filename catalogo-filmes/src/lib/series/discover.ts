import "server-only";
import {
  attachServicesBy,
  discoverBy,
  isoDate,
  providerParams,
  ratingParams,
  type CardSource,
  type DiscoverFilters,
  type DiscoverOptions,
  type MovieCard,
} from "@/lib/movies/discover";
import type { ServiceLabel } from "@/lib/providers/availability";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { imageUrl } from "@/lib/tmdb/client";
import type { TmdbTvListItem } from "@/lib/tmdb/types";

/** Notícias (10763) e talk shows (10767) não entram nas fileiras de séries. */
const EXCLUDED_TV_GENRES = "10763|10767";

/** Parâmetros do /discover/tv. Datas valem pela estreia da série; duração não se aplica. */
export function buildTvDiscoverParams(
  selection: Selection,
  groups: ServiceGroup[],
  filters: DiscoverFilters,
  page: number,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    ...providerParams(selection, groups),
    sort_by: filters.sortBy,
    include_adult: "false",
    without_genres: EXCLUDED_TV_GENRES,
    page,
    ...ratingParams(filters),
  };
  if (filters.genres?.length) params.with_genres = filters.genres.join("|");
  if (filters.releasedFrom) params["first_air_date.gte"] = filters.releasedFrom;
  if (filters.releasedTo) params["first_air_date.lte"] = filters.releasedTo;
  return params;
}

export function toSeriesCard(item: TmdbTvListItem, services: ServiceLabel[]): MovieCard {
  return {
    id: item.id,
    kind: "tv",
    title: item.name,
    overview: item.overview ?? "",
    year: item.first_air_date ? item.first_air_date.slice(0, 4) : "",
    posterUrl: imageUrl(item.poster_path, "w342"),
    backdropUrl: imageUrl(item.backdrop_path, "w1280"),
    rating: Math.round(item.vote_average * 10) / 10,
    genreIds: item.genre_ids ?? [],
    services,
  };
}

const SERIES_SOURCE: CardSource<TmdbTvListItem> = {
  providersPath: (id) => `/tv/${id}/watch/providers`,
  toCard: toSeriesCard,
};

/** Séries: confere em quais streamings da pessoa cada uma está. */
export function attachSeriesServices(
  items: TmdbTvListItem[],
  selection: Selection | null,
  groups: ServiceGroup[],
  opts: { keepUnavailable?: boolean } = {},
): Promise<MovieCard[]> {
  return attachServicesBy(items, selection, groups, SERIES_SOURCE, opts);
}

/** Lista de séries do discover, só com o que a pessoa consegue assistir. */
export function discoverSeries(
  selection: Selection,
  groups: ServiceGroup[],
  filters: DiscoverFilters,
  opts: DiscoverOptions = {},
): Promise<MovieCard[]> {
  return discoverBy(
    "/discover/tv",
    (page) => buildTvDiscoverParams(selection, groups, filters, page),
    SERIES_SOURCE,
    selection,
    groups,
    opts,
  );
}

const genreRow = (id: string, title: string, genre: number) => ({
  id,
  title,
  filters: (): DiscoverFilters => ({ sortBy: "popularity.desc", genres: [genre] }),
});

export const SERIES_ROWS: { id: string; title: string; filters: (today: Date) => DiscoverFilters }[] = [
  { id: "em-alta", title: "Em alta esta semana", filters: () => ({ sortBy: "popularity.desc" }) },
  { id: "bem-avaliadas", title: "Bem avaliadas", filters: () => ({ sortBy: "vote_average.desc", minVotes: 300 }) },
  {
    id: "estreias",
    title: "Estreias recentes",
    filters: (today) => ({
      sortBy: "popularity.desc",
      releasedFrom: isoDate(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)),
      releasedTo: isoDate(today),
    }),
  },
  genreRow("drama", "Drama", 18),
  genreRow("comedia", "Comédia", 35),
  genreRow("crime", "Crime", 80),
  genreRow("ficcao", "Ficção e fantasia", 10765),
  genreRow("animacao", "Animação", 16),
];
