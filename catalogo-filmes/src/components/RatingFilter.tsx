import Link from "next/link";
import { RATING_OPTIONS } from "@/lib/movies/filters";

/** Botões "Todas / 6+ / 7+ / 8+" da tela inicial. A escolha vai para a URL (`/?nota=7`). */
export function RatingFilter({ active }: { active: number | undefined }) {
  const options = [
    { label: "Todas", href: "/", value: undefined },
    ...RATING_OPTIONS.map((n) => ({ label: `${n}+`, href: `/?nota=${n}`, value: n })),
  ];
  return (
    <nav aria-label="Filtrar por nota" className="flex items-center gap-2 px-4 sm:px-10">
      <span className="mr-1 text-sm font-medium text-muted">Nota</span>
      {options.map((o) => {
        const isActive = o.value === active;
        return (
          <Link
            key={o.label}
            href={o.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-accent text-background"
                : "border border-foreground/20 text-foreground/90 hover:border-foreground/40 hover:bg-foreground/10"
            }`}
          >
            {o.value ? <span aria-hidden>★ </span> : null}
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}
