import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Confere as regras de segurança (RLS) no projeto real: uma conta nunca lê nem altera
// os dados de outra. Cria duas contas descartáveis (teste+...@example.com) só com a chave
// pública; elas podem ser apagadas depois em Authentication → Users.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const suite = url && key ? describe : describe.skip;
if (!url || !key) console.warn("Sem NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY no .env.local: teste de segurança pulado.");

const newClient = () => createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });

async function newUser(): Promise<{ client: SupabaseClient; id: string }> {
  const client = newClient();
  const email = `teste+rls${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;
  const { data, error } = await client.auth.signUp({ email, password: "senha-teste-123" });
  if (error || !data.user || !data.session) throw new Error(`não consegui criar conta de teste: ${error?.message ?? "sem sessão"}`);
  return { client, id: data.user.id };
}

const mark = (userId: string) => ({
  user_id: userId,
  movie_id: 603,
  status: "quero",
  title: "Matrix",
  year: "1999",
  poster_path: null,
  rating: 8.2,
});

suite("regras de segurança (RLS)", () => {
  let a: { client: SupabaseClient; id: string };
  let b: { client: SupabaseClient; id: string };

  beforeAll(async () => {
    a = await newUser();
    b = await newUser();
    const m = await a.client.from("movie_marks").insert(mark(a.id));
    expect(m.error).toBeNull();
    const s = await a.client.from("user_settings").insert({ user_id: a.id, services: ["netflix"], include_free: true });
    expect(s.error).toBeNull();
  });

  afterAll(async () => {
    await a?.client.from("movie_marks").delete().eq("user_id", a.id);
    await a?.client.from("user_settings").delete().eq("user_id", a.id);
  });

  it("a dona enxerga os próprios dados (controle: as consultas funcionam)", async () => {
    const { data } = await a.client.from("movie_marks").select("movie_id").eq("user_id", a.id);
    expect(data).toEqual([{ movie_id: 603 }]);
  });

  it("outra conta não lê as marcações nem os streamings", async () => {
    const marks = await b.client.from("movie_marks").select("*").eq("user_id", a.id);
    expect(marks.data).toEqual([]);
    const settings = await b.client.from("user_settings").select("*").eq("user_id", a.id);
    expect(settings.data).toEqual([]);
  });

  it("outra conta não altera nem apaga", async () => {
    const upd = await b.client.from("movie_marks").update({ status: "assisti" }).eq("user_id", a.id).select();
    expect(upd.data ?? []).toEqual([]);
    const del = await b.client.from("movie_marks").delete().eq("user_id", a.id).select();
    expect(del.data ?? []).toEqual([]);
    const updS = await b.client.from("user_settings").update({ services: [] }).eq("user_id", a.id).select();
    expect(updS.data ?? []).toEqual([]);

    const { data } = await a.client.from("movie_marks").select("status").eq("user_id", a.id);
    expect(data).toEqual([{ status: "quero" }]);
  });

  it("outra conta não cria dados em nome da dona", async () => {
    const ins = await b.client.from("movie_marks").insert({ ...mark(a.id), movie_id: 604 });
    expect(ins.error).not.toBeNull();
    const insS = await b.client.from("user_settings").upsert({ user_id: a.id, services: [], include_free: false });
    expect(insS.error).not.toBeNull();
  });

  it("sem login, não se lê nada", async () => {
    const { data } = await newClient().from("movie_marks").select("*");
    expect(data ?? []).toEqual([]);
  });
});
