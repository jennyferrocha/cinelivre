// Abas da tela inicial: "Para você" (/), "Quero assistir" (/?aba=quero), "Já assisti" (/?aba=assisti).

export type HomeTab = "para-voce" | "quero" | "assisti";

export const HOME_TABS: { id: HomeTab; label: string; href: string }[] = [
  { id: "para-voce", label: "Para você", href: "/" },
  { id: "quero", label: "Quero assistir", href: "/?aba=quero" },
  { id: "assisti", label: "Já assisti", href: "/?aba=assisti" },
];

export function parseTab(value: string | string[] | undefined): HomeTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "quero" || raw === "assisti" ? raw : "para-voce";
}

// Abas da parte de séries (`/?tipo=series&aba=…`).
export type SeriesTab = "para-voce" | "quero" | "acompanhando" | "assisti" | "parei";

export const SERIES_TABS: { id: SeriesTab; label: string; href: string }[] = [
  { id: "para-voce", label: "Para você", href: "/?tipo=series" },
  { id: "quero", label: "Quero assistir", href: "/?tipo=series&aba=quero" },
  { id: "acompanhando", label: "Acompanhando", href: "/?tipo=series&aba=acompanhando" },
  { id: "assisti", label: "Já assisti", href: "/?tipo=series&aba=assisti" },
  { id: "parei", label: "Parei de assistir", href: "/?tipo=series&aba=parei" },
];

export function parseSeriesTab(value: string | string[] | undefined): SeriesTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return SERIES_TABS.find((t) => t.id === raw)?.id ?? "para-voce";
}
