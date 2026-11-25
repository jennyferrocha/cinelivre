import { describe, expect, it } from "vitest";
import { parseSeriesTab, parseTab, SERIES_TABS } from "@/lib/marks/tabs";

describe("parseTab", () => {
  it("lê a aba do endereço", () => {
    expect(parseTab("quero")).toBe("quero");
    expect(parseTab(["assisti"])).toBe("assisti");
  });

  it("sem aba ou aba desconhecida = 'Para você'", () => {
    expect(parseTab(undefined)).toBe("para-voce");
    expect(parseTab("")).toBe("para-voce");
    expect(parseTab("xyz")).toBe("para-voce");
  });
});

describe("parseSeriesTab", () => {
  it("abas de séries", () => {
    for (const t of ["quero", "acompanhando", "assisti", "parei"] as const) expect(parseSeriesTab(t)).toBe(t);
    for (const bad of [undefined, "", "x", "ACOMPANHANDO"]) expect(parseSeriesTab(bad)).toBe("para-voce");
    expect(SERIES_TABS.map((t) => [t.label, t.href])).toEqual([
      ["Para você", "/?tipo=series"],
      ["Quero assistir", "/?tipo=series&aba=quero"],
      ["Acompanhando", "/?tipo=series&aba=acompanhando"],
      ["Já assisti", "/?tipo=series&aba=assisti"],
      ["Parei de assistir", "/?tipo=series&aba=parei"],
    ]);
  });
});
