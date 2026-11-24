import { describe, expect, it } from "vitest";
import { parseTab } from "@/lib/marks/tabs";

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
