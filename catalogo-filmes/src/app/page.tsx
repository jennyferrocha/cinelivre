import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Hero, HeroSkeleton } from "@/components/Hero";
import { MovieRow, MovieRowSkeleton } from "@/components/MovieRow";
import { discoverMovies, HOME_ROWS, pickHero } from "@/lib/movies/discover";
import { genreNames, getGenres } from "@/lib/movies/genres";
import { getServiceGroups } from "@/lib/providers/service";
import { getSelection } from "@/lib/selection-server";

async function HomeContent() {
  const selection = await getSelection();
  if (!selection) redirect("/streamings");

  const today = new Date();
  const [groups, genres] = await Promise.all([getServiceGroups(), getGenres()]);
  const rows = await Promise.all(
    HOME_ROWS.map(async (row) => ({
      ...row,
      movies: await discoverMovies(selection, groups, row.filters(today)),
    })),
  );

  const hero = pickHero(rows[0].movies) ?? pickHero(rows.flatMap((r) => r.movies));
  if (!hero) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
        <p className="text-lg">Não achamos filmes nos seus streamings agora.</p>
        <Link href="/streamings" className="rounded-md bg-surface-2 px-4 py-2 text-sm">
          Mudar meus streamings ⚙
        </Link>
      </div>
    );
  }

  return (
    <>
      <Hero movie={hero} genre={genreNames(hero.genreIds, genres)[0] ?? null} />
      <div className="px-4 pb-6 sm:px-8">
        <Link
          href="/sugestoes"
          className="inline-block rounded-md bg-surface-2 px-5 py-3 font-semibold hover:bg-line"
        >
          🎲 O que eu assisto hoje?
        </Link>
      </div>
      <div className="flex flex-col gap-6">
        {rows.map((row) => (
          <MovieRow
            key={row.id}
            title={row.title}
            movies={row.id === HOME_ROWS[0].id ? row.movies.filter((m) => m.id !== hero.id) : row.movies}
          />
        ))}
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="mt-6 flex flex-col gap-6">
        <MovieRowSkeleton />
        <MovieRowSkeleton />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="-mt-14 flex flex-col">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
