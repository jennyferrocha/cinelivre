import "server-only";
import { imageUrl, tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbImage, TmdbImagesResponse } from "@/lib/tmdb/types";

export type MovieLogo = { url: string; aspectRatio: number };

const LANGUAGES: (string | null)[] = ["pt", "en", null];

/** Escolhe a arte do título: português, depois inglês, depois sem idioma. Só PNG. */
export function pickLogo(logos: TmdbImage[]): TmdbImage | null {
  const png = logos.filter((l) => l.file_path.endsWith(".png"));
  for (const lang of LANGUAGES) {
    const found = png.find((l) => l.iso_639_1 === lang);
    if (found) return found;
  }
  return null;
}

/**
 * Arte oficial do título do filme (ou da série, com `kind = "tv"`), para o destaque.
 * Sem arte (ou erro), volta null e o título vai em texto.
 */
export async function getMovieLogo(movieId: number, kind?: "tv"): Promise<MovieLogo | null> {
  try {
    const data = await tmdbFetch<TmdbImagesResponse>(
      `/${kind === "tv" ? "tv" : "movie"}/${movieId}/images`,
      { include_image_language: "pt,en,null" },
      86400,
    );
    const logo = pickLogo(data.logos ?? []);
    const url = logo && imageUrl(logo.file_path, "w500");
    return logo && url ? { url, aspectRatio: logo.aspect_ratio } : null;
  } catch {
    return null;
  }
}
