import { afterEach, describe, expect, it, vi } from "vitest";

const createSupabaseServer = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServer }));
vi.mock("@/lib/auth/pending", () => ({ applyPendingMark: vi.fn() }));
vi.mock("@/lib/settings/sync", () => ({ syncSelectionOnLogin: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  }),
}));

const { signIn, signUp } = await import("@/lib/auth/actions");

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const empty = { error: null, email: "" };

describe("signIn / signUp", () => {
  afterEach(() => createSupabaseServer.mockReset());

  it("senha errada devolve a mensagem e mantém o e-mail digitado", async () => {
    createSupabaseServer.mockResolvedValue({
      auth: { signInWithPassword: vi.fn(async () => ({ error: { code: "invalid_credentials" } })) },
    });
    const state = await signIn(empty, form({ email: " ana@x.com ", senha: "123456", next: "/" }));
    expect(state).toEqual({ error: "E-mail ou senha incorretos", email: "ana@x.com" });
  });

  it("senha curta nem chama o Supabase e mantém o e-mail", async () => {
    const state = await signUp(empty, form({ email: "ana@x.com", senha: "123", next: "/" }));
    expect(state).toEqual({ error: "A senha precisa ter pelo menos 6 caracteres", email: "ana@x.com" });
    expect(createSupabaseServer).not.toHaveBeenCalled();
  });

  it("sem Supabase configurado, avisa que as contas estão indisponíveis", async () => {
    createSupabaseServer.mockResolvedValue(null);
    const state = await signIn(empty, form({ email: "ana@x.com", senha: "123456" }));
    expect(state.error).toBe("Contas indisponíveis no momento.");
  });

  it("login certo volta para o next seguro", async () => {
    createSupabaseServer.mockResolvedValue({
      auth: { signInWithPassword: vi.fn(async () => ({ data: { user: { id: "u1" } }, error: null })) },
    });
    await expect(signIn(empty, form({ email: "ana@x.com", senha: "123456", next: "//evil.com" }))).rejects.toThrow(
      "redirect:/",
    );
  });
});
