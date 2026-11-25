import Link from "next/link";
import { homeHref, type HomeKind } from "@/lib/kind";

const OPTIONS: { kind: HomeKind; label: string }[] = [
  { kind: "filmes", label: "Filmes" },
  { kind: "series", label: "Séries" },
];

/** Pílula "Filmes | Séries" da tela inicial. A escolhida fica em amarelo. */
export function KindSwitch({ active }: { active: HomeKind }) {
  return (
    <nav aria-label="Filmes ou séries" className="px-4 sm:px-10">
      <div className="inline-flex gap-1 rounded-full bg-background/60 p-1 ring-1 ring-foreground/15 backdrop-blur-md">
        {OPTIONS.map((o) => {
          const isActive = o.kind === active;
          return (
            <Link
              key={o.kind}
              href={homeHref(o.kind)}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                isActive ? "bg-accent text-background" : "text-foreground/85 hover:text-foreground"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
