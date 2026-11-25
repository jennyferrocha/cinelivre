import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EpisodeList } from "@/components/EpisodeList";
import { StarIcon } from "@/components/Icons";
import { SeasonPicker } from "@/components/SeasonPicker";
import { WhereToWatchList } from "@/components/WhereToWatchList";
import { formatRating } from "@/lib/movies/filters";
import { getServiceGroups } from "@/lib/providers/service";
import { getSelection } from "@/lib/selection-server";
import { getSeason, getSeriesDetails, pickSeason } from "@/lib/series/details";
import { certificationLabel, parseId } from "@/lib/titles";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(raw: string) {
  const id = parseId(raw);
  if (!id) return null;
  const [selection, groups] = await Promise.all([getSelection(), getServiceGroups()]);
  return getSeriesDetails(id, selection, groups);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const series = await load((await params).id);
  return { title: series ? `${series.title} · CineLivre` : "Série não encontrada · CineLivre" };
}

/** Enquanto a série carrega: o fundo e o pôster em cinza, já no lugar certo. */
function SeriesSkeleton() {
  return (
    <main className="-mt-16" aria-busy="true">
      <div className="h-[52vh] min-h-72 w-full bg-surface sm:h-[62vh]" />
      <div className="relative z-10 mx-auto -mt-40 flex max-w-5xl flex-col gap-6 px-4 pb-16 sm:-mt-56 sm:flex-row sm:gap-10 sm:px-10">
        <div className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-lg bg-surface-2 sm:w-60" />
        <div className="flex flex-1 flex-col gap-4 sm:pt-28">
          <div className="h-10 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
          <div className="h-20 w-full animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    </main>
  );
}

function EpisodesSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-surface-2" />
      ))}
    </div>
  );
}

export default function SeriesPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<SeriesSkeleton />}>
      <SeriesContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SeriesContent({ params, searchParams }: Props) {
  const series = await load((await params).id);
  if (!series) notFound();

  const rating = formatRating(series.rating);
  const facts = [
    series.years,
    series.genres[0],
    series.seasonsLabel,
    series.certification && certificationLabel(series.certification),
  ].filter(Boolean);

  return (
    <main className="-mt-16">
      <div className="relative h-[52vh] min-h-72 w-full sm:h-[62vh]">
        {series.backdropUrl && (
          <Image src={series.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
      </div>

      <div className="relative z-10 mx-auto -mt-40 flex max-w-5xl flex-col gap-6 px-4 pb-16 sm:-mt-56 sm:flex-row sm:gap-10 sm:px-10">
        <div className="relative aspect-[2/3] w-36 shrink-0 self-start overflow-hidden rounded-lg bg-surface-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] ring-1 ring-foreground/10 sm:w-60">
          {series.posterUrl ? (
            <Image
              src={series.posterUrl}
              alt={`Pôster de ${series.title}`}
              fill
              sizes="(max-width: 640px) 144px, 240px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center p-3 text-center font-display text-xl font-bold">
              {series.title}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:pt-28">
          <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">{series.title}</h1>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/85">
            {rating && (
              <span className="flex items-center gap-1 font-semibold text-accent">
                <StarIcon />
                <span className="sr-only">Nota </span>
                {rating}
              </span>
            )}
            {facts.map((fact) => (
              <span
                key={fact}
                className="before:mr-2 before:text-foreground/40 before:content-['·'] first:before:hidden"
              >
                {fact}
              </span>
            ))}
          </p>

          {series.overview ? (
            <p className="max-w-[62ch] text-base leading-relaxed text-foreground/90">{series.overview}</p>
          ) : (
            <p className="text-muted">Esta série ainda não tem resumo.</p>
          )}

          {series.trailerKey && (
            <a
              href={`https://www.youtube.com/watch?v=${series.trailerKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-md bg-foreground px-5 py-2.5 font-semibold text-background hover:bg-foreground/85"
            >
              ▶ Ver trailer
            </a>
          )}

          <WhereToWatchList services={series.allServicesBR} />

          {series.cast.length > 0 && (
            <p className="text-sm text-foreground/85">
              <span className="font-semibold text-foreground">Elenco: </span>
              {series.cast.join(", ")}
            </p>
          )}

          <section aria-labelledby="episodios" className="flex flex-col gap-4 pt-4">
            <h2 id="episodios" className="font-display text-xl font-bold">
              Episódios
            </h2>
            <Suspense fallback={<EpisodesSkeleton />}>
              <Episodes series={series} searchParams={searchParams} />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  );
}

async function Episodes({
  series,
  searchParams,
}: {
  series: { id: number; seasons: Parameters<typeof pickSeason>[1] };
  searchParams: Props["searchParams"];
}) {
  const active = pickSeason((await searchParams).temporada, series.seasons);
  if (active === null) return <p className="text-muted">Ainda não há episódios.</p>;

  await connection(); // "já exibido" depende da data de hoje, calculada a cada pedido
  let episodes;
  try {
    episodes = await getSeason(series.id, active, new Date());
  } catch {
    episodes = null;
  }

  return (
    <>
      <SeasonPicker seriesId={series.id} seasons={series.seasons} active={active} />
      {episodes ? (
        <EpisodeList episodes={episodes} />
      ) : (
        <p className="text-muted">Não foi possível carregar os episódios.</p>
      )}
    </>
  );
}
