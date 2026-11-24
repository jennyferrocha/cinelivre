import { MovieCard } from "@/components/MovieCard";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";

/** Fileira horizontal que desliza para o lado. */
export function MovieRow({ title, movies }: { title: string; movies: MovieCardData[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-4 text-base font-bold sm:px-8">{title}</h2>
      <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:px-8">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} className="w-28 shrink-0 snap-start sm:w-40" />
        ))}
      </div>
    </section>
  );
}

export function MovieRowSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <div className="mx-4 h-5 w-40 rounded bg-surface-2 sm:mx-8" />
      <div className="flex gap-2 overflow-hidden px-4 sm:px-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[2/3] w-28 shrink-0 animate-pulse rounded-md bg-surface-2 sm:w-40" />
        ))}
      </div>
    </div>
  );
}
