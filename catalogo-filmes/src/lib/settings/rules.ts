// Regras puras dos streamings guardados na conta.
import type { Selection } from "@/lib/selection";

export function sameSelection(a: Selection, b: Selection): boolean {
  const sa = [...a.services].sort().join("|");
  const sb = [...b.services].sort().join("|");
  return sa === sb && a.includeFree === b.includeFree;
}

/**
 * Ao entrar: se a conta já tem uma escolha, ela vale (com aviso quando era diferente da do
 * aparelho). Se não tem, a do aparelho é copiada para a conta.
 */
export function reconcileOnLogin(
  account: Selection | null,
  device: Selection | null,
): { selection: Selection | null; copyToAccount: boolean; notice: boolean } {
  if (account) return { selection: account, copyToAccount: false, notice: !!device && !sameSelection(account, device) };
  if (device) return { selection: device, copyToAccount: true, notice: false };
  return { selection: null, copyToAccount: false, notice: false };
}
