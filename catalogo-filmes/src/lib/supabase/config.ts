// Endereço e chave pública do projeto no Supabase. A chave pública ("publishable")
// é feita para o navegador; a secreta (service_role) nunca entra neste app.

export type SupabaseConfig = { url: string; key: string };

type Env = Record<string, string | undefined>;

// Lidas uma a uma, por nome completo, para o Next conseguir embuti-las no navegador.
const defaultEnv = (): Env => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

/** Sem as duas variáveis (ou com URL inválida), as contas ficam desligadas e o app funciona como antes. */
export function supabaseConfig(env: Env = defaultEnv()): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  } catch {
    return null;
  }
  return { url, key };
}
