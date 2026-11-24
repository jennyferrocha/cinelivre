import { afterEach, describe, expect, it, vi } from "vitest";

const getMovieDetails = vi.fn();
const saveMark = vi.fn();
vi.mock("@/lib/movies/details", () => ({ getMovieDetails }));
vi.mock("@/lib/marks/store", () => ({ saveMark }));

const { applyPendingMark } = await import("@/lib/auth/pending");

describe("applyPendingMark", () => {
  afterEach(() => {
    getMovieDetails.mockReset();
    saveMark.mockReset();
  });

  it("depois de entrar, marca o filme que a pessoa tinha tocado", async () => {
    getMovieDetails.mockResolvedValue({
      id: 603,
      title: "Matrix",
      year: "1999",
      rating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
    });
    await applyPendingMark("u1", { movieId: 603, status: "quero" });
    expect(getMovieDetails).toHaveBeenCalledWith(603, null, []);
    expect(saveMark).toHaveBeenCalledWith(
      "u1",
      { movieId: 603, title: "Matrix", year: "1999", posterPath: "/m.jpg", rating: 8.2 },
      "quero",
    );
  });

  it("sem pendência, não faz nada", async () => {
    await applyPendingMark("u1", null);
    expect(getMovieDetails).not.toHaveBeenCalled();
  });

  it("filme inexistente ou erro: ignora sem quebrar o login", async () => {
    getMovieDetails.mockResolvedValueOnce(null);
    await expect(applyPendingMark("u1", { movieId: 999999999, status: "quero" })).resolves.toBeUndefined();
    getMovieDetails.mockRejectedValueOnce(new Error("tmdb fora"));
    await expect(applyPendingMark("u1", { movieId: 603, status: "assisti" })).resolves.toBeUndefined();
    saveMark.mockRejectedValueOnce(new Error("banco"));
    getMovieDetails.mockResolvedValueOnce({ id: 1, title: "x", year: "", rating: 0, posterUrl: null });
    await expect(applyPendingMark("u1", { movieId: 1, status: "assisti" })).resolves.toBeUndefined();
    expect(saveMark).toHaveBeenCalledTimes(1);
  });
});
