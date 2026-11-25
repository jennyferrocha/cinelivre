import { describe, expect, it } from "vitest";
import { cardHref, cardKey, certificationLabel } from "@/lib/titles";

describe("cardHref", () => {
  it("filme vai para /filme, série para /serie", () => {
    expect(cardHref({ id: 7 })).toBe("/filme/7");
    expect(cardHref({ id: 7, kind: "tv" })).toBe("/serie/7");
  });
});

describe("certificationLabel", () => {
  it("L vira Livre, número vira anos", () => {
    expect(certificationLabel("L")).toBe("Livre");
    expect(certificationLabel("14")).toBe("14 anos");
    expect(certificationLabel("TV-MA")).toBe("TV-MA");
  });
});

describe("cardKey", () => {
  it("filme e série com o mesmo id têm chaves diferentes", () => {
    expect(cardKey({ id: 5 })).toBe("movie:5");
    expect(cardKey({ id: 5, kind: "tv" })).toBe("tv:5");
  });
});
