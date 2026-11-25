import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@/components/Icons";
import { MarkToggle, WatchedBadge } from "@/components/MarkToggle";
import { StarsLine } from "@/components/StarRating";
import { snapshotFromCard } from "@/lib/marks/rules";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";
import { formatRating, unavailableLabel } from "@/lib/movies/filters";
import { cardHref } from "@/lib/titles";

/**
 * Pôster com a etiqueta do streaming e, embaixo, título e ano. Leva ao detalhe do filme (ou da série).
 * Série leva a etiqueta "Série" no canto e ainda não tem botões de marcar.
 * Os botões de marcar ficam fora do link (botão dentro de link não é permitido), por cima do canto.
 */
export function MovieCard({
  movie,
  className = "",
  chosen = true,
}: {
  movie: MovieCardData;
  className?: string;
  /** A pessoa escolheu streamings? Muda o texto de "fora dos streamings". */
  chosen?: boolean;
}) {
  const first = movie.services[0];
  const label = first ? (first.free ? `${first.name}, grátis` : first.name) : null;
  const rating = formatRating(movie.rating);
  const isSeries = movie.kind === "tv";

  return (
    <div className={`group relative ${className}`}>
      <Link href={cardHref(movie)} className="block rounded-lg outline-none" title={movie.title}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-10px_color-mix(in_srgb,var(--color-accent)_35%,transparent)] group-hover:ring-accent/70 group-has-[a:focus-visible]:ring-accent motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          {movie.posterUrl ? (
            <Image src={movie.posterUrl} alt="" fill sizes="(max-width: 640px) 38vw, 200px" className="object-cover" />
          ) : (
            <span
              aria-hidden
              className="flex h-full items-center justify-center p-3 text-center font-display text-xl leading-tight font-bold"
            >
              {movie.title}
            </span>
          )}
          {rating && (
            <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-accent backdrop-blur-sm">
              <StarIcon className="size-3 text-accent" />
              <span className="sr-only">Nota </span>
              {rating}
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
          {label ? (
            <span className="absolute bottom-2 left-2 max-w-[88%] truncate text-[11px] font-semibold text-foreground/95">
              {label}
            </span>
          ) : (
            <span className="absolute bottom-2 left-2 max-w-[88%] text-[11px] text-muted">{unavailableLabel(chosen)}</span>
          )}
          {!isSeries && <WatchedBadge movieId={movie.id} />}
        </div>
        <span className={`mt-2 flex flex-col ${movie.stars ? "h-[3.25rem]" : "h-9"}`}>
          <span className="truncate text-[13px] leading-tight font-semibold text-foreground/95 transition-colors group-hover:text-accent">
            {movie.title}
          </span>
          {movie.year ? <span className="mt-0.5 text-xs leading-tight text-muted">{movie.year}</span> : null}
          {movie.stars ? <StarsLine stars={movie.stars} /> : null}
        </span>
      </Link>
      {isSeries ? (
        <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          Série
        </span>
      ) : (
        <div className="absolute top-1.5 right-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          <MarkToggle movie={snapshotFromCard(movie)} variant="card" />
        </div>
      )}
    </div>
  );
}
