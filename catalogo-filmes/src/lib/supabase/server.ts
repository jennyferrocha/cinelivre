import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/config";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

/**
 * Cliente do Supabase para o servidor, usando os cookies de sessão da pessoa.
 * Devolve null quando o Supabase não está configurado.
 */
export async function createSupabaseServer(): Promise<SupabaseClient | null> {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    global: { fetch: fetchWithTimeout() },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) store.set(name, value, options);
        } catch {
          // Componentes de servidor não podem gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
