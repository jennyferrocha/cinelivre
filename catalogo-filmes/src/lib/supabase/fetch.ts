/** Tempo máximo de espera pelo Supabase. Se passar disso, o app segue como "sem conta". */
export const SUPABASE_TIMEOUT_MS = 3000;

/** `fetch` que desiste depois de `ms` milissegundos (nada de página travada esperando o Supabase). */
export function fetchWithTimeout(ms: number = SUPABASE_TIMEOUT_MS, baseFetch: typeof fetch = fetch): typeof fetch {
  return (input, init) => {
    const timeout = AbortSignal.timeout(ms);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return baseFetch(input, { ...init, signal });
  };
}
