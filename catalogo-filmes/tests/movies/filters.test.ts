import { describe, expect, it } from "vitest";
import { formatRating, parseRating, RATING_OPTIONS } from "@/lib/movies/filters";

describe("parseRating", () => {
  it("aceita as opções 6, 7 e 8", () => {
    expect(RATING_OPTIONS).toEqual([6, 7, 8]);
    expect(parseRating("7")).toBe(7);
    expect(parseRating(["8", "6"])).toBe(8);
  });

  it("ignora valores ausentes ou inválidos", () => {
    expect(parseRating(undefined)).toBeUndefined();
    expect(parseRating("")).toBeUndefined();
    expect(parseRating("abc")).toBeUndefined();
    expect(parseRating("99")).toBeUndefined();
    expect(parseRating("7.5")).toBeUndefined();
    expect(parseRating("5")).toBeUndefined();
  });
});

describe("formatRating", () => {
  it("usa vírgula e uma casa decimal", () => {
    expect(formatRating(7.25)).toBe("7,3");
    expect(formatRating(8)).toBe("8,0");
  });

  it("nota zero não aparece", () => {
    expect(formatRating(0)).toBeNull();
  });
});
