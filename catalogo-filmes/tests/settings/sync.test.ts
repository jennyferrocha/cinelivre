import { afterEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
const setCookie = vi.fn((name: string, value: string) => jar.set(name, value));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (n: string) => (jar.has(n) ? { value: jar.get(n) } : undefined), set: setCookie }),
}));
vi.mock("@/lib/providers/service", () => ({
  getServiceGroups: async () => [{ key: "netflix" }, { key: "hbo-max" }],
}));
const getAccountSelection = vi.fn();
const saveAccountSelection = vi.fn();
vi.mock("@/lib/settings/store", () => ({ getAccountSelection, saveAccountSelection }));

const { syncSelectionOnLogin, NOTICE_COOKIE } = await import("@/lib/settings/sync");
const { SELECTION_COOKIE } = await import("@/lib/selection");

const device = { services: ["netflix"], includeFree: true };
const account = { services: ["hbo-max"], includeFree: false };

describe("syncSelectionOnLogin", () => {
  afterEach(() => {
    jar.clear();
    setCookie.mockClear();
    getAccountSelection.mockReset();
    saveAccountSelection.mockReset();
  });

  it("conta com escolha diferente: o aparelho passa a usar a da conta e aparece o aviso", async () => {
    jar.set(SELECTION_COOKIE, JSON.stringify(device));
    getAccountSelection.mockResolvedValue(account);
    await syncSelectionOnLogin("u1");
    expect(JSON.parse(jar.get(SELECTION_COOKIE)!)).toEqual(account);
    expect(jar.get(NOTICE_COOKIE)).toBe("streamings-da-conta");
    expect(saveAccountSelection).not.toHaveBeenCalled();
  });

  it("primeira vez: copia a escolha do aparelho para a conta, sem aviso", async () => {
    jar.set(SELECTION_COOKIE, JSON.stringify(device));
    getAccountSelection.mockResolvedValue(null);
    await syncSelectionOnLogin("u1");
    expect(saveAccountSelection).toHaveBeenCalledWith("u1", device);
    expect(jar.has(NOTICE_COOKIE)).toBe(false);
  });

  it("erro ao salvar na conta não impede o login", async () => {
    jar.set(SELECTION_COOKIE, JSON.stringify(device));
    getAccountSelection.mockResolvedValue(null);
    saveAccountSelection.mockRejectedValue(new Error("banco"));
    await expect(syncSelectionOnLogin("u1")).resolves.toBeUndefined();
  });
});
