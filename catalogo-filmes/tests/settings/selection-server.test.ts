import { afterEach, describe, expect, it, vi } from "vitest";

let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }),
}));
vi.mock("@/lib/providers/service", () => ({
  getServiceGroups: async () => [{ key: "netflix" }, { key: "hbo-max" }],
}));
const getCurrentUser = vi.fn();
const getAccountSelection = vi.fn();
vi.mock("@/lib/auth/session", () => ({ getCurrentUser }));
vi.mock("@/lib/settings/store", () => ({ getAccountSelection }));

const { getEffectiveSelection, getSelection } = await import("@/lib/selection-server");

const device = { services: ["netflix"], includeFree: true };
const account = { services: ["hbo-max"], includeFree: false };

describe("getSelection", () => {
  afterEach(() => {
    cookieValue = undefined;
    getCurrentUser.mockReset();
    getAccountSelection.mockReset();
  });

  it("logada com escolha na conta: vale a da conta", async () => {
    cookieValue = JSON.stringify(device);
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    getAccountSelection.mockResolvedValue(account);
    expect(await getSelection()).toEqual(account);
  });

  it("logada sem escolha na conta: vale a do aparelho", async () => {
    cookieValue = JSON.stringify(device);
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    getAccountSelection.mockResolvedValue(null);
    expect(await getSelection()).toEqual(device);
  });

  it("sem login: vale a do aparelho e nem consulta a conta", async () => {
    cookieValue = JSON.stringify(device);
    getCurrentUser.mockResolvedValue(null);
    expect(await getSelection()).toEqual(device);
    expect(getAccountSelection).not.toHaveBeenCalled();
  });

  it("serviço da conta que não existe mais é ignorado", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    getAccountSelection.mockResolvedValue({ services: ["sumiu", "netflix"], includeFree: false });
    expect(await getSelection()).toEqual({ services: ["netflix"], includeFree: false });
  });
});

describe("getEffectiveSelection", () => {
  const all = { services: ["netflix", "hbo-max"], includeFree: true };

  afterEach(() => {
    cookieValue = undefined;
    getCurrentUser.mockReset();
    getAccountSelection.mockReset();
  });

  it("sem escolha nenhuma: todos os streamings, marcado como não escolhido", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await getEffectiveSelection()).toEqual({ selection: all, chosen: false });
  });

  it("cookie corrompido conta como sem escolha", async () => {
    cookieValue = "{x";
    getCurrentUser.mockResolvedValue(null);
    expect(await getEffectiveSelection()).toEqual({ selection: all, chosen: false });
  });

  it("logada sem escolha na conta nem no aparelho: todos", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    getAccountSelection.mockResolvedValue(null);
    expect(await getEffectiveSelection()).toEqual({ selection: all, chosen: false });
  });

  it("com escolha real (aparelho ou conta): usa ela", async () => {
    cookieValue = JSON.stringify(device);
    getCurrentUser.mockResolvedValue(null);
    expect(await getEffectiveSelection()).toEqual({ selection: device, chosen: true });
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.c" });
    getAccountSelection.mockResolvedValue(account);
    expect(await getEffectiveSelection()).toEqual({ selection: account, chosen: true });
  });
});
