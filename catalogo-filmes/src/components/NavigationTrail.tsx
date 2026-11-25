"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { nextTrail, readTrail, writeTrail } from "@/lib/back";

/** A cada troca de página, guarda na sessão a página atual e a anterior (para a seta "Voltar"). */
export function NavigationTrail() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    const current = search ? `${pathname}?${search}` : pathname;
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      return;
    }
    writeTrail(storage, nextTrail(readTrail(storage), current));
  }, [pathname, search]);
  return null;
}
