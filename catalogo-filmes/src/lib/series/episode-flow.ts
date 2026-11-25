// O que acontece ao marcar/desmarcar episódios (roda no navegador): muda na hora, confirma com
// o servidor e desfaz se der errado. Separado do componente para poder ser testado.
import { episodeKey, type EpisodeRef } from "@/lib/series/progress";

export type EpisodeDeps = {
  save: (list: EpisodeRef[], watched: boolean) => Promise<"ok" | "login" | "falhou">;
  /** Aplica na tela (marca ou desmarca a lista). */
  apply: (list: EpisodeRef[], watched: boolean) => void;
  onLogin: () => void;
  onError: () => void;
  /** Episódios com um toque ainda sendo salvo ("temporada:episódio"). */
  busy: Set<string>;
};

export async function runEpisodeChange(list: EpisodeRef[], watched: boolean, deps: EpisodeDeps): Promise<void> {
  const keys = list.map(episodeKey);
  if (keys.some((k) => deps.busy.has(k))) return;
  keys.forEach((k) => deps.busy.add(k));
  try {
    deps.apply(list, watched);
    let result: "ok" | "login" | "falhou";
    try {
      result = await deps.save(list, watched);
    } catch {
      result = "falhou"; // a chamada nem chegou ao servidor
    }
    if (result === "ok") return;
    deps.apply(list, !watched);
    if (result === "login") deps.onLogin();
    else deps.onError();
  } finally {
    keys.forEach((k) => deps.busy.delete(k));
  }
}
