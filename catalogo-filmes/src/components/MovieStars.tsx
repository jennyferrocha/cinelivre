"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMarks } from "@/components/MarksProvider";
import { StarRating } from "@/components/StarRating";
import { setMovieStars } from "@/lib/marks/actions";
import type { MarkSnapshot } from "@/lib/marks/rules";

/** Estrelas do filme na página dele. Dar estrelas põe o filme em "Já assisti" (os botões mudam junto). */
export function MovieStars({ movie, initial }: { movie: MarkSnapshot; initial: number | null }) {
  const marks = useMarks();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  if (!marks) return null;

  const here = search ? `${pathname}?${search}` : pathname;
  const save = async (stars: number | null) => {
    const result = await setMovieStars(movie, stars, marks.statusOf(movie.movieId));
    if ("error" in result) return false;
    marks.setStatus(movie.movieId, result.status);
    return true;
  };

  return (
    <StarRating
      initial={initial}
      save={save}
      onError={marks.showError}
      loginHref={marks.loggedIn ? undefined : `/entrar?${new URLSearchParams({ next: here })}`}
    />
  );
}
