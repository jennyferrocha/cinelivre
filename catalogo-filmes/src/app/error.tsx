"use client";

import { useEffect } from "react";

// Aparece quando algo dá errado ao carregar uma página (ex.: TMDB fora do ar).
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-lg">Não conseguimos carregar os filmes agora. Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-accent px-5 py-2.5 font-bold text-accent-ink"
      >
        Tentar de novo
      </button>
    </main>
  );
}
