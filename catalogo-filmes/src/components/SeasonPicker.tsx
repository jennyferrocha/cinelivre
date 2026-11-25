import Link from "next/link";
import type { SeasonSummary } from "@/lib/series/details";

/** Botões T1, T2… e "Especiais". A temporada escolhida fica na URL (`?temporada=2`). */
export function SeasonPicker({
  seriesId,
  seasons,
  active,
}: {
  seriesId: number;
  seasons: SeasonSummary[];
  active: number;
}) {
  return (
    <nav aria-label="Temporadas" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {seasons.map((s) => {
        const isActive = s.number === active;
        return (
          <Link
            key={s.number}
            href={`/serie/${seriesId}?temporada=${s.number}`}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            aria-label={s.number === 0 ? "Especiais" : `Temporada ${s.number}`}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "border border-foreground/30 text-foreground hover:border-foreground/60 hover:bg-foreground/10"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
