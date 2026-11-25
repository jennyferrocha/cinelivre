"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { StarIcon } from "@/components/Icons";
import { runStarsChange } from "@/lib/stars-flow";

/**
 * "Sua nota": 5 estrelas. Tocar numa dá a nota; tocar de novo na mesma apaga.
 * Sem login, as estrelas levam para a tela de entrar.
 */
export function StarRating({
  initial,
  save,
  loginHref,
  onError,
}: {
  initial: number | null;
  /** Salva no servidor; true = deu certo. */
  save: (stars: number | null) => Promise<boolean>;
  /** Preenchido quando a pessoa não está logada. */
  loginHref?: string;
  onError?: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [failed, setFailed] = useState(false);
  const busy = useRef({ value: false });

  // A página pode mandar outra nota (ex.: depois de entrar na conta): ela passa a valer.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setValue(initial);
  }

  const onClick = (n: number) => {
    setFailed(false);
    // Fora de transição: a estrela muda na hora, sem esperar o servidor responder.
    void runStarsChange(value, n, {
      save,
      set: setValue,
      onError: () => (onError ? onError() : setFailed(true)),
      busy: busy.current,
    });
  };

  const star = (n: number) => {
    const on = value !== null && n <= value;
    const className = `relative grid size-9 place-items-center rounded-full transition-colors hover:bg-foreground/10 ${
      on ? "text-accent" : "text-foreground/35"
    }`;
    const label = n === 1 ? "Dar 1 estrela" : `Dar ${n} estrelas`;
    return loginHref ? (
      <Link key={n} href={loginHref} aria-label={label} className={className}>
        <StarIcon className="size-6" />
      </Link>
    ) : (
      <button key={n} type="button" aria-label={label} aria-pressed={value === n} onClick={() => onClick(n)} className={className}>
        <StarIcon className="size-6" />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground/85">Sua nota</span>
        <div className="flex">{[1, 2, 3, 4, 5].map(star)}</div>
        <span className="sr-only" aria-live="polite">
          {value ? `Sua nota: ${value} de 5` : "Sem nota"}
        </span>
      </div>
      {failed && <p className="text-sm text-red-300">Não foi possível salvar. Tente de novo.</p>}
    </div>
  );
}

/** "★★★★☆" pequeno, para baixo do pôster. */
export function StarsLine({ stars }: { stars: number }) {
  return (
    <span className="text-xs leading-tight text-accent" aria-label={`Sua nota: ${stars} de 5`}>
      {"★".repeat(stars)}
      <span className="text-foreground/30">{"★".repeat(5 - stars)}</span>
    </span>
  );
}
