import Link from "next/link";
import { SlidersIcon } from "@/components/Icons";

/** Aparece enquanto a pessoa não escolheu streamings: o app está mostrando todos. */
export function AllStreamingsBanner({ what = "filmes" }: { what?: "filmes" | "séries" }) {
  return (
    <div className="mx-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-surface/80 px-4 py-3 backdrop-blur-sm sm:mx-10">
      <p className="text-sm text-foreground/90">{`Mostrando ${what} de todos os streamings.`}</p>
      <Link
        href="/streamings"
        className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110"
      >
        <SlidersIcon />
        Escolher meus streamings
      </Link>
    </div>
  );
}
