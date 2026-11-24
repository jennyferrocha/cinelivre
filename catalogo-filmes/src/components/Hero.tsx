import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { DiceIcon, InfoIcon, StarIcon } from "@/components/Icons";
import type { MovieCard } from "@/lib/movies/discover";
import { formatRating } from "@/lib/movies/filters";
import type { MovieLogo } from "@/lib/movies/logo";

type Props = {
  movie: MovieCard;
  genre: string | null;
  logo: MovieLogo | null;
  /** Posição no "Em alta" (1 = mais popular), quando o filme veio de lá. */
  rank: number | null;
};

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

/** Filme em destaque no topo da tela inicial: foto grande, arte do título e onde assistir. */
export function Hero({ movie, genre, logo, rank }: Props) {
  return (
    <section className="relative isolate flex min-h-[82svh] items-end overflow-hidden sm:min-h-[92svh]">
      {/* Foto: assenta devagar e se dissolve na sala no pé da tela */}
      <div className="film-grain absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent_98%)]">
        {movie.backdropUrl && (
          <Image
            src={movie.backdropUrl}
            alt=""
            fill
            preload
            sizes="100vw"
            className="hero-settle object-cover object-[center_20%]"
          />
        )}
        {/* Sombra à esquerda para o texto respirar; a luz do projetor vem da direita */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-background)_0%,color-mix(in_srgb,var(--color-background)_70%,transparent)_28%,transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_10%,transparent_40%,color-mix(in_srgb,var(--color-background)_55%,transparent))]" />
      </div>

      <div className="flex w-full max-w-2xl flex-col items-start gap-5 px-4 pt-24 pb-36 sm:px-10 sm:pb-44">
        {rank && (
          <p className="hero-rise flex items-center gap-3" style={rise(0)}>
            <span className="font-display text-5xl leading-none font-black text-accent">{rank}º</span>
            <span className="text-sm leading-tight text-foreground/85">
              em alta esta semana
              <br />
              nos seus streamings
            </span>
          </p>
        )}

        <h1 className="hero-rise" style={rise(1)}>
          {logo ? (
            <Image
              src={logo.url}
              alt={movie.title}
              width={500}
              height={Math.round(500 / logo.aspectRatio)}
              preload
              className="h-auto max-h-36 w-auto max-w-[min(30rem,82vw)] object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:max-h-44"
            />
          ) : (
            <span className="font-display text-4xl leading-[1.05] font-extrabold text-balance sm:text-6xl">
              {movie.title}
            </span>
          )}
        </h1>

        <div className="hero-rise flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={rise(2)}>
          {formatRating(movie.rating) && (
            <span className="flex items-center gap-1 font-semibold text-accent">
              <StarIcon />
              <span className="sr-only">Nota </span>
              {formatRating(movie.rating)}
            </span>
          )}
          {movie.year && <span className="text-foreground/85">{movie.year}</span>}
          {genre && <span className="text-foreground/85">{genre}</span>}
          {movie.services.slice(0, 3).map((s) => (
            <span
              key={s.key}
              className="rounded-full border border-foreground/25 bg-background/30 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm"
            >
              {s.free ? `${s.name}, grátis` : s.name}
            </span>
          ))}
        </div>

        {movie.overview && (
          <p
            className="hero-rise line-clamp-3 max-w-[46ch] text-base leading-relaxed text-foreground/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)] sm:text-lg"
            style={rise(3)}
          >
            {movie.overview}
          </p>
        )}

        <div className="hero-rise mt-1 flex flex-wrap gap-3" style={rise(4)}>
          <Link
            href={`/filme/${movie.id}`}
            className="flex items-center gap-2 rounded-md bg-foreground px-6 py-3 font-bold text-accent-ink transition-colors hover:bg-accent"
          >
            <InfoIcon />
            Ver detalhes
          </Link>
          <Link
            href="/sugestoes"
            className="flex items-center gap-2 rounded-md bg-foreground/15 px-6 py-3 font-semibold backdrop-blur-md transition-colors hover:bg-foreground/25"
          >
            <DiceIcon />
            O que eu assisto hoje?
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative flex min-h-[82svh] items-end bg-gradient-to-b from-surface to-background sm:min-h-[92svh]" aria-hidden>
      <div className="flex w-full max-w-2xl flex-col gap-4 px-4 pb-36 sm:px-10 sm:pb-44">
        <div className="h-24 w-80 max-w-full animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-56 animate-pulse rounded bg-surface-2" />
        <div className="h-16 w-full max-w-md animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  );
}
