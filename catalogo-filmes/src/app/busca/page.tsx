import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchIcon } from "@/components/Icons";
import { MarksProvider } from "@/components/MarksProvider";
import { MovieGrid } from "@/components/MovieGrid";
import { MovieRowSkeleton } from "@/components/MovieRow";
import { loadMarks } from "@/lib/marks/load";
import { normalizeQuery, searchTitles } from "@/lib/movies/search";
import { getServiceGroups } from "@/lib/providers/service";
import { getEffectiveSelection } from "@/lib/selection-server";

export const metadata: Metadata = { title: "Buscar filme ou série · CineLivre" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function SearchForm({ searchParams }: { searchParams: SearchParams }) {
  const q = normalizeQuery((await searchParams).q) ?? "";
  return (
    <form method="get" action="/busca" role="search" className="flex max-w-2xl gap-2">
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        // Só foca o campo quando a página abre vazia; com resultados, o teclado do celular os cobriria.
        autoFocus={!q}
        placeholder="Nome do filme ou série"
        aria-label="Nome do filme ou série"
        className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-surface-2 px-4 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-md bg-accent px-4 font-semibold text-background hover:brightness-110"
      >
        <SearchIcon />
        <span className="max-sm:sr-only">Buscar</span>
      </button>
    </form>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const q = normalizeQuery((await searchParams).q);
  if (!q) return <p className="text-muted">Digite o nome de um filme ou série para buscar.</p>;

  const [{ selection, chosen }, groups] = await Promise.all([getEffectiveSelection(), getServiceGroups()]);
  const [movies, marksState] = await Promise.all([searchTitles(q, selection, groups), loadMarks()]);
  if (movies.length === 0) {
    return <p className="py-10 text-center text-lg">Nada encontrado para &ldquo;{q}&rdquo;.</p>;
  }
  return (
    <MarksProvider enabled={marksState.enabled} loggedIn={marksState.loggedIn} initial={marksState.byId}>
      <section aria-live="polite" className="flex flex-col gap-5">
        <p className="text-foreground/85">
          Resultados para <strong className="text-foreground">&ldquo;{q}&rdquo;</strong>
        </p>
        <MovieGrid movies={movies} chosen={chosen} />
      </section>
    </MarksProvider>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-6 pb-16 sm:px-10">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Buscar filme ou série</h1>
      <Suspense fallback={<div className="h-12 max-w-2xl rounded-md bg-surface-2" />}>
        <SearchForm searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<MovieRowSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
