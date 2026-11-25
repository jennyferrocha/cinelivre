import "server-only";
import type { MovieCard } from "@/lib/movies/discover";
import { formatRuntime, pickTrailer, whereToWatch, type WhereToWatch } from "@/lib/movies/details";
import { availableServices } from "@/lib/providers/availability";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { toSeriesCard } from "@/lib/series/discover";
import type { SeriesShape } from "@/lib/series/progress";
import { imageUrl, tmdbFetch, TmdbError } from "@/lib/tmdb/client";
import type { TmdbSeason, TmdbTvDetails } from "@/lib/tmdb/types";

const DETAILS_REVALIDATE = 21600; // 6 horas
const MAX_CAST = 6;
const FINISHED = new Set(["Ended", "Canceled"]);

export type SeasonSummary = { number: number; label: string; episodeCount: number };

export type EpisodeStatus = { aired: true } | { aired: false; label: string };

export type Episode = {
  number: number;
  title: string;
  overview: string;
  runtime: string | null;
  stillUrl: string | null;
  status: EpisodeStatus;
};

export type SeriesDetails = MovieCard & {
  years: string;
  seasonsLabel: string | null;
  genres: string[];
  certification: string | null;
  trailerKey: string | null;
  cast: string[];
  allServicesBR: WhereToWatch[];
  /** T1, T2… e "Especiais" por último. Temporadas sem episódios ficam de fora. */
  seasons: SeasonSummary[];
  /** Para calcular progresso e situação (ver `progress.ts`). */
  shape: SeriesShape;
};

/** "2011–2019", "2020" (começou e terminou no mesmo ano) ou "Desde 2019" (continua). */
export function formatYears(first: string | null, last: string | null, status: string): string {
  const start = first?.slice(0, 4);
  if (!start) return "";
  if (!FINISHED.has(status)) return `Desde ${start}`;
  const end = last?.slice(0, 4);
  return !end || end === start ? start : `${start}–${end}`;
}

/** 1 → "1 temporada", 4 → "4 temporadas", 0 → null. */
export function seasonsLabel(n: number): string | null {
  if (!n || n <= 0) return null;
  return n === 1 ? "1 temporada" : `${n} temporadas`;
}

/** Classificação indicativa do Brasil ("14", "L"...), ou null. */
export function brContentRating(
  data: { results: { iso_3166_1: string; rating: string }[] } | undefined,
): string | null {
  return data?.results.find((r) => r.iso_3166_1 === "BR")?.rating.trim() || null;
}

/** Episódio já exibido (data até hoje, em UTC) ou o texto de quando estreia. */
export function episodeStatus(airDate: string | null, today: Date): EpisodeStatus {
  if (!airDate || !/^\d{4}-\d{2}-\d{2}$/.test(airDate)) return { aired: false, label: "Data a definir" };
  if (airDate <= today.toISOString().slice(0, 10)) return { aired: true };
  const [y, m, d] = airDate.split("-");
  return { aired: false, label: `Estreia ${d}/${m}/${y}` };
}

/** A temporada pedida na URL, se existe; senão a primeira da lista (T1, ou Especiais se só houver eles). */
export function pickSeason(raw: string | string[] | undefined, seasons: SeasonSummary[]): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{1,3}$/.test(value)) {
    const n = Number(value);
    if (seasons.some((s) => s.number === n)) return n;
  }
  return seasons[0]?.number ?? null;
}

function toSeasons(raw: TmdbTvDetails["seasons"]): SeasonSummary[] {
  const withEpisodes = (raw ?? []).filter((s) => s.episode_count > 0);
  const regular = withEpisodes
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)
    .map((s) => ({ number: s.season_number, label: `T${s.season_number}`, episodeCount: s.episode_count }));
  const specials = withEpisodes
    .filter((s) => s.season_number === 0)
    .map((s) => ({ number: 0, label: "Especiais", episodeCount: s.episode_count }));
  return [...regular, ...specials];
}

function toShape(data: TmdbTvDetails): SeriesShape {
  const last = data.last_episode_to_air;
  return {
    seasons: (data.seasons ?? [])
      .filter((s) => s.season_number > 0 && s.episode_count > 0)
      .sort((a, b) => a.season_number - b.season_number)
      .map((s) => ({ number: s.season_number, episodeCount: s.episode_count })),
    lastAired: last ? { season: last.season_number, episode: last.episode_number } : null,
    finished: FINISHED.has(data.status),
    nextAirDate: data.next_episode_to_air?.air_date ?? null,
  };
}

/** O formato da série (temporadas, último exibido, se terminou). Erro ou série inexistente = null. */
export async function getSeriesShape(id: number): Promise<SeriesShape | null> {
  try {
    return toShape(await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, {}, DETAILS_REVALIDATE));
  } catch {
    return null;
  }
}

/** Resumo em inglês, para quando o TMDB não tem o em português. */
async function englishOverview(id: number): Promise<string> {
  try {
    const english = await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, { language: "en-US" }, DETAILS_REVALIDATE);
    return english.overview?.trim() ?? "";
  } catch {
    return "";
  }
}

/** Tudo que a página da série precisa. Série que não existe → null. */
export async function getSeriesDetails(
  id: number,
  selection: Selection | null,
  groups: ServiceGroup[],
): Promise<SeriesDetails | null> {
  let data: TmdbTvDetails;
  try {
    data = await tmdbFetch<TmdbTvDetails>(
      `/tv/${id}`,
      {
        append_to_response: "videos,aggregate_credits,content_ratings,watch/providers",
        include_video_language: "pt,en",
      },
      DETAILS_REVALIDATE,
    );
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }

  const overview = data.overview?.trim() || (await englishOverview(id));
  const offers = data["watch/providers"]?.results.BR;
  const services = selection ? availableServices(offers, selection, groups) : [];
  const card = toSeriesCard({ ...data, overview, genre_ids: data.genres.map((g) => g.id) }, services);

  return {
    ...card,
    years: formatYears(data.first_air_date, data.last_air_date, data.status),
    seasonsLabel: seasonsLabel(data.number_of_seasons),
    genres: data.genres.map((g) => g.name),
    certification: brContentRating(data.content_ratings),
    trailerKey: pickTrailer(data.videos),
    cast: (data.aggregate_credits?.cast ?? []).slice(0, MAX_CAST).map((c) => c.name),
    allServicesBR: whereToWatch(offers, new Set(services.map((s) => s.key)), groups),
    seasons: toSeasons(data.seasons),
    shape: toShape(data),
  };
}

/** Episódios de uma temporada. Temporada que não existe → null. */
export async function getSeason(id: number, n: number, today: Date): Promise<Episode[] | null> {
  let data: TmdbSeason;
  try {
    data = await tmdbFetch<TmdbSeason>(`/tv/${id}/season/${n}`, {}, DETAILS_REVALIDATE);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
  return (data.episodes ?? []).map((e) => ({
    number: e.episode_number,
    title: e.name?.trim() || `Episódio ${e.episode_number}`,
    overview: e.overview?.trim() ?? "",
    runtime: formatRuntime(e.runtime),
    stillUrl: imageUrl(e.still_path, "w300"),
    status: episodeStatus(e.air_date, today),
  }));
}

/** "4 temporadas", para o destaque (a lista do TMDB não traz). Erro ou sem dado = null. */
export async function getSeriesSeasonsLabel(id: number): Promise<string | null> {
  const shape = await getSeriesShape(id);
  return shape ? seasonsLabel(shape.seasons.length) : null;
}
