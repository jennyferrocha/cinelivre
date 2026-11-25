import Image from "next/image";
import type { Episode } from "@/lib/series/details";

/** Episódios de uma temporada: imagem, "E1 · título", duração e resumo. */
export function EpisodeList({ episodes }: { episodes: Episode[] }) {
  if (episodes.length === 0) return <p className="text-muted">Esta temporada ainda não tem episódios.</p>;
  return (
    <ol className="flex flex-col divide-y divide-line/60">
      {episodes.map((e) => (
        <li key={e.number} className="flex gap-3 py-3 sm:gap-4">
          <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:w-40">
            {e.stillUrl && <Image src={e.stillUrl} alt="" fill sizes="(max-width: 640px) 112px, 160px" className="object-cover" />}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold leading-tight">
              <span className="text-muted">E{e.number} · </span>
              {e.title}
            </p>
            <p className="flex flex-wrap gap-x-2 text-xs text-muted">
              {e.runtime && <span>{e.runtime}</span>}
              {!e.status.aired && <span className="font-semibold text-accent">{e.status.label}</span>}
            </p>
            {e.overview && <p className="line-clamp-2 text-sm text-foreground/80">{e.overview}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
