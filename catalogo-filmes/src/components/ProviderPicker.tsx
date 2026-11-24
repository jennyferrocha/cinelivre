"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { saveSelection, type SaveSelectionState } from "@/lib/selection-actions";
import type { ServiceGroup } from "@/lib/providers/grouping";
import type { Selection } from "@/lib/selection";

const FEATURED_COUNT = 9;

type Props = {
  groups: ServiceGroup[];
  initial: Selection | null;
};

export function ProviderPicker({ groups, initial }: Props) {
  const [state, action, pending] = useActionState<SaveSelectionState, FormData>(saveSelection, {
    error: null,
  });
  const [showAll, setShowAll] = useState(false);
  const selected = new Set(initial?.services ?? []);

  const main = groups.filter((g) => !g.isChannel);
  const featured = main.slice(0, FEATURED_COUNT);
  const others = groups.filter((g) => !featured.includes(g));
  // Se a pessoa já marcou algum serviço "escondido", mostra a lista toda.
  const startOpen = others.some((g) => selected.has(g.key));

  return (
    <form action={action} className="flex flex-col gap-6">
      <ServiceGrid groups={featured} selected={selected} />

      {showAll || startOpen ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Outros serviços e canais</p>
          <ServiceGrid groups={others} selected={selected} small />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start rounded-md bg-surface-2 px-4 py-2 text-sm hover:bg-line"
        >
          + outros ({others.length})
        </button>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="includeFree"
          defaultChecked={initial?.includeFree ?? true}
          className="size-5 accent-accent"
        />
        Incluir também filmes grátis (com anúncios)
      </label>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-950 px-4 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-accent px-6 py-3 font-bold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Começar"}
      </button>
    </form>
  );
}

function ServiceGrid({
  groups,
  selected,
  small = false,
}: {
  groups: ServiceGroup[];
  selected: Set<string>;
  small?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${small ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-5"}`}>
      {groups.map((group) => (
        <label
          key={group.key}
          className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-line bg-surface p-3 text-center text-xs has-[:checked]:border-accent"
        >
          <input
            type="checkbox"
            name="services"
            value={group.key}
            defaultChecked={selected.has(group.key)}
            className="peer sr-only"
          />
          {group.logoPath && (
            <Image
              src={`https://image.tmdb.org/t/p/w92${group.logoPath}`}
              alt=""
              width={small ? 32 : 48}
              height={small ? 32 : 48}
              className="rounded-md"
            />
          )}
          <span className="leading-tight">{group.name}</span>
          <span className="absolute right-1.5 top-1 hidden text-accent peer-checked:block">✓</span>
        </label>
      ))}
    </div>
  );
}
