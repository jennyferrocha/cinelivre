import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseServer = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServer }));
const calls: string[] = [];
vi.mock("next/server", () => ({ connection: vi.fn(async () => { calls.push("connection"); }) }));

const { getCurrentUser, getSessionState } = await import("@/lib/auth/session");

const clientWith = (getUser: () => unknown) => ({ auth: { getUser: vi.fn(getUser) } });

describe("getCurrentUser", () => {
  afterEach(() => createSupabaseServer.mockReset());

  it("sem Supabase configurado, ninguém está logado", async () => {
    createSupabaseServer.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it("erro do Supabase vira 'ninguém logado'", async () => {
    createSupabaseServer.mockResolvedValue(clientWith(async () => ({ data: { user: null }, error: { message: "x" } })));
    expect(await getCurrentUser()).toBeNull();
  });

  it("exceção (Supabase fora do ar) vira 'ninguém logado'", async () => {
    createSupabaseServer.mockResolvedValue(clientWith(async () => { throw new Error("rede"); }));
    expect(await getCurrentUser()).toBeNull();
  });

  it("marca a leitura como 'na hora do pedido' antes de consultar o Supabase (Next 16)", async () => {
    calls.length = 0;
    createSupabaseServer.mockImplementation(async () => {
      calls.push("supabase");
      return clientWith(async () => ({ data: { user: null }, error: null }));
    });
    await getCurrentUser();
    expect(calls).toEqual(["connection", "supabase"]);
  });

  it("com sessão válida, devolve id e e-mail", async () => {
    createSupabaseServer.mockResolvedValue(
      clientWith(async () => ({ data: { user: { id: "u1", email: "a@b.c" } }, error: null })),
    );
    expect(await getCurrentUser()).toEqual({ id: "u1", email: "a@b.c" });
  });

  it("sem sessão é 'deslogada', não 'fora do ar'", async () => {
    createSupabaseServer.mockResolvedValue(
      clientWith(async () => ({ data: { user: null }, error: { name: "AuthSessionMissingError", status: 400 } })),
    );
    expect(await getSessionState()).toEqual({ user: null, unavailable: false });
  });

  it("Supabase sem responder (rede ou erro 5xx) é 'fora do ar', não 'deslogada'", async () => {
    createSupabaseServer.mockResolvedValue(
      clientWith(async () => ({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 0 } })),
    );
    expect(await getSessionState()).toEqual({ user: null, unavailable: true });
    createSupabaseServer.mockResolvedValue(
      clientWith(async () => ({ data: { user: null }, error: { name: "AuthApiError", status: 503 } })),
    );
    expect(await getSessionState()).toEqual({ user: null, unavailable: true });
    createSupabaseServer.mockResolvedValue(clientWith(async () => { throw new Error("timeout"); }));
    expect(await getSessionState()).toEqual({ user: null, unavailable: true });
  });
});
