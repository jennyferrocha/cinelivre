// Regras que valem para filmes e séries (pode ser usado no navegador).

/** Endereço da página do título: filme em /filme/{id}, série em /serie/{id}. */
export function cardHref(card: { id: number; kind?: "tv" }): string {
  return card.kind === "tv" ? `/serie/${card.id}` : `/filme/${card.id}`;
}

/** "L" → "Livre", "14" → "14 anos". */
export function certificationLabel(cert: string): string {
  return cert === "L" ? "Livre" : /^\d+$/.test(cert) ? `${cert} anos` : cert;
}

/** Id da URL (/filme/123, /serie/123): só números positivos. */
export function parseId(raw: string): number | null {
  return /^\d{1,10}$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
}
