import "server-only";
import { toMovieCard, type MovieCard } from "@/lib/movies/discover";
import { availableServices } from "@/lib/providers/availability";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { imageUrl, tmdbFetch, TmdbError } from "@/lib/tmdb/client";
import type { TmdbMovieDetails, TmdbProvider, TmdbRegionOffers, TmdbReleaseDates, TmdbVideo } from "@/lib/tmdb/types";

const DETAILS_REVALIDATE = 21600; // 6 horas
const MAX_CAST = 6;

export type WhereToWatch = { key: string; name: string; logoUrl: string | null; mine: boolean };

export type MovieDetails = MovieCard & {
  runtime: string | null;
  genres: string[];
  certification: string | null;
  trailerKey: string | null;
  cast: string[];
  /** Todos os streamings do Brasil com o filme (assinatura e grátis), os da pessoa marcados. */
  allServicesBR: WhereToWatch[];
};

/** Classificação indicativa do Brasil ("14", "L"...), ou null. */
export function brCertification(releaseDates: TmdbReleaseDates | undefined): string | null {
  const br = releaseDates?.results.find((r) => r.iso_3166_1 === "BR");
  return br?.release_dates.find((d) => d.certification.trim())?.certification.trim() ?? null;
}

/** Chave do trailer no YouTube: primeiro em português, senão em inglês. */
export function pickTrailer(videos: { results: TmdbVideo[] } | undefined): string | null {
  const trailers = (videos?.results ?? []).filter((v) => v.site === "YouTube" && v.type === "Trailer");
  return (trailers.find((v) => v.iso_639_1 === "pt") ?? trailers.find((v) => v.iso_639_1 === "en"))?.key ?? null;
}

/** 125 → "2h05", 45 → "45min". */
export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}min` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Todos os streamings do Brasil com o título (assinatura, anúncios e grátis), os da pessoa marcados. */
export function whereToWatch(
  offers: TmdbRegionOffers | undefined,
  myKeys: Set<string>,
  groups: ServiceGroup[],
): WhereToWatch[] {
  const providers: TmdbProvider[] = [...(offers?.flatrate ?? []), ...(offers?.ads ?? []), ...(offers?.free ?? [])];
  const seen = new Set<string>();
  const result: WhereToWatch[] = [];
  for (const p of providers) {
    const group = groups.find((g) => g.providerIds.includes(p.provider_id));
    const key = group?.key ?? `free-${p.provider_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      key,
      name: group?.name ?? p.provider_name,
      logoUrl: imageUrl(group?.logoPath || p.logo_path || null, "w92"),
      mine: myKeys.has(key) || myKeys.has(`free-${p.provider_id}`),
    });
  }
  return result;
}

/** Sinopse em inglês, para quando o TMDB não tem a em português. */
async function englishOverview(id: number): Promise<string> {
  const english = await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, { language: "en-US" }, DETAILS_REVALIDATE);
  return english.overview?.trim() ?? "";
}

/** Duração do filme do destaque ("2h05"). A lista do TMDB não traz; erro ou sem dado = null. */
export async function getMovieRuntime(id: number): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ runtime: number | null }>(`/movie/${id}`, {}, DETAILS_REVALIDATE);
    return formatRuntime(data.runtime);
  } catch {
    return null;
  }
}

/** Para o destaque: sem sinopse em português, usa a em inglês em vez de deixar vazio. */
export async function withEnglishOverview(card: MovieCard): Promise<MovieCard> {
  if (card.overview.trim()) return card;
  return { ...card, overview: await englishOverview(card.id) };
}

/** Tudo que a página de detalhe precisa. Filme que não existe → null. */
export async function getMovieDetails(
  id: number,
  selection: Selection | null,
  groups: ServiceGroup[],
): Promise<MovieDetails | null> {
  let data: TmdbMovieDetails;
  try {
    data = await tmdbFetch<TmdbMovieDetails>(
      `/movie/${id}`,
      { append_to_response: "videos,credits,release_dates,watch/providers", include_video_language: "pt,en" },
      DETAILS_REVALIDATE,
    );
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }

  const overview = data.overview?.trim() || (await englishOverview(id));

  const services = selection ? availableServices(data["watch/providers"]?.results.BR, selection, groups) : [];
  const card = toMovieCard({ ...data, overview, genre_ids: data.genres.map((g) => g.id) }, services);

  return {
    ...card,
    runtime: formatRuntime(data.runtime),
    genres: data.genres.map((g) => g.name),
    certification: brCertification(data.release_dates),
    trailerKey: pickTrailer(data.videos),
    cast: (data.credits?.cast ?? []).slice(0, MAX_CAST).map((c) => c.name),
    allServicesBR: whereToWatch(data["watch/providers"]?.results.BR, new Set(services.map((s) => s.key)), groups),
  };
}
