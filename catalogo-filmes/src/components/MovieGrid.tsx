import { MovieCard } from "@/components/MovieCard";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";

/** Grade de pôsteres (sugestões e busca). */
export function MovieGrid({ movies }: { movies: MovieCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {movies.map((movie) => (
        <li key={movie.id}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}
