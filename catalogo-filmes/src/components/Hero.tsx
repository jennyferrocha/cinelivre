import Image from "next/image";
import Link from "next/link";
import type { MovieCard } from "@/lib/movies/discover";

/** Filme em destaque no topo da tela inicial. */
export function Hero({ movie, genre }: { movie: MovieCard; genre: string | null }) {
  const meta = [`★ ${movie.rating.toFixed(1).replace(".", ",")}`, genre, movie.year].filter(Boolean).join(" · ");
  const where = movie.services[0];

  return (
    <section className="relative flex min-h-[60vh] items-end sm:min-h-[70vh]">
      {movie.backdropUrl && (
        <Image src={movie.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      <div className="relative flex max-w-xl flex-col gap-2 px-4 pb-8 sm:px-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Em destaque{where ? ` · ${where.free ? "Grátis" : where.name}` : ""}
        </span>
        <h1 className="text-3xl font-extrabold sm:text-5xl">{movie.title}</h1>
        <p className="text-sm text-muted">{meta}</p>
        <Link
          href={`/filme/${movie.id}`}
          className="mt-2 self-start rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-accent-ink"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return <div className="min-h-[60vh] animate-pulse bg-surface sm:min-h-[70vh]" aria-hidden />;
}
