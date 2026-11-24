import { afterEach, describe, expect, it, vi } from "vitest";

const getSessionState = vi.fn();
const saveMark = vi.fn();
const deleteMark = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getSessionState }));
const getCurrentUser = {
  mockResolvedValue: (user: unknown) => getSessionState.mockResolvedValue({ user, unavailable: false }),
  mockReset: () => getSessionState.mockReset(),
};
vi.mock("@/lib/marks/store", () => ({ saveMark, deleteMark }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { toggleMark } = await import("@/lib/marks/actions");

const movie = { movieId: 603, title: "Matrix", year: "1999", posterPath: "/m.jpg", rating: 8.2 };

describe("toggleMark", () => {
  afterEach(() => {
    getCurrentUser.mockReset();
    saveMark.mockReset();
    deleteMark.mockReset();
  });

  it("sem login (ou sessão expirada), pede para entrar", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await toggleMark(movie, "quero", null)).toEqual({ error: "login" });
    expect(saveMark).not.toHaveBeenCalled();
  });

  it("marca quando ainda não estava em nenhuma lista", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    expect(await toggleMark(movie, "quero", null)).toEqual({ status: "quero" });
    expect(saveMark).toHaveBeenCalledWith("u1", movie, "quero");
  });

  it("tocar de novo no mesmo botão desmarca", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    expect(await toggleMark(movie, "quero", "quero")).toEqual({ status: null });
    expect(deleteMark).toHaveBeenCalledWith("u1", 603);
  });

  it("erro do banco vira 'falhou' (o botão volta ao estado anterior)", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    saveMark.mockRejectedValue(new Error("rede"));
    expect(await toggleMark(movie, "assisti", "quero")).toEqual({ error: "falhou" });
  });

  it("Supabase fora do ar: 'falhou' (não manda a pessoa logada para o login)", async () => {
    getSessionState.mockResolvedValue({ user: null, unavailable: true });
    expect(await toggleMark(movie, "quero", null)).toEqual({ error: "falhou" });
  });

  it("id de filme inválido nem chega ao banco", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    for (const movieId of [0, -1, 1.5, Number.NaN]) {
      expect(await toggleMark({ ...movie, movieId }, "quero", null)).toEqual({ error: "falhou" });
    }
    expect(saveMark).not.toHaveBeenCalled();
  });
});
