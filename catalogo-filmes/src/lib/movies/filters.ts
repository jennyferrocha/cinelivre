/** Notas mínimas que a pessoa pode escolher (tela inicial e sugestões). */
export const RATING_OPTIONS = [6, 7, 8] as const;

/** Lê o `?nota=` da URL. Só aceita uma das opções; o resto vira "sem filtro". */
export function parseRating(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return RATING_OPTIONS.find((option) => String(option) === raw);
}

/** "7,3" (uma casa, vírgula). Nota 0 = filme sem votos, não mostra nada. */
export function formatRating(rating: number): string | null {
  return rating > 0 ? rating.toFixed(1).replace(".", ",") : null;
}
