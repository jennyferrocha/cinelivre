import { describe, expect, it } from "vitest";
import { homeHref, parseKind } from "@/lib/kind";

describe("parseKind", () => {
  it("só 'series' liga a parte de séries", () => {
    expect(parseKind("series")).toBe("series");
    expect(parseKind(["series", "x"])).toBe("series");
    for (const v of [undefined, "", "filmes", "SERIES", ["x"]]) expect(parseKind(v)).toBe("filmes");
  });
});

describe("homeHref", () => {
  it("monta o endereço da tela inicial", () => {
    expect(homeHref("filmes")).toBe("/");
    expect(homeHref("filmes", 7)).toBe("/?nota=7");
    expect(homeHref("series")).toBe("/?tipo=series");
    expect(homeHref("series", 8)).toBe("/?tipo=series&nota=8");
  });
});
