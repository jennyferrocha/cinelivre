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
