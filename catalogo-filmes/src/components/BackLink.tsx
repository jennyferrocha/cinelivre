"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { backFallback, backSteps, readStack } from "@/lib/back";

/**
 * "← Voltar": volta pelo histórico até a tela anterior do CineLivre (pulando outras temporadas
 * da mesma página e o login), no mesmo ponto da rolagem. Sem tela anterior no app (aberta
 * por link), vai para Séries (série) ou Filmes (filme).
 */
export function BackLink({ kind }: { kind: "tv" | "movie" }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const going = useRef(false);

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return; // abrir em nova aba
    const current = search ? `${pathname}?${search}` : pathname;
    let stack: string[] = [];
    try {
      stack = readStack(window.sessionStorage);
    } catch {
      stack = [];
    }
    const steps = backSteps(stack, current);
    if (steps === null) return; // segue o link para o destino padrão
    event.preventDefault();
    if (going.current) return; // toque duplo: volta uma vez só
    going.current = true;
    window.history.go(-steps);
  };

  return (
    <Link
      href={backFallback(kind)}
      onClick={onClick}
      className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full py-1.5 pr-3 text-sm font-semibold text-foreground/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.85)] hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
        <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Voltar
    </Link>
  );
}
