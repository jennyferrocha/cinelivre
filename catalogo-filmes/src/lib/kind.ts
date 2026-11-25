// "Filmes | Séries" na tela inicial: a escolha fica na URL (`/?tipo=series`). Pode ser usado no navegador.

export type HomeKind = "filmes" | "series";

export function parseKind(value: string | string[] | undefined): HomeKind {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "series" ? "series" : "filmes";
}

/** Endereço da tela inicial para filmes ou séries, com a nota mínima (se houver). */
export function homeHref(kind: HomeKind, nota?: number): string {
  const params = new URLSearchParams();
  if (kind === "series") params.set("tipo", "series");
  if (nota) params.set("nota", String(nota));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
