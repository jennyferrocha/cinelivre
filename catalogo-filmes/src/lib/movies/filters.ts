import type { DiscoverFilters } from "@/lib/movies/discover";

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

export const RUNTIME_OPTIONS = [
  { value: 90, label: "Até 1h30" },
  { value: 120, label: "Até 2h" },
] as const;

export const SINCE_OPTIONS = [
  { value: 2015, label: "A partir de 2015" },
  { value: 2000, label: "A partir de 2000" },
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pickOption(raw: string | undefined, options: readonly { value: number }[]): number | undefined {
  return options.find((o) => String(o.value) === raw)?.value;
}

/** Gêneros vêm como "35,10749" ou repetidos (?generos=35&generos=28), como o formulário manda. */
function parseGenres(value: string | string[] | undefined): number[] {
  const parts = (Array.isArray(value) ? value : value ? [value] : []).flatMap((v) => v.split(","));
  const ids = parts.filter((p) => /^\d{1,6}$/.test(p.trim())).map((p) => Number(p.trim()));
  return [...new Set(ids)].filter((id) => id > 0);
}

/** Filtros da tela "O que eu assisto hoje?" a partir da URL. Valores inválidos são ignorados. */
export function parseFilterParams(sp: SearchParams): DiscoverFilters {
  const filters: DiscoverFilters = { sortBy: "popularity.desc" };
  const genres = parseGenres(sp.generos);
  if (genres.length) filters.genres = genres;
  const maxRuntime = pickOption(first(sp.duracao), RUNTIME_OPTIONS);
  if (maxRuntime) filters.maxRuntime = maxRuntime;
  const minRating = parseRating(sp.nota);
  if (minRating) filters.minRating = minRating;
  const since = pickOption(first(sp.desde), SINCE_OPTIONS);
  if (since) filters.releasedFrom = `${since}-01-01`;
  return filters;
}

/** Sorteia um item (para o "Me surpreenda"). */
export function pickRandom<T>(items: T[], rng: () => number = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

/**
 * Texto do pôster de um filme fora dos streamings. Sem escolha da pessoa, o app olhou todos
 * os serviços, então o filme não está em nenhum; com escolha, pode estar num que ela não assina.
 */
export function unavailableLabel(chosen: boolean): string {
  return chosen ? "Não está nos seus streamings" : "Não está em nenhum streaming";
}
