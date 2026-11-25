import Image from "next/image";
import type { WhereToWatch } from "@/lib/movies/details";

/** "Onde assistir": todos os streamings do Brasil com o título; os da pessoa em amarelo. */
export function WhereToWatchList({ services }: { services: WhereToWatch[] }) {
  return (
    <section aria-labelledby="onde-assistir" className="flex flex-col gap-3 pt-2">
      <h2 id="onde-assistir" className="font-display text-xl font-bold">
        Onde assistir
      </h2>
      {services.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {services.map((s) => (
            <li
              key={s.key}
              className={`flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-sm font-medium ${
                s.mine ? "bg-accent text-background" : "bg-surface-2 text-foreground/55"
              }`}
            >
              {s.logoUrl ? (
                <Image
                  src={s.logoUrl}
                  alt=""
                  width={26}
                  height={26}
                  className={`rounded-full ${s.mine ? "" : "opacity-60 grayscale"}`}
                />
              ) : (
                <span className="w-1" />
              )}
              {s.name}
              {s.mine && <span className="sr-only"> (você assina)</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Não está em nenhum streaming no Brasil agora.</p>
      )}
      <p className="text-xs text-muted">Dados de streaming: JustWatch</p>
    </section>
  );
}
