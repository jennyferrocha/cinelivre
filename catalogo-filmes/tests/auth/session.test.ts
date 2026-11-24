import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseServer = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServer }));

const { getCurrentUser } = await import("@/lib/auth/session");

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

  it("com sessão válida, devolve id e e-mail", async () => {
    createSupabaseServer.mockResolvedValue(
      clientWith(async () => ({ data: { user: { id: "u1", email: "a@b.c" } }, error: null })),
    );
    expect(await getCurrentUser()).toEqual({ id: "u1", email: "a@b.c" });
  });
});
