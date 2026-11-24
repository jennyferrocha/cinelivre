import { describe, expect, it, vi } from "vitest";
import { runToggle } from "@/lib/marks/toggle-flow";

const movie = { movieId: 603, title: "Matrix", year: "1999", posterPath: null, rating: 8 };

function deps(toggle: () => Promise<unknown>) {
  return { toggle: vi.fn(toggle), setStatus: vi.fn(), onLogin: vi.fn(), onError: vi.fn(), busy: new Set<number>() };
}

describe("runToggle", () => {
  it("muda na hora e confirma com a resposta do servidor", async () => {
    const d = deps(async () => ({ status: "quero" }));
    await runToggle(movie, "quero", null, d as never);
    expect(d.setStatus.mock.calls).toEqual([[603, "quero"], [603, "quero"]]);
    expect(d.onError).not.toHaveBeenCalled();
  });

  it("falha de rede (a chamada nem chega): desfaz e avisa, sem quebrar a página", async () => {
    const d = deps(async () => {
      throw new Error("Failed to fetch");
    });
    await expect(runToggle(movie, "assisti", "quero", d as never)).resolves.toBeUndefined();
    expect(d.setStatus.mock.calls.at(-1)).toEqual([603, "quero"]);
    expect(d.onError).toHaveBeenCalled();
  });

  it("precisa entrar: desfaz e leva ao login", async () => {
    const d = deps(async () => ({ error: "login" }));
    await runToggle(movie, "quero", null, d as never);
    expect(d.setStatus.mock.calls.at(-1)).toEqual([603, null]);
    expect(d.onLogin).toHaveBeenCalledWith("quero");
  });

  it("erro ao salvar: desfaz e avisa", async () => {
    const d = deps(async () => ({ error: "falhou" }));
    await runToggle(movie, "quero", "assisti", d as never);
    expect(d.setStatus.mock.calls.at(-1)).toEqual([603, "assisti"]);
    expect(d.onError).toHaveBeenCalled();
  });

  it("dois toques rápidos no mesmo filme: o segundo espera o primeiro terminar (é ignorado)", async () => {
    let finish!: (v: unknown) => void;
    const d = deps(() => new Promise((r) => (finish = r)));
    const first = runToggle(movie, "quero", null, d as never);
    await runToggle(movie, "quero", "quero", d as never); // chega enquanto o primeiro salva
    finish({ status: "quero" });
    await first;
    expect(d.toggle).toHaveBeenCalledTimes(1);
    expect(d.busy.size).toBe(0); // liberado no fim
  });

  it("depois de terminar (mesmo com erro), o filme pode ser tocado de novo", async () => {
    const d = deps(async () => {
      throw new Error("rede");
    });
    await runToggle(movie, "quero", null, d as never);
    await runToggle(movie, "quero", null, d as never);
    expect(d.toggle).toHaveBeenCalledTimes(2);
  });
});
