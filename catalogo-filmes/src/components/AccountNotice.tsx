"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const COOKIE = "cinelivre-aviso";

/** Mostra uma vez "Usando os streamings da sua conta." depois de entrar (e apaga o aviso). */
export function AccountNotice() {
  const [show, setShow] = useState(false);
  // O topo/rodapé não recarregam ao trocar de página: confere o aviso a cada navegação.
  const pathname = usePathname();

  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c === `${COOKIE}=streamings-da-conta`)) return;
    document.cookie = `${COOKIE}=; Max-Age=0; path=/`;
    const open = setTimeout(() => setShow(true), 0);
    const close = setTimeout(() => setShow(false), 5000);
    return () => {
      clearTimeout(open);
      clearTimeout(close);
    };
  }, [pathname]);

  return (
    <p
      role="status"
      className={`fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-lg bg-surface-2 px-4 py-3 text-center text-sm shadow-xl ring-1 ring-accent/50 transition-opacity ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {show ? "Usando os streamings da sua conta." : ""}
    </p>
  );
}
