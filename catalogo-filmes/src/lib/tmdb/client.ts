import "server-only";

// Tudo que fala com o TMDB passa por aqui. Este arquivo só roda no servidor,
// então a chave (TMDB_TOKEN) nunca chega ao navegador de quem usa o app.

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export class TmdbError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export type TmdbParams = Record<string, string | number | undefined>;

/**
 * Faz um pedido GET ao TMDB e devolve o JSON.
 * @param revalidate por quantos segundos o Next pode reaproveitar a resposta (cache).
 */
export async function tmdbFetch<T>(
  path: string,
  params: TmdbParams = {},
  revalidate = 3600,
): Promise<T> {
  const token = process.env.TMDB_TOKEN;
  if (!token) {
    throw new TmdbError("TMDB_TOKEN não configurado", 500);
  }

  const search = new URLSearchParams({ language: "pt-BR" });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}?${search}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      // Pedidos com Authorization só entram no cache se pedirmos explicitamente.
      cache: "force-cache",
      next: { revalidate },
    });
  } catch {
    throw new TmdbError("Não foi possível falar com o TMDB", 503);
  }

  if (!response.ok) {
    throw new TmdbError(`TMDB respondeu ${response.status} em ${path}`, response.status);
  }
  return (await response.json()) as T;
}

export type ImageSize = "w92" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original";

export function imageUrl(path: string | null, size: ImageSize): string | null {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : null;
}
