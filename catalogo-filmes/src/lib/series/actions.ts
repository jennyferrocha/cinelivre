"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { getSeriesShape } from "@/lib/series/details";
import { airedEpisodes, episodeKey, type EpisodeRef } from "@/lib/series/progress";
import { addEpisodes, removeEpisodes, upsertSeries } from "@/lib/series/store";
import { validEpisodes, validSeriesSnapshot, validStars, type SeriesSnapshot } from "@/lib/series/validate";

export type SeriesActionResult = { ok: true } | { error: "login" | "falhou" };

/** Sessão da pessoa, ou o erro a devolver (Supabase fora do ar não é caso de pedir login). */
async function userIdOrError(): Promise<string | { error: "login" | "falhou" }> {
  const { user, unavailable } = await getSessionState();
  if (unavailable) return { error: "falhou" };
  if (!user) return { error: "login" };
  return user.id;
}

/**
 * Marca (`watched = true`) ou desmarca episódios. Ao marcar, só aceita episódios regulares
 * já exibidos (especiais não são conferidos) e tira a série de "Parei de assistir".
 */
export async function setEpisodes(
  series: SeriesSnapshot,
  episodes: EpisodeRef[],
  watched: boolean,
): Promise<SeriesActionResult> {
  if (!validSeriesSnapshot(series) || !validEpisodes(episodes) || typeof watched !== "boolean") {
    return { error: "falhou" };
  }
  const userId = await userIdOrError();
  if (typeof userId !== "string") return userId;

  try {
    if (watched) {
      if (episodes.some((e) => e.season > 0)) {
        const shape = await getSeriesShape(series.seriesId);
        if (!shape) return { error: "falhou" };
        const aired = new Set(airedEpisodes(shape).map(episodeKey));
        if (episodes.some((e) => e.season > 0 && !aired.has(episodeKey(e)))) return { error: "falhou" };
      }
      await upsertSeries(userId, series, { stopped: false });
      await addEpisodes(userId, series.seriesId, episodes);
    } else {
      await removeEpisodes(userId, series.seriesId, episodes);
    }
  } catch {
    return { error: "falhou" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Liga ou desliga "Quero assistir" (`want`) ou "Parei de assistir" (`stopped`). */
export async function setSeriesFlag(
  series: SeriesSnapshot,
  flag: "want" | "stopped",
  value: boolean,
): Promise<SeriesActionResult> {
  if (!validSeriesSnapshot(series) || (flag !== "want" && flag !== "stopped") || typeof value !== "boolean") {
    return { error: "falhou" };
  }
  const userId = await userIdOrError();
  if (typeof userId !== "string") return userId;
  try {
    await upsertSeries(userId, series, { [flag]: value });
  } catch {
    return { error: "falhou" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Estrelas da série inteira (1 a 5; null apaga). Não mudam a situação. */
export async function setSeriesStars(series: SeriesSnapshot, stars: number | null): Promise<SeriesActionResult> {
  if (!validSeriesSnapshot(series) || !validStars(stars)) return { error: "falhou" };
  const userId = await userIdOrError();
  if (typeof userId !== "string") return userId;
  try {
    await upsertSeries(userId, series, { stars });
  } catch {
    return { error: "falhou" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
