import { describe, expect, it } from "vitest";
import type { MovieCard } from "@/lib/movies/discover";
import { marksToCards, nextStatus, snapshotFromCard, watchedIds, type Mark, type MarkStatus } from "@/lib/marks/rules";

const m = (movieId: number, status: MarkStatus, markedAt = "2026-01-01T00:00:00Z"): Mark => ({
  movieId,
  status,
  markedAt,
  title: `Filme ${movieId}`,
  year: "2020",
  posterPath: "/p.jpg",
  rating: 7,
  stars: null,
});

describe("nextStatus", () => {
  it("tocar num botão marca; tocar de novo desmarca; tocar no outro troca de lista", () => {
    expect(nextStatus(null, "quero")).toBe("quero");
    expect(nextStatus("quero", "quero")).toBeNull();
    expect(nextStatus("quero", "assisti")).toBe("assisti");
    expect(nextStatus("assisti", "assisti")).toBeNull();
    expect(nextStatus("assisti", "quero")).toBe("quero");
  });
});

describe("snapshotFromCard", () => {
  it("guarda os dados do filme para a lista abrir rápido", () => {
    expect(
      snapshotFromCard({ id: 7, title: "X", year: "2020", rating: 7.1, posterUrl: "https://image.tmdb.org/t/p/w342/abc.jpg" } as MovieCard),
    ).toEqual({ movieId: 7, title: "X", year: "2020", posterPath: "/abc.jpg", rating: 7.1 });
  });

  it("sem pôster, posterPath fica null", () => {
    expect(snapshotFromCard({ id: 7, title: "X", year: "", rating: 0, posterUrl: null } as MovieCard).posterPath).toBeNull();
  });
});

describe("watchedIds", () => {
  it("só os de 'Já assisti'", () => {
    expect([...watchedIds([m(1, "assisti"), m(2, "quero"), m(3, "assisti")])]).toEqual([1, 3]);
  });
});

describe("marksToCards", () => {
  it("só a lista pedida, mais recentes primeiro, como pôsteres", () => {
    const cards = marksToCards(
      [m(1, "quero", "2026-01-01T00:00:00Z"), m(2, "quero", "2026-03-01T00:00:00Z"), m(3, "assisti")],
      "quero",
    );
    expect(cards.map((c) => c.id)).toEqual([2, 1]);
    expect(cards[0]).toMatchObject({
      title: "Filme 2",
      year: "2020",
      rating: 7,
      posterUrl: "https://image.tmdb.org/t/p/w342/p.jpg",
      services: [],
    });
  });
});
