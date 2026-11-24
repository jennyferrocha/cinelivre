import { describe, expect, it } from "vitest";
import { baseServiceName, groupProviders, serviceKey } from "@/lib/providers/grouping";
import type { TmdbProvider } from "@/lib/tmdb/types";
import providersBR from "../fixtures/providers-br.json";

const p = (id: number, name: string, br: number): TmdbProvider => ({
  provider_id: id,
  provider_name: name,
  logo_path: `/${id}.png`,
  display_priorities: { BR: br },
});

describe("baseServiceName", () => {
  it("tira o sufixo de plano com anúncios", () => {
    expect(baseServiceName("Netflix Standard with Ads")).toBe("Netflix");
    expect(baseServiceName("Amazon Prime Video with Ads")).toBe("Amazon Prime Video");
  });

  it("tira o sufixo Premium", () => {
    expect(baseServiceName("Paramount Plus Premium")).toBe("Paramount Plus");
  });

  it("mantém nomes normais", () => {
    expect(baseServiceName("Max")).toBe("Max");
    expect(baseServiceName("Paramount+ Amazon Channel")).toBe("Paramount+ Amazon Channel");
  });
});

describe("serviceKey", () => {
  it("gera slug sem acentos e símbolos", () => {
    expect(serviceKey("Amazon Prime Video")).toBe("amazon-prime-video");
    expect(serviceKey("Paramount+ Amazon Channel")).toBe("paramount-amazon-channel");
    expect(serviceKey("Belas Artes à La Carte")).toBe("belas-artes-a-la-carte");
  });
});

describe("groupProviders", () => {
  const groups = groupProviders([
    p(582, "Paramount+ Amazon Channel", 37),
    p(1796, "Netflix Standard with Ads", 42),
    p(8, "Netflix", 0),
  ]);

  it("junta o plano com anúncios no serviço principal", () => {
    const netflix = groups.find((g) => g.key === "netflix");
    expect(netflix).toMatchObject({ name: "Netflix", providerIds: [8, 1796], isChannel: false, priority: 0 });
    expect(netflix?.logoPath).toBe("/8.png");
  });

  it("marca canais como grupo separado", () => {
    expect(groups.find((g) => g.key === "paramount-amazon-channel")?.isChannel).toBe(true);
  });

  it("ordena pela prioridade no Brasil", () => {
    expect(groups.map((g) => g.key)).toEqual(["netflix", "paramount-amazon-channel"]);
  });

  it("esconde lojas de aluguel/compra", () => {
    const keys = groupProviders([p(2, "Apple TV Store", 11), p(10, "Amazon Video", 15)]).map((g) => g.key);
    expect(keys).toEqual([]);
  });

  it("com os dados reais do Brasil, os 9 primeiros serviços não são canais nem lojas", () => {
    const top = groupProviders(providersBR as TmdbProvider[])
      .filter((g) => !g.isChannel)
      .slice(0, 9)
      .map((g) => g.key);
    expect(top).toContain("netflix");
    expect(top).toContain("globoplay");
    expect(top).not.toContain("apple-tv-store");
    expect(new Set(top).size).toBe(9);
  });
});
