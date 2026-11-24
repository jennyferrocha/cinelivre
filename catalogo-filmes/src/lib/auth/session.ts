import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string };

/** `unavailable`: o Supabase não respondeu (rede, erro 5xx, demora) — diferente de "ninguém logado". */
export type SessionState = { user: CurrentUser | null; unavailable: boolean };

/** Erros que significam "não está logada" (sem sessão, login inválido ou vencido). */
const LOGGED_OUT_ERRORS = new Set(["AuthSessionMissingError", "AuthInvalidJwtError"]);

/**
 * Rede caiu, demorou demais, o Supabase respondeu 5xx ou algo inesperado (ex.: página de Wi-Fi
 * público no lugar da resposta): é "fora do ar", não "deslogada".
 */
function isOutage(error: { name?: string; status?: number }): boolean {
  if (error.name && LOGGED_OUT_ERRORS.has(error.name)) return false;
  return error.name === "AuthRetryableFetchError" || !error.status || error.status >= 500;
}

/**
 * Quem está logado agora, conferido no Supabase (não só pelo cookie).
 * Lê cookies: quem chama precisa estar dentro de um <Suspense>.
 * `cache`: várias partes da mesma página perguntam, mas o Supabase é consultado uma vez só.
 */
export const getSessionState = cache(async function getSessionState(): Promise<SessionState> {
  // A sessão muda a cada pedido (e o Supabase confere a validade com a hora atual).
  await connection();
  try {
    const supabase = await createSupabaseServer();
    if (!supabase) return { user: null, unavailable: false };
    // getClaims confere a assinatura do login localmente (sem ir à rede) quando o projeto usa as
    // chaves de assinatura novas; nas antigas, consulta o Supabase como o getUser.
    // Troca aceita: um "sair de todos os aparelhos" só vale aqui quando o login vence (~1h);
    // o banco já se comportava assim, e o RLS continua garantindo que cada um só mexe no que é seu.
    const { data, error } = await supabase.auth.getClaims();
    if (error) return { user: null, unavailable: isOutage(error) };
    const claims = data?.claims;
    if (!claims?.sub) return { user: null, unavailable: false };
    return { user: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" }, unavailable: false };
  } catch {
    return { user: null, unavailable: true };
  }
});

/** Atalho: só a pessoa logada (qualquer problema = ninguém logado). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return (await getSessionState()).user;
}
