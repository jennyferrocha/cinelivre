import Image from "next/image";
import Link from "next/link";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";

/** Pôster com a etiqueta do streaming. Leva ao detalhe do filme. */
export function MovieCard({ movie, className = "" }: { movie: MovieCardData; className?: string }) {
  const first = movie.services[0];
  const label = first ? (first.free ? "Grátis" : first.name) : null;

  return (
    <Link
      href={`/filme/${movie.id}`}
      className={`group relative block aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ${className}`}
      title={movie.title}
    >
      {movie.posterUrl ? (
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 33vw, 180px"
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <span className="flex h-full items-center justify-center p-2 text-center text-sm text-muted">
          {movie.title}
        </span>
      )}
      {label ? (
        <span className="absolute bottom-1.5 left-1.5 max-w-[90%] truncate rounded bg-black/75 px-1.5 py-0.5 text-[10px]">
          {label}
        </span>
      ) : (
        <span className="absolute bottom-1.5 left-1.5 max-w-[90%] rounded bg-surface-2/90 px-1.5 py-0.5 text-[10px] text-muted">
          Não está nos seus streamings
        </span>
      )}
      {/* etapa 2: botão de favoritar / já assisti entra aqui */}
    </Link>
  );
}
