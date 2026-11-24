import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FilterForm } from "@/components/FilterForm";
import { MarksProvider } from "@/components/MarksProvider";
import { MovieGrid } from "@/components/MovieGrid";
import { MovieRowSkeleton } from "@/components/MovieRow";
import { SurpriseButton } from "@/components/SurpriseButton";
import { loadMarks } from "@/lib/marks/load";
import { watchedIds } from "@/lib/marks/rules";
import { discoverMovies } from "@/lib/movies/discover";
import { parseFilterParams } from "@/lib/movies/filters";
import { getGenres } from "@/lib/movies/genres";
import { getServiceGroups } from "@/lib/providers/service";
import { getSelection } from "@/lib/selection-server";

export const metadata: Metadata = {
  title: "O que eu assisto hoje? · CineLivre",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Suggestions({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilterParams(await searchParams);
  const selection = await getSelection();
  if (!selection) redirect("/streamings");

  const [groups, genres] = await Promise.all([getServiceGroups(), getGenres()]);
  const marksState = await loadMarks();
  // o que a pessoa já viu sai das sugestões e do "Me surpreenda"
  const movies = await discoverMovies(selection, groups, filters, {
    pages: 3,
    excludeIds: watchedIds(marksState.marks),
  });

  return (
    <MarksProvider enabled={marksState.enabled} loggedIn={marksState.loggedIn} initial={marksState.byId}>
      <FilterForm genres={genres} filters={filters} />
      <section aria-live="polite" className="flex flex-col gap-5">
        {movies.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-foreground/85">
                Mostrando <strong className="text-foreground">{movies.length}</strong>{" "}
                {movies.length === 1 ? "filme" : "filmes"} nos seus streamings
              </p>
              <SurpriseButton ids={movies.map((m) => m.id)} />
            </div>
            <MovieGrid movies={movies} />
          </>
        ) : (
          <p className="py-10 text-center text-lg">
            Nenhum filme com esses filtros nos seus streamings. Tente tirar algum filtro.
          </p>
        )}
      </section>
    </MarksProvider>
  );
}

export default function SuggestionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 pb-16 sm:px-10">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">🎲 O que eu assisto hoje?</h1>
      <Suspense fallback={<MovieRowSkeleton />}>
        <Suggestions searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
