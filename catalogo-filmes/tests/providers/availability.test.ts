import { describe, expect, it } from "vitest";
import { availableServices } from "@/lib/providers/availability";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { TmdbProvider } from "@/lib/tmdb/types";

const prov = (id: number, name: string): TmdbProvider => ({ provider_id: id, provider_name: name, logo_path: "" });

const groups: ServiceGroup[] = [
  { key: "netflix", name: "Netflix", logoPath: "", providerIds: [8, 1796], isChannel: false, priority: 0 },
  { key: "amazon-prime-video", name: "Amazon Prime Video", logoPath: "", providerIds: [119, 2100], isChannel: false, priority: 3 },
  { key: "paramount-amazon-channel", name: "Paramount+ Amazon Channel", logoPath: "", providerIds: [582], isChannel: true, priority: 37 },
];

const netflixOnly = { services: ["netflix"], includeFree: false };

describe("availableServices", () => {
  it("conta Netflix com anúncios quando Netflix está marcado", () => {
    expect(availableServices({ ads: [prov(1796, "Netflix Standard with Ads")] }, netflixOnly, groups)).toEqual([
      { key: "netflix", name: "Netflix", free: false },
    ]);
  });

  it("conta assinatura (flatrate)", () => {
    expect(availableServices({ flatrate: [prov(8, "Netflix")] }, netflixOnly, groups)).toHaveLength(1);
  });

  it("não conta aluguel nem compra", () => {
    expect(availableServices({ rent: [prov(8, "Netflix")], buy: [prov(8, "Netflix")] }, netflixOnly, groups)).toEqual([]);
  });

  it("não conta canal se só o serviço principal está marcado", () => {
    const selection = { services: ["amazon-prime-video"], includeFree: false };
    expect(availableServices({ flatrate: [prov(582, "Paramount+ Amazon Channel")] }, selection, groups)).toEqual([]);
  });

  it("conta canal quando o próprio canal está marcado", () => {
    const selection = { services: ["paramount-amazon-channel"], includeFree: false };
    expect(availableServices({ flatrate: [prov(582, "Paramount+ Amazon Channel")] }, selection, groups)).toHaveLength(1);
  });

  it("grátis ligado conta Pluto TV em ads", () => {
    const selection = { services: [], includeFree: true };
    expect(availableServices({ ads: [prov(300, "Pluto TV")] }, selection, groups)).toEqual([
      { key: "free-300", name: "Pluto TV", free: true },
    ]);
  });

  it("grátis desligado ignora Pluto TV", () => {
    expect(availableServices({ ads: [prov(300, "Pluto TV")] }, netflixOnly, groups)).toEqual([]);
  });

  it("devolve vazio quando o filme não tem ofertas no Brasil", () => {
    expect(availableServices(undefined, netflixOnly, groups)).toEqual([]);
  });

  it("não repete serviços e coloca os pagos antes dos grátis", () => {
    const selection = { services: ["netflix"], includeFree: true };
    const result = availableServices(
      {
        free: [prov(300, "Pluto TV")],
        ads: [prov(300, "Pluto TV"), prov(1796, "Netflix Standard with Ads")],
        flatrate: [prov(8, "Netflix")],
      },
      selection,
      groups,
    );
    expect(result.map((s) => s.key)).toEqual(["netflix", "free-300"]);
  });

  it("ignora serviços marcados que não existem mais", () => {
    const selection = { services: ["sumiu"], includeFree: false };
    expect(availableServices({ flatrate: [prov(8, "Netflix")] }, selection, groups)).toEqual([]);
  });
});
