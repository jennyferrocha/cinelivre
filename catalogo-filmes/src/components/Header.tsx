import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur sm:px-8">
      <Link href="/" className="text-lg font-extrabold tracking-wide text-accent">
        CINELIVRE
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/busca" aria-label="Buscar filme" className="rounded-full px-3 py-1.5 hover:bg-surface-2">
          🔍
        </Link>
        <Link href="/streamings" className="rounded-full bg-surface-2 px-3 py-1.5 hover:bg-line">
          Meus streamings ⚙
        </Link>
      </nav>
    </header>
  );
}
