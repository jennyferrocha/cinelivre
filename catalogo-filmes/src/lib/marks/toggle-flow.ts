// O que acontece ao tocar num botão de marcar (roda no navegador). Separado do componente
// para poder ser testado: muda na hora, confirma com o servidor e desfaz se der errado.
import type { MarkSnapshot, MarkStatus } from "@/lib/marks/rules";
import { nextStatus } from "@/lib/marks/rules";

type ToggleResult = { status: MarkStatus | null } | { error: "login" | "falhou" };

export type ToggleDeps = {
  toggle: (movie: MarkSnapshot, clicked: MarkStatus, current: MarkStatus | null) => Promise<ToggleResult>;
  setStatus: (movieId: number, status: MarkStatus | null) => void;
  onLogin: (clicked: MarkStatus) => void;
  onError: () => void;
};

export async function runToggle(
  movie: MarkSnapshot,
  clicked: MarkStatus,
  previous: MarkStatus | null,
  deps: ToggleDeps,
): Promise<void> {
  deps.setStatus(movie.movieId, nextStatus(previous, clicked));
  let result: ToggleResult;
  try {
    result = await deps.toggle(movie, clicked, previous);
  } catch {
    // A chamada nem chegou ao servidor (sem internet, servidor reiniciando...).
    deps.setStatus(movie.movieId, previous);
    deps.onError();
    return;
  }
  if ("error" in result) {
    deps.setStatus(movie.movieId, previous);
    if (result.error === "login") deps.onLogin(clicked);
    else deps.onError();
    return;
  }
  deps.setStatus(movie.movieId, result.status);
}
