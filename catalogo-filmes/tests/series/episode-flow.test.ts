import { describe, expect, it, vi } from "vitest";
import { runEpisodeChange } from "@/lib/series/episode-flow";

const list = [{ season: 1, episode: 1 }, { season: 1, episode: 2 }];
const deps = (save: () => Promise<"ok" | "login" | "falhou">) => ({
  save: vi.fn(save),
  apply: vi.fn(),
  onLogin: vi.fn(),
  onError: vi.fn(),
  busy: new Set<string>(),
});

describe("runEpisodeChange", () => {
  it("muda na hora e mantém quando o servidor confirma", async () => {
    const d = deps(async () => "ok");
    await runEpisodeChange(list, true, d);
    expect(d.apply.mock.calls).toEqual([[list, true]]);
    expect(d.save).toHaveBeenCalledWith(list, true);
    expect(d.busy.size).toBe(0);
  });

  it("falhou: desfaz e avisa", async () => {
    const d = deps(async () => "falhou");
    await runEpisodeChange(list, true, d);
    expect(d.apply.mock.calls).toEqual([[list, true], [list, false]]);
    expect(d.onError).toHaveBeenCalledOnce();
  });

  it("sem rede: desfaz e avisa", async () => {
    const d = deps(async () => {
      throw new Error("rede");
    });
    await runEpisodeChange(list, false, d);
    expect(d.apply.mock.calls).toEqual([[list, false], [list, true]]);
    expect(d.onError).toHaveBeenCalledOnce();
    expect(d.busy.size).toBe(0);
  });

  it("sessão expirou: desfaz e manda entrar", async () => {
    const d = deps(async () => "login");
    await runEpisodeChange(list, true, d);
    expect(d.apply.mock.calls).toEqual([[list, true], [list, false]]);
    expect(d.onLogin).toHaveBeenCalledOnce();
    expect(d.onError).not.toHaveBeenCalled();
  });

  it("toque repetido enquanto salva é ignorado", async () => {
    const d = deps(async () => "ok");
    d.busy.add("1:2");
    await runEpisodeChange([{ season: 1, episode: 2 }], true, d);
    expect(d.save).not.toHaveBeenCalled();
    expect(d.apply).not.toHaveBeenCalled();
  });
});
