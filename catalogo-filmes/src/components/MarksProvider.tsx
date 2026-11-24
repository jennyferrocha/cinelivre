"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { MarkStatus } from "@/lib/marks/rules";

type MarksContextValue = {
  loggedIn: boolean;
  statusOf: (movieId: number) => MarkStatus | null;
  setStatus: (movieId: number, status: MarkStatus | null) => void;
  showError: () => void;
  /** Filmes com um toque ainda sendo salvo (o mesmo filme pode aparecer em vários pôsteres). */
  busy: Set<number>;
};

const MarksContext = createContext<MarksContextValue | null>(null);

/** null quando as contas estão desligadas: os botões de marcar não aparecem. */
export function useMarks(): MarksContextValue | null {
  return useContext(MarksContext);
}

/**
 * Guarda no navegador em que lista cada filme da página está, para os botões
 * mudarem na hora (antes de o servidor responder).
 */
export function MarksProvider({
  enabled,
  loggedIn,
  initial,
  children,
}: {
  enabled: boolean;
  loggedIn: boolean;
  initial: Record<number, MarkStatus>;
  children: ReactNode;
}) {
  const [marks, setMarks] = useState(initial);
  const [error, setError] = useState(false);
  const [busy] = useState(() => new Set<number>());

  // O Next guarda o estado das páginas já visitadas. Quando o servidor manda marcações
  // diferentes (ex.: depois de entrar na conta), elas passam a valer.
  const signature = JSON.stringify(initial);
  const [seen, setSeen] = useState(signature);
  if (signature !== seen) {
    setSeen(signature);
    setMarks(initial);
  }

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(false), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const setStatus = useCallback((movieId: number, status: MarkStatus | null) => {
    setMarks((prev) => {
      const next = { ...prev };
      if (status) next[movieId] = status;
      else delete next[movieId];
      return next;
    });
  }, []);

  const value = useMemo<MarksContextValue>(
    () => ({ loggedIn, statusOf: (id) => marks[id] ?? null, setStatus, showError: () => setError(true), busy }),
    [loggedIn, marks, setStatus, busy],
  );

  if (!enabled) return <>{children}</>;
  return (
    <MarksContext.Provider value={value}>
      {children}
      <p
        role="status"
        className={`fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-lg bg-red-950/95 px-4 py-3 text-center text-sm text-red-100 shadow-xl transition-opacity ${
          error ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {error ? "Não foi possível salvar. Tente de novo." : ""}
      </p>
    </MarksContext.Provider>
  );
}
