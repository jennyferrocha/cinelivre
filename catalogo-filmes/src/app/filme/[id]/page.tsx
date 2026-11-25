import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StarIcon } from "@/components/Icons";
import { WhereToWatchList } from "@/components/WhereToWatchList";
import { MarksProvider } from "@/components/MarksProvider";
import { MarkToggle } from "@/components/MarkToggle";
import { formatRating } from "@/lib/movies/filters";
import { loadMarks } from "@/lib/marks/load";
import { snapshotFromCard } from "@/lib/marks/rules";
import { getMovieDetails } from "@/lib/movies/details";
import { getServiceGroups } from "@/lib/providers/service";
import { getSelection } from "@/lib/selection-server";
import { certificationLabel, parseId } from "@/lib/titles";

type Props = { params: Promise<{ id: string }> };

async function load(raw: string) {
  const id = parseId(raw);
  if (!id) return null;
  const [selection, groups] = await Promise.all([getSelection(), getServiceGroups()]);
  return getMovieDetails(id, selection, groups);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await load((await params).id);
  return {
    title: movie ? `${movie.title} · CineLivre` : "Filme não encontrado · CineLivre",
  };
}

/** Enquanto o filme carrega: o fundo e o pôster em cinza, já no lugar certo. */
function MovieSkeleton() {
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

export default function MoviePage({ params }: Props) {
  return (
    <Suspense fallback={<MovieSkeleton />}>
      <MovieContent params={params} />
    </Suspense>
  );
}

async function MovieContent({ params }: Props) {
  const [movie, marksState] = await Promise.all([load((await params).id), loadMarks()]);
  if (!movie) notFound();

  const rating = formatRating(movie.rating);
  const facts = [
    movie.genres.join(", "),
    movie.runtime,
    movie.certification && certificationLabel(movie.certification),
  ].filter(Boolean);

  return (
    <MarksProvider enabled={marksState.enabled} loggedIn={marksState.loggedIn} initial={marksState.byId}>
      <main className="-mt-16">
        <div className="relative h-[52vh] min-h-72 w-full sm:h-[62vh]">
          {movie.backdropUrl && (
            <Image src={movie.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover object-top" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />
        </div>

        <div className="relative z-10 mx-auto -mt-40 flex max-w-5xl flex-col gap-6 px-4 pb-16 sm:-mt-56 sm:flex-row sm:gap-10 sm:px-10">
          <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-lg bg-surface-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)] ring-1 ring-foreground/10 sm:w-60">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={`Pôster de ${movie.title}`}
                fill
                sizes="(max-width: 640px) 144px, 240px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center p-3 text-center font-display text-xl font-bold">
                {movie.title}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4 sm:pt-28">
            <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              {movie.title}
              {movie.year && <span className="font-medium text-foreground/60"> ({movie.year})</span>}
            </h1>

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

            {movie.overview ? (
              <p className="max-w-[62ch] text-base leading-relaxed text-foreground/90">{movie.overview}</p>
            ) : (
              <p className="text-muted">Este filme ainda não tem sinopse.</p>
            )}

            {movie.trailerKey && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit rounded-md bg-foreground px-5 py-2.5 font-semibold text-background hover:bg-foreground/85"
              >
                ▶ Ver trailer
              </a>
            )}
            <MarkToggle movie={snapshotFromCard(movie)} variant="detail" />

            <WhereToWatchList services={movie.allServicesBR} />

            {movie.cast.length > 0 && (
              <p className="text-sm text-foreground/85">
                <span className="font-semibold text-foreground">Elenco: </span>
                {movie.cast.join(", ")}
              </p>
            )}
          </div>
        </div>
      </main>
    </MarksProvider>
  );
}
