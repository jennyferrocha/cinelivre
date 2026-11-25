import { MovieCard } from "@/components/MovieCard";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";
import { cardKey } from "@/lib/titles";

/** Grade de pôsteres (sugestões e busca). */
export function MovieGrid({ movies, chosen = true }: { movies: MovieCardData[]; chosen?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {movies.map((movie) => (
        <li key={cardKey(movie)}>
          <MovieCard movie={movie} chosen={chosen} />
        </li>
      ))}
    </ul>
  );
}
