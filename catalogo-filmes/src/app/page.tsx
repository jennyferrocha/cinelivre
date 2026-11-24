import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AllStreamingsBanner } from "@/components/AllStreamingsBanner";
import { Hero, HeroSkeleton } from "@/components/Hero";
import { HomeTabs, TabsNav } from "@/components/HomeTabs";
import { MarkedList } from "@/components/MarkedList";
import { MarksProvider } from "@/components/MarksProvider";
import { MovieRow, MovieRowSkeleton, RankedRow } from "@/components/MovieRow";
import { RatingFilter } from "@/components/RatingFilter";
import { discoverMovies, HOME_ROWS, pickHero, withMinRating } from "@/lib/movies/discover";
import { loadMarks } from "@/lib/marks/load";
import { watchedIds } from "@/lib/marks/rules";
import { parseTab } from "@/lib/marks/tabs";
import { withEnglishOverview } from "@/lib/movies/details";
import { parseRating } from "@/lib/movies/filters";
import { genreNames, getGenres } from "@/lib/movies/genres";
import { getMovieLogo } from "@/lib/movies/logo";
import { getServiceGroups } from "@/lib/providers/service";
import { getEffectiveSelection } from "@/lib/selection-server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function HomeContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const tab = parseTab(sp.aba);
  const nota = parseRating(sp.nota);
  // Sem escolha da pessoa, vale "todos os streamings" (chosen = false mostra o convite).
  const { selection, chosen } = await getEffectiveSelection();

  // Abas "Quero assistir" / "Já assisti": funcionam mesmo sem streamings escolhidos.
  if (tab !== "para-voce") {
    const [marksState, groups] = await Promise.all([loadMarks(), getServiceGroups()]);
    return (
      <div className="pt-32 pb-8">
        <MarkedList status={tab} marksState={marksState} selection={selection} chosen={chosen} groups={groups} />
      </div>
    );
  }

  const marksState = await loadMarks();
  const watched = watchedIds(marksState.marks); // o que a pessoa já viu sai das sugestões

  await connection(); // a data de hoje é calculada a cada pedido, não na pré-renderização
  const today = new Date();
  const [groups, genres] = await Promise.all([getServiceGroups(), getGenres()]);
  const rows = await Promise.all(
    HOME_ROWS.map(async (row) => ({
      ...row,
      movies: await discoverMovies(selection, groups, withMinRating(row.filters(today), nota), { excludeIds: watched }),
    })),
  );

  const hero = pickHero(rows[0].movies) ?? pickHero(rows.flatMap((r) => r.movies));
  if (!hero && nota) {
    return (
      <div className="flex flex-col items-center gap-5 px-4 pt-40 pb-24 text-center">
        <p className="text-lg">Nenhum filme com nota {nota}+ nos seus streamings. Tente uma nota menor.</p>
        <RatingFilter active={nota} />
      </div>
    );
  }
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

  const [heroMovie, logo] = await Promise.all([withEnglishOverview(hero), getMovieLogo(hero.id)]);
  const [trending, ...others] = rows;
  const rank = trending.movies.indexOf(hero) + 1 || null;

  return (
    <MarksProvider enabled={marksState.enabled} loggedIn={marksState.loggedIn} initial={marksState.byId}>
      <div className="relative isolate">
        <AmbientLight src={hero.backdropUrl} />
        <Hero movie={heroMovie} genre={genreNames(hero.genreIds, genres)[0] ?? null} logo={logo} rank={rank} />
        <div className="relative z-10 -mt-28 flex flex-col gap-8 sm:-mt-36">
          {!chosen && <AllStreamingsBanner />}
          <RatingFilter active={nota} />
          <RankedRow
            title={`Top 10 em alta nos seus streamings${nota ? ` · nota ${nota}+` : ""}`}
            movies={trending.movies}
          />
          {others.map((row) => (
            <MovieRow key={row.id} title={row.title} movies={row.movies} />
          ))}
        </div>
      </div>
    </MarksProvider>
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

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="relative -mt-16 flex flex-col">
      {/* Abas logo abaixo do topo, por cima da foto do destaque */}
      <div className="absolute inset-x-0 top-16 z-20">
        <Suspense fallback={<TabsNav active="para-voce" />}>
          <HomeTabs />
        </Suspense>
      </div>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
