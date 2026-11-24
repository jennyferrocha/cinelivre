import Link from "next/link";
import { HeaderShell } from "@/components/HeaderShell";
import { SearchIcon, SlidersIcon } from "@/components/Icons";

export function Header() {
  return (
    <HeaderShell>
      <Link href="/" className="font-display text-[1.75rem] leading-none font-extrabold tracking-wide text-accent">
        CineLivre
      </Link>
      <nav className="flex items-center gap-1 text-sm sm:gap-2">
        <Link
          href="/busca"
          aria-label="Buscar filme"
          className="grid size-10 place-items-center rounded-full text-foreground/90 hover:bg-foreground/10"
        >
          <SearchIcon />
        </Link>
        <Link
          href="/streamings"
          className="flex items-center gap-2 rounded-full border border-foreground/20 px-3.5 py-2 font-medium hover:border-foreground/40 hover:bg-foreground/10"
        >
          <SlidersIcon />
          <span>Meus streamings</span>
        </Link>
      </nav>
    </HeaderShell>
  );
}
