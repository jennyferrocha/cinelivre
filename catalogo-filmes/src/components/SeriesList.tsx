import Link from "next/link";
import { MovieGrid } from "@/components/MovieGrid";
import type { MovieCard } from "@/lib/movies/discover";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";
import { attachSeriesServices, toSeriesCard } from "@/lib/series/discover";
import { bySituation } from "@/lib/series/lists";
import { loadTrackedSeries } from "@/lib/series/lists-server";
import type { SeriesMarksState } from "@/lib/series/load";
import type { SeriesSituation } from "@/lib/series/progress";
import type { SeriesMark } from "@/lib/series/store";
import type { TmdbTvListItem } from "@/lib/tmdb/types";

const TITLES: Record<SeriesSituation, string> = {
  quero: "Quero assistir",
  acompanhando: "Acompanhando",
  assisti: "Já assisti",
  parei: "Parei de assistir",
};

function asListItem(m: SeriesMark): TmdbTvListItem {
  return {
    id: m.seriesId,
    name: m.title,
    poster_path: m.posterPath,
    backdrop_path: null,
    vote_average: m.rating,
    first_air_date: m.year,
    genre_ids: [],
    overview: "",
  };
}

async function withServices(marks: SeriesMark[], selection: Selection, groups: ServiceGroup[]): Promise<MovieCard[]> {
  const items = marks.map(asListItem);
  const stars = new Map(marks.map((m) => [m.seriesId, m.stars]));
  let cards: MovieCard[];
  try {
    cards = await attachSeriesServices(items, selection, groups, { keepUnavailable: true });
  } catch {
    cards = items.map((i) => toSeriesCard(i, [])); // TMDB fora do ar: a lista aparece, só sem as etiquetas
  }
  return cards.map((c) => ({ ...c, stars: stars.get(c.id) ?? null }));
}

/** Conteúdo das abas de séries ("Quero assistir", "Acompanhando", "Já assisti", "Parei de assistir"). */
export async function SeriesList({
  situation,
  state,
  selection,
  chosen,
  groups,
}: {
  situation: SeriesSituation;
  state: SeriesMarksState;
  selection: Selection;
  chosen: boolean;
  groups: ServiceGroup[];
}) {
  const title = <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{TITLES[situation]}</h1>;

  if (!state.loggedIn) {
    const next = `/?tipo=series&aba=${situation}`;
    return (
      <section className="flex flex-col gap-4 px-4 sm:px-10">
        {title}
        <div className="flex flex-col items-start gap-4 rounded-lg border border-line bg-surface/70 p-6">
          <p className="text-lg">Entre para acompanhar suas séries</p>
          {state.enabled ? (
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

  const tracked = bySituation(await loadTrackedSeries(state), situation);
  const cards = await withServices(
    tracked.map((t) => t.mark),
    selection,
    groups,
  );
  return (
    <section className="flex flex-col gap-5 px-4 sm:px-10">
      {title}
      {cards.length > 0 ? (
        <MovieGrid movies={cards} chosen={chosen} />
      ) : (
        <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface/70 p-6">
          <p className="text-lg">Nenhuma série aqui ainda.</p>
          <p className="text-sm text-muted">Abra uma série e marque os episódios que você já viu.</p>
        </div>
      )}
    </section>
  );
}
