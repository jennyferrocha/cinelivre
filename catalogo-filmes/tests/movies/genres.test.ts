import { expect, it } from "vitest";
import { genreNames } from "@/lib/movies/genres";

const all = [
  { id: 35, name: "Comédia" },
  { id: 18, name: "Drama" },
];

it("traduz ids de gênero em nomes, ignorando os desconhecidos", () => {
  expect(genreNames([18, 999, 35], all)).toEqual(["Drama", "Comédia"]);
});

it("lista vazia dá lista vazia", () => {
  expect(genreNames([], all)).toEqual([]);
});
