import "server-only";
import { connection } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string };

/**
 * Quem está logado agora, conferido no Supabase (não só pelo cookie).
 * Qualquer problema (sem configuração, sem sessão, Supabase fora do ar) = ninguém logado.
 * Lê cookies: quem chama precisa estar dentro de um <Suspense>.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // A sessão muda a cada pedido (e o Supabase confere a validade com a hora atual).
  await connection();
  try {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? "" };
  } catch {
    return null;
  }
}
