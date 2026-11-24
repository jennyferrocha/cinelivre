"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { nextStatus, type MarkSnapshot, type MarkStatus } from "@/lib/marks/rules";
import { deleteMark, saveMark } from "@/lib/marks/store";

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
  if (!Number.isInteger(movie.movieId) || movie.movieId <= 0) return { error: "falhou" };
  if (clicked !== "quero" && clicked !== "assisti") return { error: "falhou" };
  const user = await getCurrentUser();
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
