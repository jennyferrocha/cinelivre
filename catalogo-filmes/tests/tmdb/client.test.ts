import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { imageUrl, tmdbFetch, TmdbError } from "@/lib/tmdb/client";

function okResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("tmdbFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("TMDB_TOKEN", "abc");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("envia Bearer, base url, language pt-BR e ignora params undefined", async () => {
    fetchMock.mockResolvedValue(okResponse({ ok: true }));

    const data = await tmdbFetch<{ ok: boolean }>("/discover/movie", { page: 2, x: undefined });

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.themoviedb.org/3/discover/movie?language=pt-BR&page=2");
    expect(init.headers.Authorization).toBe("Bearer abc");
    expect(init.cache).toBe("force-cache");
    expect(init.next.revalidate).toBe(3600);
  });

  it("permite sobrescrever language e revalidate", async () => {
    fetchMock.mockResolvedValue(okResponse({}));

    await tmdbFetch("/movie/1", { language: "en-US" }, 21600);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.themoviedb.org/3/movie/1?language=en-US");
    expect(init.next.revalidate).toBe(21600);
  });

  it("lança TmdbError com status quando a resposta não é ok", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    const error = await tmdbFetch<never>("/movie/popular").catch((e: TmdbError) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(401);
  });

  it("lança TmdbError(500) quando TMDB_TOKEN não existe, sem chamar fetch", async () => {
    vi.stubEnv("TMDB_TOKEN", "");

    const error = await tmdbFetch<never>("/movie/popular").catch((e: TmdbError) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lança TmdbError(503) quando fetch rejeita (rede)", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await tmdbFetch<never>("/movie/popular").catch((e: TmdbError) => e);

    expect(error).toBeInstanceOf(TmdbError);
    expect(error.status).toBe(503);
  });
});

describe("imageUrl", () => {
  it("monta a url da imagem no tamanho pedido", () => {
    expect(imageUrl("/a.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
  });

  it("devolve null quando não há caminho", () => {
    expect(imageUrl(null, "w342")).toBeNull();
  });
});
