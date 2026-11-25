import { describe, expect, it } from "vitest";
import { cardHref, certificationLabel } from "@/lib/titles";

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
