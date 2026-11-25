import Link from "next/link";
import { MarksProvider } from "@/components/MarksProvider";
import { MovieGrid } from "@/components/MovieGrid";
import type { MarksState } from "@/lib/marks/load";
import { marksToCards, type Mark, type MarkStatus } from "@/lib/marks/rules";
import { attachServices, type MovieCard } from "@/lib/movies/discover";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import type { TmdbMovieListItem } from "@/lib/tmdb/types";

const TITLES: Record<MarkStatus, string> = { quero: "Quero assistir", assisti: "Já assisti" };

/** Converte as marcações no formato da lista do TMDB, para conferir as etiquetas de streaming. */
function asListItems(marks: Mark[]): TmdbMovieListItem[] {
  return marks.map((m) => ({
    id: m.movieId,
    title: m.title,
    poster_path: m.posterPath,
    backdrop_path: null,
    vote_average: m.rating,
    release_date: m.year,
    genre_ids: [],
    overview: "",
  }));
}

async function withServices(marks: Mark[], status: MarkStatus, selection: Selection | null, groups: ServiceGroup[]) {
  const ordered = marksToCards(marks, status); // mais recentes primeiro
  const byId = new Map(marks.map((m) => [m.movieId, m]));
  try {
    // Mantém todos (keepUnavailable): quem saiu dos streamings aparece com o texto de "fora dos streamings".
    const cards = await attachServices(
      asListItems(ordered.map((c) => byId.get(c.id)!)),
      selection,
      groups,
      { keepUnavailable: true },
    );
    return cards.map((c) => ({ ...c, stars: byId.get(c.id)?.stars ?? null }));
  } catch {
    return ordered; // TMDB fora do ar: a lista aparece, só sem as etiquetas
  }
}

/** Conteúdo das abas "Quero assistir" e "Já assisti". */
export async function MarkedList({
  status,
  marksState,
  selection,
  chosen,
  groups,
}: {
  status: MarkStatus;
  marksState: MarksState;
  selection: Selection | null;
  /** A pessoa escolheu streamings? (muda o texto dos filmes fora deles) */
  chosen: boolean;
  groups: ServiceGroup[];
}) {
  const title = <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{TITLES[status]}</h1>;

  if (!marksState.loggedIn) {
    const next = `/?aba=${status}`;
    return (
      <section className="flex flex-col gap-4 px-4 sm:px-10">
        {title}
        <div className="flex flex-col items-start gap-4 rounded-lg border border-line bg-surface/70 p-6">
          <p className="text-lg">Entre para guardar os filmes que você quer ver</p>
          {marksState.enabled ? (
            <Link
              href={`/entrar?next=${encodeURIComponent(next)}`}
              className="rounded-md bg-accent px-5 py-2.5 font-semibold text-accent-ink hover:brightness-110"
            >
              Entrar
            </Link>
          ) : (
            <p className="text-sm text-muted">As contas estão indisponíveis no momento.</p>
          )}
        </div>
      </section>
    );
  }

  const movies: MovieCard[] = await withServices(marksState.marks, status, selection, groups);
  return (
    <MarksProvider enabled loggedIn initial={marksState.byId}>
      <section className="flex flex-col gap-5 px-4 sm:px-10">
        {title}
        {movies.length > 0 ? (
          <MovieGrid movies={movies} chosen={chosen} />
        ) : (
          <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface/70 p-6">
            <p className="text-lg">Você ainda não marcou nenhum filme.</p>
            <p className="text-sm text-muted">Toque no marcador ou no ✓ de qualquer pôster.</p>
          </div>
        )}
      </section>
    </MarksProvider>
  );
}
