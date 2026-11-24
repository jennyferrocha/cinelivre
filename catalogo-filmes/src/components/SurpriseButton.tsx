"use client";

import { useRouter } from "next/navigation";
import { pickRandom } from "@/lib/movies/filters";

/** Sorteia um dos filmes encontrados e abre o detalhe dele. */
export function SurpriseButton({ ids }: { ids: number[] }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const id = pickRandom(ids);
        if (id) router.push(`/filme/${id}`);
      }}
      className="rounded-md bg-accent px-5 py-2.5 font-semibold text-background transition hover:brightness-110"
    >
      🔀 Me surpreenda
    </button>
  );
}
