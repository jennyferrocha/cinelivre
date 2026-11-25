import Link from "next/link";
import { Suspense } from "react";
import { HeaderShell } from "@/components/HeaderShell";
import { SearchIcon, SlidersIcon } from "@/components/Icons";
import { UserMenu } from "@/components/UserMenu";

export function Header() {
  return (
    <HeaderShell>
      <Link href="/" className="justify-self-start font-display text-xl leading-none font-bold tracking-tight text-accent sm:text-2xl">
        CineLivre
      </Link>
      <form
        action="/busca"
        method="get"
        role="search"
        className="flex h-10 items-center justify-self-center rounded-full border border-foreground/20 bg-background/40 backdrop-blur-sm focus-within:border-accent hover:border-foreground/40"
      >
        <input
          type="search"
          name="q"
          placeholder="Buscar filme ou série"
          aria-label="Buscar filme ou série"
          className="w-24 min-w-0 bg-transparent pl-4 text-sm outline-none placeholder:text-foreground/70 min-[400px]:w-36 sm:w-44 lg:w-72 [&::-webkit-search-cancel-button]:hidden"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="grid size-10 shrink-0 place-items-center rounded-full text-foreground/90 hover:text-accent"
        >
          <SearchIcon />
        </button>
      </form>
      <nav className="flex items-center gap-1 justify-self-end text-sm sm:gap-2">
        <Link
          href="/streamings"
          className="flex items-center gap-2 rounded-full border border-accent/40 px-3 py-3 font-medium text-accent hover:border-accent hover:bg-accent/10 lg:px-3.5 lg:py-2"
        >
          <SlidersIcon />
          <span className="max-lg:sr-only">Meus streamings</span>
        </Link>
        <Suspense fallback={<span className="size-10" />}>
          <UserMenu />
        </Suspense>
      </nav>
    </HeaderShell>
  );
}
