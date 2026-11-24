// A escolha de streamings da pessoa, guardada num cookie no aparelho dela.
// Na etapa 2 (login), é só trocar a origem desses dados pela conta da pessoa.

export type Selection = {
  /** chaves dos serviços marcados (ServiceGroup.key) */
  services: string[];
  includeFree: boolean;
};

export const SELECTION_COOKIE = "cinelivre-selecao";

export function serializeSelection(selection: Selection): string {
  return JSON.stringify(selection);
}

function normalize(selection: Selection, validKeys?: string[]): Selection | null {
  const services = validKeys
    ? selection.services.filter((key) => validKeys.includes(key))
    : selection.services;
  if (services.length === 0 && !selection.includeFree) return null;
  return { services: [...new Set(services)], includeFree: selection.includeFree };
}

/** Lê o cookie. Qualquer coisa estranha vira "sem seleção" em vez de quebrar. */
export function parseSelection(raw: string | undefined, validKeys?: string[]): Selection | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const { services, includeFree } = data as Record<string, unknown>;
  if (!Array.isArray(services) || !services.every((s) => typeof s === "string")) return null;
  if (typeof includeFree !== "boolean") return null;
  return normalize({ services, includeFree }, validKeys);
}

/** Lê o formulário da tela de streamings. */
export function selectionFromForm(form: FormData, validKeys: string[]): Selection | null {
  const services = form.getAll("services").filter((v): v is string => typeof v === "string");
  return normalize({ services, includeFree: form.get("includeFree") === "on" }, validKeys);
}
