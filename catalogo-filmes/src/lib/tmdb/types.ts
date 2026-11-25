// Formatos das respostas do TMDB que o app usa (só os campos necessários).

export type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
  display_priorities?: Record<string, number>;
};

/** Ofertas de um filme num país: assinatura, grátis, com anúncios, aluguel, compra. */
export type TmdbRegionOffers = {
  link?: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

export type TmdbWatchProvidersResponse = {
  id?: number;
  results: Record<string, TmdbRegionOffers | undefined>;
};

export type TmdbMovieListItem = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  overview: string;
};

export type TmdbTvListItem = {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  overview: string;
};

export type TmdbPaged<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TmdbImage = {
  file_path: string;
  aspect_ratio: number;
  iso_639_1: string | null;
  vote_average: number;
};

export type TmdbImagesResponse = {
  id: number;
  logos?: TmdbImage[];
};

export type TmdbGenre = { id: number; name: string };

export type TmdbVideo = { key: string; site: string; type: string; iso_639_1: string | null };

export type TmdbReleaseDates = {
  results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[];
};

/** /movie/{id} com append_to_response=videos,credits,release_dates,watch/providers */
export type TmdbMovieDetails = Omit<TmdbMovieListItem, "genre_ids"> & {
  runtime: number | null;
  genres: TmdbGenre[];
  videos?: { results: TmdbVideo[] };
  credits?: { cast: { name: string; character?: string; order?: number }[] };
  release_dates?: TmdbReleaseDates;
  "watch/providers"?: TmdbWatchProvidersResponse;
};

export type TmdbEpisodeRef = { season_number: number; episode_number: number; air_date: string | null };

/** /tv/{id} com append_to_response=videos,aggregate_credits,content_ratings,watch/providers */
export type TmdbTvDetails = Omit<TmdbTvListItem, "genre_ids"> & {
  last_air_date: string | null;
  /** "Returning Series", "Ended", "Canceled", "In Production", "Planned"… */
  status: string;
  number_of_seasons: number;
  genres: TmdbGenre[];
  seasons: { season_number: number; name: string; episode_count: number }[];
  last_episode_to_air?: TmdbEpisodeRef | null;
  next_episode_to_air?: TmdbEpisodeRef | null;
  videos?: { results: TmdbVideo[] };
  aggregate_credits?: { cast: { name: string }[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  "watch/providers"?: TmdbWatchProvidersResponse;
};

/** /tv/{id}/season/{n} */
export type TmdbSeason = {
  season_number: number;
  episodes: {
    episode_number: number;
    name: string;
    overview: string;
    runtime: number | null;
    air_date: string | null;
    still_path: string | null;
  }[];
};
