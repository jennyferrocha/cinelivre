import Link from "next/link";
import { HeaderShell } from "@/components/HeaderShell";
import { SearchIcon, SlidersIcon } from "@/components/Icons";

export function Header() {
  return (
    <HeaderShell>
      <Link href="/" className="font-display text-xl leading-none font-bold tracking-tight text-accent sm:text-2xl">
        CineLivre
      </Link>
      <nav className="flex items-center gap-1 text-sm sm:gap-2">
        <form
          action="/busca"
          method="get"
          role="search"
          className="flex h-10 items-center rounded-full border border-foreground/20 bg-background/40 backdrop-blur-sm focus-within:border-accent hover:border-foreground/40"
        >
          <input
            type="search"
            name="q"
            placeholder="Buscar filme"
            aria-label="Buscar filme"
            className="w-28 min-w-0 bg-transparent pl-4 text-sm outline-none placeholder:text-foreground/70 min-[400px]:w-36 sm:w-52 [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-foreground/90 hover:text-accent"
          >
            <SearchIcon />
          </button>
        </form>
        <Link
          href="/streamings"
          className="flex items-center gap-2 rounded-full border border-accent/40 px-3 py-3 font-medium text-accent hover:border-accent hover:bg-accent/10 sm:px-3.5 sm:py-2"
        >
          <SlidersIcon />
          <span className="max-sm:sr-only">Meus streamings</span>
        </Link>
      </nav>
    </HeaderShell>
  );
}
