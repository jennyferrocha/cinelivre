import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Hero, HeroSkeleton } from "@/components/Hero";
import { MovieRow, MovieRowSkeleton, RankedRow } from "@/components/MovieRow";
import { discoverMovies, HOME_ROWS, pickHero } from "@/lib/movies/discover";
import { genreNames, getGenres } from "@/lib/movies/genres";
import { getMovieLogo } from "@/lib/movies/logo";
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
      <div className="flex flex-col items-center gap-3 px-4 pt-40 pb-24 text-center">
        <p className="text-lg">Não achamos filmes nos seus streamings agora.</p>
        <Link href="/streamings" className="rounded-md bg-surface-2 px-4 py-2 text-sm hover:bg-line">
          Mudar meus streamings
        </Link>
      </div>
    );
  }

  const logo = await getMovieLogo(hero.id);
  const [trending, ...others] = rows;
  const rank = trending.movies.indexOf(hero) + 1 || null;

  return (
    <div className="relative isolate">
      <AmbientLight src={hero.backdropUrl} />
      <Hero movie={hero} genre={genreNames(hero.genreIds, genres)[0] ?? null} logo={logo} rank={rank} />
      <div className="relative z-10 -mt-28 flex flex-col gap-8 sm:-mt-36">
        <RankedRow title="Top 10 em alta nos seus streamings" movies={trending.movies} />
        {others.map((row) => (
          <MovieRow key={row.id} title={row.title} movies={row.movies} />
        ))}
      </div>
    </div>
  );
}

/**
 * As cores da foto do destaque vazam pela página, como a luz do projetor
 * batendo na sala. Uma versão minúscula da imagem, bem desfocada.
 */
function AmbientLight({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[220vh] overflow-hidden [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="64px"
        className="scale-125 object-cover opacity-45 blur-[90px] saturate-[1.6]"
      />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="relative z-10 -mt-28 flex flex-col gap-8 sm:-mt-36">
        <MovieRowSkeleton />
        <MovieRowSkeleton />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="-mt-16 flex flex-col">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
