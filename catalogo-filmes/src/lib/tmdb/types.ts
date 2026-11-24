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
