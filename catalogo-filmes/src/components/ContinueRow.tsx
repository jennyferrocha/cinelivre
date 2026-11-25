import Image from "next/image";
import Link from "next/link";
import type { TrackedSeries } from "@/lib/series/lists";

const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

/** "Continuar assistindo": o próximo episódio de cada série em andamento, com a barra de progresso. */
export function ContinueRow({ items }: { items: TrackedSeries[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="continuar" className="flex flex-col gap-3">
      <h2 id="continuar" className="px-4 font-display text-lg font-semibold sm:px-10 sm:text-xl">
        Continuar assistindo
      </h2>
      <ul className="flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:px-10">
        {items.map(({ mark, progress }) => {
          const next = progress?.next;
          const percent = progress?.total ? Math.round((progress.watched / progress.total) * 100) : 0;
          return (
            <li key={mark.seriesId} className="w-36 shrink-0 snap-start sm:w-44">
              <Link href={`/serie/${mark.seriesId}`} className="group flex flex-col gap-2 rounded-lg outline-none">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 ring-1 ring-foreground/10 transition-colors group-hover:ring-accent/70 group-focus-visible:ring-accent">
                  {mark.posterPath ? (
                    <Image
                      src={`${POSTER_BASE}${mark.posterPath}`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 144px, 176px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center p-3 text-center font-display font-bold">
                      {mark.title}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60" aria-hidden>
                    <span className="block h-full bg-accent" style={{ width: `${percent}%` }} />
                  </span>
                </div>
                <span className="flex flex-col">
                  <span className="truncate text-[13px] leading-tight font-semibold group-hover:text-accent">
                    {mark.title}
                  </span>
                  {next && (
                    <span className="mt-0.5 text-xs text-muted">
                      Próximo: T{next.season} E{next.episode}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
