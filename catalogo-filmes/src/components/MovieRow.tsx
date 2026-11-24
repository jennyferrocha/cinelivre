import { MovieCard } from "@/components/MovieCard";
import { RowScroller } from "@/components/RowScroller";
import type { MovieCard as MovieCardData } from "@/lib/movies/discover";

const titleClass = "px-4 font-display text-lg font-semibold sm:px-10 sm:text-xl";

/** Fileira horizontal que desliza para o lado. */
export function MovieRow({ title, movies }: { title: string; movies: MovieCardData[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className={titleClass}>{title}</h2>
      <RowScroller label={title}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} className="w-32 shrink-0 snap-start sm:w-44" />
        ))}
      </RowScroller>
    </section>
  );
}

/** As 10 primeiras de uma lista ordenada, com o numeral grande da posição ao lado do pôster. */
export function RankedRow({ title, movies }: { title: string; movies: MovieCardData[] }) {
  const top = movies.slice(0, 10);
  if (top.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h2 className={titleClass}>{title}</h2>
      <RowScroller label={title}>
        <ol className="flex gap-4 sm:gap-5">
          {top.map((movie, i) => (
            <li key={movie.id} className="relative flex shrink-0 snap-start items-end">
              <span
                aria-hidden
                className="rank-numeral -mr-3 mb-11 translate-y-[0.06em] font-display text-[6rem] leading-[0.8] font-extrabold tracking-tighter select-none sm:-mr-4 sm:text-[8rem]"
              >
                {i + 1}
              </span>
              <span className="sr-only">{i + 1}º lugar: </span>
              <MovieCard movie={movie} className="w-28 sm:w-36" />
            </li>
          ))}
        </ol>
      </RowScroller>
    </section>
  );
}

export function MovieRowSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="mx-4 h-7 w-48 rounded bg-surface-2 sm:mx-10" />
      <div className="flex gap-3 overflow-hidden px-4 sm:px-10">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[2/3] w-32 shrink-0 animate-pulse rounded-lg bg-surface-2 sm:w-44" />
        ))}
      </div>
    </div>
  );
}
