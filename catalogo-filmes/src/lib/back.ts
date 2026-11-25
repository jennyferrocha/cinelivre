// Regra da seta "← Voltar": volta para a tela anterior se ela for do próprio CineLivre
// (guardada na sessão do navegador); senão, vai para Séries ou Filmes.

export type Trail = { last?: string; prev?: string };

export const TRAIL_KEY = "cinelivre-trilha";

/** Nova página: a atual vira a anterior. Mesma página (recarregar): nada muda. */
export function nextTrail(trail: Trail, current: string): Trail {
  if (trail.last === current) return trail;
  return { last: current, prev: trail.last };
}

/** Dá para voltar com o "voltar" do navegador sem sair do app? */
export function canGoBack(trail: Trail, current: string): boolean {
  return !!trail.prev && trail.prev !== current && trail.last === current;
}

export function readTrail(storage: Pick<Storage, "getItem"> | null): Trail {
  try {
    const raw = storage?.getItem(TRAIL_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Trail;
    return {
      ...(typeof data.last === "string" ? { last: data.last } : {}),
      ...(typeof data.prev === "string" ? { prev: data.prev } : {}),
    };
  } catch {
    return {};
  }
}

export function writeTrail(storage: Pick<Storage, "setItem"> | null, trail: Trail): void {
  try {
    storage?.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch {
    // sem sessionStorage: a seta usa o destino padrão
  }
}

/** Para onde a seta vai quando não há tela anterior no app. */
export function backFallback(kind: "tv" | "movie"): string {
  return kind === "tv" ? "/?tipo=series" : "/";
}
