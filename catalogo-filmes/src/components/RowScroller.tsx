"use client";

import { useRef, type ReactNode } from "react";
import { ChevronIcon } from "@/components/Icons";

/** Trilho horizontal com setas para quem usa mouse; no toque, é só deslizar. */
export function RowScroller({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  }

  const arrow =
    "absolute inset-y-0 z-10 hidden w-10 place-items-center text-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 sm:grid sm:w-12";

  return (
    <div className="group/row relative">
      <button
        type="button"
        aria-label={`Voltar em ${label}`}
        onClick={() => scroll(-1)}
        className={`${arrow} left-0 bg-gradient-to-r from-background/90 to-transparent`}
      >
        <ChevronIcon dir="left" className="size-8" />
      </button>
      <div ref={ref} className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-2 pb-6 sm:scroll-px-10 sm:px-10">
        {children}
      </div>
      <button
        type="button"
        aria-label={`Avançar em ${label}`}
        onClick={() => scroll(1)}
        className={`${arrow} right-0 bg-gradient-to-l from-background/90 to-transparent`}
      >
        <ChevronIcon dir="right" className="size-8" />
      </button>
    </div>
  );
}
