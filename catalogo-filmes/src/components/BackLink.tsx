"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { backFallback, canGoBack, readTrail } from "@/lib/back";

/**
 * "← Voltar": volta para a tela anterior do CineLivre (como o voltar do celular).
 * Se a página foi aberta direto por um link, vai para Séries (série) ou Filmes (filme).
 */
export function BackLink({ kind }: { kind: "tv" | "movie" }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // abrir em nova aba
    const current = search ? `${pathname}?${search}` : pathname;
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    if (canGoBack(readTrail(storage), current)) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={backFallback(kind)}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-foreground/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Voltar
    </Link>
  );
}
