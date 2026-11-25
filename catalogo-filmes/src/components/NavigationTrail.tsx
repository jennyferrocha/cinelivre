"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { onLoad, onNavigate, readStack, writeStack } from "@/lib/back";

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Guarda na sessão a trilha de páginas abertas no CineLivre nesta aba (para a seta "Voltar"),
 * acompanhando o voltar/avançar do navegador.
 */
export function NavigationTrail() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const popped = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const current = search ? `${pathname}?${search}` : pathname;
    const storage = sessionStore();
    let stack = readStack(storage);
    if (!loaded.current) {
      loaded.current = true;
      const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
      stack = onLoad(stack, current, entry?.type ?? "navigate");
    } else {
      stack = onNavigate(stack, current, popped.current);
    }
    popped.current = false;
    writeStack(storage, stack);
  }, [pathname, search]);

  return null;
}
