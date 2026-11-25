"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Cabeçalho transparente sobre o destaque; ganha fundo quando a pessoa rola a página. */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between gap-1 px-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4 transition-[background-color,box-shadow] duration-300 sm:px-10 ${
        scrolled
          ? "bg-background/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md"
          : "bg-gradient-to-b from-background/80 to-transparent"
      }`}
    >
      {children}
    </header>
  );
}
