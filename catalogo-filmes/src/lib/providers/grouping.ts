import type { TmdbProvider } from "@/lib/tmdb/types";

// O TMDB lista variações do mesmo serviço como provedores diferentes
// (ex.: "Netflix" e "Netflix Standard with Ads"). Aqui juntamos tudo num
// "serviço" só, que é o que a pessoa vê e marca na tela de streamings.

export type ServiceGroup = {
  key: string;
  name: string;
  logoPath: string;
  providerIds: number[];
  isChannel: boolean;
  priority: number;
};

/** Lojas de aluguel/compra e agregadores: nunca aparecem para escolher. */
export const HIDDEN_PROVIDER_IDS = [
  2, // Apple TV Store
  3, // Google Play Movies
  10, // Amazon Video (loja)
  2791, // JustWatch TV Beta
];

export function baseServiceName(name: string): string {
  return name
    .replace(/\s+(standard|basic)?\s*with ads$/i, "")
    .replace(/\s+premium$/i, "")
    .trim();
}

export function serviceKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priorityOf(provider: TmdbProvider): number {
  return provider.display_priorities?.BR ?? provider.display_priority ?? 999;
}

export function groupProviders(raw: TmdbProvider[]): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();
  const sorted = raw
    .filter((p) => !HIDDEN_PROVIDER_IDS.includes(p.provider_id))
    .sort((a, b) => priorityOf(a) - priorityOf(b));

  for (const provider of sorted) {
    const name = baseServiceName(provider.provider_name);
    const key = serviceKey(name);
    const existing = groups.get(key);
    if (existing) {
      existing.providerIds.push(provider.provider_id);
      continue;
    }
    groups.set(key, {
      key,
      name,
      logoPath: provider.logo_path,
      providerIds: [provider.provider_id],
      isChannel: /channel/i.test(provider.provider_name),
      priority: priorityOf(provider),
    });
  }
  return [...groups.values()];
}
