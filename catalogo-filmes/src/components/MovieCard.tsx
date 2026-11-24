import Image from "next/image";
import Link from "next/link";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";

/** Pôster com a etiqueta do streaming e, embaixo, título e ano. Leva ao detalhe do filme. */
export function MovieCard({ movie, className = "" }: { movie: MovieCardData; className?: string }) {
  const first = movie.services[0];
  const label = first ? (first.free ? `${first.name}, grátis` : first.name) : null;

  return (
    <Link href={`/filme/${movie.id}`} className={`group block rounded-lg outline-none ${className}`} title={movie.title}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-10px_color-mix(in_srgb,var(--color-accent)_35%,transparent)] group-hover:ring-accent/70 group-focus-visible:ring-accent motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 38vw, 200px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full items-center justify-center p-3 text-center font-display text-xl leading-tight font-bold"
          >
            {movie.title}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        {label ? (
          <span className="absolute bottom-2 left-2 max-w-[88%] truncate text-[11px] font-semibold text-foreground/95">
            {label}
          </span>
        ) : (
          <span className="absolute bottom-2 left-2 max-w-[88%] text-[11px] text-muted">Não está nos seus streamings</span>
        )}
        {/* etapa 2: botão de favoritar / já assisti entra aqui */}
      </div>
      <span className="mt-2 flex h-9 flex-col">
        <span className="truncate text-[13px] leading-tight font-semibold text-foreground/95 transition-colors group-hover:text-accent">
          {movie.title}
        </span>
        {movie.year ? <span className="mt-0.5 text-xs leading-tight text-muted">{movie.year}</span> : null}
      </span>
    </Link>
  );
}
