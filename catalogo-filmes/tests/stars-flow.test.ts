import { describe, expect, it, vi } from "vitest";
import { nextStars, runStarsChange } from "@/lib/stars-flow";

describe("nextStars", () => {
  it("tocar na mesma estrela apaga; em outra, troca", () => {
    expect(nextStars(null, 3)).toBe(3);
    expect(nextStars(3, 3)).toBeNull();
    expect(nextStars(3, 5)).toBe(5);
  });
});

describe("runStarsChange", () => {
  const deps = (save: () => Promise<boolean>) => ({ save: vi.fn(save), set: vi.fn(), onError: vi.fn(), busy: { value: false } });

  it("muda na hora e mantém quando o servidor confirma", async () => {
    const d = deps(async () => true);
    await runStarsChange(2, 4, d);
    expect(d.set.mock.calls).toEqual([[4]]);
    expect(d.save).toHaveBeenCalledWith(4);
    expect(d.onError).not.toHaveBeenCalled();
    expect(d.busy.value).toBe(false);
  });

  it("desfaz e avisa quando o servidor recusa", async () => {
    const d = deps(async () => false);
    await runStarsChange(2, 2, d);
    expect(d.set.mock.calls).toEqual([[null], [2]]);
    expect(d.onError).toHaveBeenCalledOnce();
  });

  it("desfaz e avisa quando a chamada nem chega", async () => {
    const d = deps(async () => {
      throw new Error("rede");
    });
    await runStarsChange(null, 5, d);
    expect(d.set.mock.calls).toEqual([[5], [null]]);
    expect(d.onError).toHaveBeenCalledOnce();
    expect(d.busy.value).toBe(false);
  });

  it("ignora toque enquanto o anterior salva", async () => {
    const d = deps(async () => true);
    d.busy.value = true;
    await runStarsChange(null, 5, d);
    expect(d.save).not.toHaveBeenCalled();
    expect(d.set).not.toHaveBeenCalled();
  });
});
