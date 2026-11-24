"use server";

import { revalidatePath } from "next/cache";
import { getSessionState } from "@/lib/auth/session";
import { nextStatus, type MarkSnapshot, type MarkStatus } from "@/lib/marks/rules";
import { deleteMark, saveMark } from "@/lib/marks/store";

/** Os dados do filme vêm do navegador: só aceita o formato que o app mesmo envia. */
function validSnapshot(m: MarkSnapshot): boolean {
  return (
    Number.isInteger(m.movieId) &&
    m.movieId > 0 &&
    typeof m.title === "string" &&
    m.title.trim().length > 0 &&
    m.title.length <= 300 &&
    typeof m.year === "string" &&
    /^(\d{4})?$/.test(m.year) &&
    (m.posterPath === null || (typeof m.posterPath === "string" && /^\/[\w.-]{1,120}$/.test(m.posterPath))) &&
    typeof m.rating === "number" &&
    Number.isFinite(m.rating) &&
    m.rating >= 0 &&
    m.rating <= 10
  );
}

export type ToggleResult = { status: MarkStatus | null } | { error: "login" | "falhou" };

/**
 * Botões "Quero assistir" / "Já assisti". `current` é o estado que a pessoa está vendo;
 * tocar no mesmo botão desmarca, no outro troca de lista.
 */
export async function toggleMark(
  movie: MarkSnapshot,
  clicked: MarkStatus,
  current: MarkStatus | null,
): Promise<ToggleResult> {
  if (!validSnapshot(movie)) return { error: "falhou" };
  if (clicked !== "quero" && clicked !== "assisti") return { error: "falhou" };
  const { user, unavailable } = await getSessionState();
  if (unavailable) return { error: "falhou" }; // Supabase fora do ar: não é caso de pedir login
  if (!user) return { error: "login" };

  const status = nextStatus(current, clicked);
  try {
    if (status) await saveMark(user.id, movie, status);
    else await deleteMark(user.id, movie.movieId);
  } catch {
    return { error: "falhou" };
  }
  revalidatePath("/", "layout");
  return { status };
}
