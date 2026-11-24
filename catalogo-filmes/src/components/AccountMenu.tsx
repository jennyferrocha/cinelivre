"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Menu da conta (<details>) que fecha ao clicar fora ou apertar Esc. */
export function AccountMenu({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="relative">
      {summary}
      {children}
    </details>
  );
}
