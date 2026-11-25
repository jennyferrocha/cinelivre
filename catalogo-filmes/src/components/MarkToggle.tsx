"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ComponentType } from "react";
import { BookmarkIcon, CheckIcon } from "@/components/Icons";
import { useMarks } from "@/components/MarksProvider";
import { toggleMark } from "@/lib/marks/actions";
import type { MarkSnapshot, MarkStatus } from "@/lib/marks/rules";
import { runToggle } from "@/lib/marks/toggle-flow";

type Props = { movie: MarkSnapshot; variant: "card" | "detail" };

const BUTTONS: { status: MarkStatus; Icon: ComponentType<{ className?: string }>; label: string; on: string; off: string }[] = [
  { status: "quero", Icon: BookmarkIcon, label: "Quero assistir", on: "✓ Na sua lista", off: "＋ Quero assistir" },
  { status: "assisti", Icon: CheckIcon, label: "Já assisti", on: "✓ Você já assistiu", off: "✓ Já assisti" },
];

/** Botões "Quero assistir" e "Já assisti" (no canto do pôster ou grandes na página do filme). */
export function MarkToggle({ movie, variant }: Props) {
  const marks = useMarks();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  if (!marks) return null;

  const current = marks.statusOf(movie.movieId);
  const here = search ? `${pathname}?${search}` : pathname;
  const loginHref = (status: MarkStatus) =>
    `/entrar?${new URLSearchParams({ next: here, marcar: `${movie.movieId}:${status}` })}`;

  const onClick = (status: MarkStatus) => {
    // Fora de transição: numa transição assíncrona o React só mostra o ✓ quando o servidor
    // responde. Assim ele aparece na hora (e é desfeito se der errado).
    void runToggle(movie, status, current, {
      toggle: toggleMark,
      setStatus: marks.setStatus,
      onLogin: (clicked) => router.push(loginHref(clicked)),
      onError: marks.showError,
      busy: marks.busy,
    });
  };

  if (variant === "detail") {
    return (
      <div className="flex flex-wrap gap-3">
        {BUTTONS.map((b) => {
          const pressed = current === b.status;
          const className = `rounded-md px-5 py-2.5 font-semibold transition-colors ${
            pressed ? "bg-accent text-accent-ink" : "border border-foreground/30 hover:border-foreground/60 hover:bg-foreground/10"
          }`;
          return marks.loggedIn ? (
            <button key={b.status} type="button" aria-pressed={pressed} onClick={() => onClick(b.status)} className={className}>
              {pressed ? b.on : b.off}
            </button>
          ) : (
            <Link key={b.status} href={loginHref(b.status)} className={className}>
              {b.off}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {BUTTONS.map((b) => {
        const pressed = current === b.status;
        // 28px de desenho, 36px de área de toque (o ::after invisível em volta).
        const className = `relative grid size-7 place-items-center rounded-full text-xs shadow-md backdrop-blur-sm transition-colors after:absolute after:-inset-1 after:content-[''] ${
          pressed ? "bg-accent text-accent-ink" : "bg-black/65 text-foreground hover:bg-black/85"
        }`;
        const label = `${b.label}: ${movie.title}`;
        return marks.loggedIn ? (
          <button
            key={b.status}
            type="button"
            aria-pressed={pressed}
            aria-label={label}
            title={b.label}
            onClick={() => onClick(b.status)}
            className={className}
          >
            <b.Icon className="size-3.5" />
          </button>
        ) : (
          <Link key={b.status} href={loginHref(b.status)} aria-label={label} title={b.label} className={className}>
            <b.Icon className="size-3.5" />
          </Link>
        );
      })}
    </div>
  );
}

/** Selo "✓ Já assisti" sobre o pôster. */
export function WatchedBadge({ movieId }: { movieId: number }) {
  const marks = useMarks();
  if (marks?.statusOf(movieId) !== "assisti") return null;
  return (
    <span className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink shadow-lg">
      ✓ Já assisti
    </span>
  );
}
