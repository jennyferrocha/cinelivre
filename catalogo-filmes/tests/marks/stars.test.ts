import { describe, expect, it } from "vitest";
import { starsUpdate } from "@/lib/marks/rules";

describe("starsUpdate", () => {
  it("dar estrelas põe o filme em 'Já assisti'", () => {
    expect(starsUpdate(null, 4)).toBe("assisti");
    expect(starsUpdate("quero", 4)).toBe("assisti");
    expect(starsUpdate("assisti", 2)).toBe("assisti");
  });
  it("apagar estrelas não tira da lista", () => {
    expect(starsUpdate("assisti", null)).toBe("assisti");
    expect(starsUpdate("quero", null)).toBe("quero");
    expect(starsUpdate(null, null)).toBeNull();
  });
});
