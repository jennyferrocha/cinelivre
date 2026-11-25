// O que acontece ao tocar numa estrela (roda no navegador): muda na hora, confirma com o
// servidor e desfaz se der errado. Separado do componente para poder ser testado.

/** Tocar na mesma estrela apaga a nota; em outra, troca. */
export function nextStars(current: number | null, clicked: number): number | null {
  return current === clicked ? null : clicked;
}

export type StarsDeps = {
  /** Salva no servidor; true = deu certo. */
  save: (stars: number | null) => Promise<boolean>;
  set: (stars: number | null) => void;
  onError: () => void;
  /** Um toque ainda salvando: os próximos são ignorados até terminar. */
  busy: { value: boolean };
};

export async function runStarsChange(current: number | null, clicked: number, deps: StarsDeps): Promise<void> {
  if (deps.busy.value) return;
  deps.busy.value = true;
  const next = nextStars(current, clicked);
  try {
    deps.set(next);
    let ok = false;
    try {
      ok = await deps.save(next);
    } catch {
      ok = false;
    }
    if (!ok) {
      deps.set(current);
      deps.onError();
    }
  } finally {
    deps.busy.value = false;
  }
}
