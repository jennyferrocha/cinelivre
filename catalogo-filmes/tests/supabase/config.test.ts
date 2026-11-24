import { describe, expect, it } from "vitest";
import { supabaseConfig } from "@/lib/supabase/config";

describe("supabaseConfig", () => {
  it("sem as duas variáveis, o Supabase fica desligado", () => {
    expect(supabaseConfig({})).toBeNull();
    expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
    expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" })).toBeNull();
  });

  it("URL inválida também desliga", () => {
    expect(
      supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "não é url", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" }),
    ).toBeNull();
  });

  it("com URL e chave, devolve as duas", () => {
    expect(
      supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" }),
    ).toEqual({ url: "https://x.supabase.co", key: "k" });
  });
});
