import "server-only";
import type { EpisodeRef } from "@/lib/series/progress";
import type { SeriesSnapshot } from "@/lib/series/validate";
import { fetchAllRows } from "@/lib/supabase/pages";
import { createSupabaseServer } from "@/lib/supabase/server";

// Leitura e escrita do acompanhamento de séries no Supabase. As regras de segurança (RLS)
// garantem que cada pessoa só enxerga e altera as próprias linhas.

export type SeriesMark = SeriesSnapshot & { want: boolean; stopped: boolean; stars: number | null; updatedAt: string };
export type EpisodeMark = EpisodeRef & { seriesId: number; watchedAt: string };

type SeriesRow = {
  series_id: number;
  want: boolean;
  stopped: boolean;
  stars: number | null;
  title: string;
  year: string;
  poster_path: string | null;
  rating: number;
  updated_at: string;
};
type EpisodeRow = { series_id: number; season: number; episode: number; watched_at: string };

const SERIES_COLUMNS = "series_id, want, stopped, stars, title, year, poster_path, rating, updated_at";
/** Uma escrita grande (série inteira) vai em pedaços, para não estourar o tamanho do pedido. */
const CHUNK = 500;

async function client() {
  const supabase = await createSupabaseServer();
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

const toSeriesMark = (r: SeriesRow): SeriesMark => ({
  seriesId: r.series_id,
  title: r.title,
  year: r.year,
  posterPath: r.poster_path,
  rating: Number(r.rating),
  want: r.want,
  stopped: r.stopped,
  stars: r.stars ?? null,
  updatedAt: r.updated_at,
});

const toEpisodeMark = (r: EpisodeRow): EpisodeMark => ({
  seriesId: r.series_id,
  season: r.season,
  episode: r.episode,
  watchedAt: r.watched_at,
});

/** Tudo que a pessoa acompanha. Falha do Supabase = listas vazias (o app segue funcionando). */
export async function getSeriesMarks(userId: string): Promise<{ series: SeriesMark[]; episodes: EpisodeMark[] }> {
  try {
    const supabase = await client();
    const [series, episodes] = await Promise.all([
      fetchAllRows<SeriesRow>((from, to) =>
        supabase.from("series_marks").select(SERIES_COLUMNS).eq("user_id", userId).order("series_id").range(from, to),
      ),
      fetchAllRows<EpisodeRow>((from, to) =>
        supabase
          .from("episode_marks")
          .select("series_id, season, episode, watched_at")
          .eq("user_id", userId)
          .order("series_id")
          .order("season")
          .order("episode")
          .range(from, to),
      ),
    ]);
    return { series: series.map(toSeriesMark), episodes: episodes.map(toEpisodeMark) };
  } catch {
    return { series: [], episodes: [] };
  }
}

/** O acompanhamento de uma série só (página da série). */
export async function getSeriesTracking(
  userId: string,
  seriesId: number,
): Promise<{ mark: SeriesMark | null; episodes: EpisodeRef[] }> {
  try {
    const supabase = await client();
    const [series, episodes] = await Promise.all([
      supabase.from("series_marks").select(SERIES_COLUMNS).eq("user_id", userId).eq("series_id", seriesId).maybeSingle(),
      fetchAllRows<EpisodeRef>((from, to) =>
        supabase
          .from("episode_marks")
          .select("season, episode")
          .eq("user_id", userId)
          .eq("series_id", seriesId)
          .order("season")
          .order("episode")
          .range(from, to),
      ),
    ]);
    return { mark: series.data ? toSeriesMark(series.data as SeriesRow) : null, episodes };
  } catch {
    return { mark: null, episodes: [] };
  }
}

/** Cria ou atualiza a série da pessoa. Campos fora de `patch` ficam como estão. */
export async function upsertSeries(
  userId: string,
  s: SeriesSnapshot,
  patch: Partial<{ want: boolean; stopped: boolean; stars: number | null }>,
): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("series_marks").upsert(
    {
      user_id: userId,
      series_id: s.seriesId,
      title: s.title,
      year: s.year,
      poster_path: s.posterPath,
      rating: s.rating,
      updated_at: new Date().toISOString(),
      ...patch,
    },
    { onConflict: "user_id,series_id" },
  );
  if (error) throw new Error(error.message);
}

export async function addEpisodes(userId: string, seriesId: number, list: EpisodeRef[]): Promise<void> {
  const supabase = await client();
  const watchedAt = new Date().toISOString();
  for (let i = 0; i < list.length; i += CHUNK) {
    const rows = list.slice(i, i + CHUNK).map((e) => ({
      user_id: userId,
      series_id: seriesId,
      season: e.season,
      episode: e.episode,
      watched_at: watchedAt,
    }));
    const { error } = await supabase
      .from("episode_marks")
      .upsert(rows, { onConflict: "user_id,series_id,season,episode" });
    if (error) throw new Error(error.message);
  }
}

export async function removeEpisodes(userId: string, seriesId: number, list: EpisodeRef[]): Promise<void> {
  const supabase = await client();
  // Agrupa por temporada: um pedido por temporada, com a lista de episódios.
  const bySeason = new Map<number, number[]>();
  for (const e of list) bySeason.set(e.season, [...(bySeason.get(e.season) ?? []), e.episode]);
  for (const [season, episodes] of bySeason) {
    const { error } = await supabase
      .from("episode_marks")
      .delete()
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .eq("season", season)
      .in("episode", episodes);
    if (error) throw new Error(error.message);
  }
}
