import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import type { TmdbProvider, TmdbRegionOffers } from "@/lib/tmdb/types";

export type ServiceLabel = { key: string; name: string; free: boolean };

/**
 * Em quais serviços da pessoa este filme está disponível agora.
 * Regra: na dúvida, esconder. Aluguel e compra nunca contam.
 */
export function availableServices(
  offers: TmdbRegionOffers | undefined,
  selection: Selection,
  groups: ServiceGroup[],
): ServiceLabel[] {
  if (!offers) return [];

  const included: TmdbProvider[] = [
    ...(offers.flatrate ?? []),
    ...(offers.ads ?? []),
    ...(offers.free ?? []),
  ];
  const includedIds = new Set(included.map((p) => p.provider_id));

  const paid: ServiceLabel[] = groups
    .filter((g) => selection.services.includes(g.key))
    .filter((g) => g.providerIds.some((id) => includedIds.has(id)))
    .map((g) => ({ key: g.key, name: g.name, free: false }));

  const free: ServiceLabel[] = [];
  if (selection.includeFree) {
    const paidIds = new Set(
      groups.filter((g) => paid.some((s) => s.key === g.key)).flatMap((g) => g.providerIds),
    );
    for (const p of [...(offers.free ?? []), ...(offers.ads ?? [])]) {
      const key = `free-${p.provider_id}`;
      if (paidIds.has(p.provider_id) || free.some((s) => s.key === key)) continue;
      free.push({ key, name: p.provider_name, free: true });
    }
  }

  return [...paid, ...free];
}
