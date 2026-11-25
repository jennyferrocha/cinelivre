import "server-only";
import type { Mark, MarkSnapshot, MarkStatus } from "@/lib/marks/rules";
import { createSupabaseServer } from "@/lib/supabase/server";

// Leitura e escrita das marcações no Supabase. As regras de segurança (RLS) do banco
// garantem que cada pessoa só enxerga e altera as próprias linhas.

type Row = {
  movie_id: number;
  status: MarkStatus;
  title: string;
  year: string;
  poster_path: string | null;
  rating: number;
  marked_at: string;
  stars: number | null;
};

async function client() {
  const supabase = await createSupabaseServer();
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

/** Todas as marcações da pessoa. Falha do Supabase = lista vazia (o app segue funcionando). */
export async function getMarks(userId: string): Promise<Mark[]> {
  try {
    const supabase = await client();
    const { data, error } = await supabase
      .from("movie_marks")
      .select("movie_id, status, title, year, poster_path, rating, marked_at, stars")
      .eq("user_id", userId);
    if (error || !data) return [];
    return (data as Row[]).map((r) => ({
      movieId: r.movie_id,
      status: r.status,
      title: r.title,
      year: r.year,
      posterPath: r.poster_path,
      rating: Number(r.rating),
      markedAt: r.marked_at,
      stars: r.stars ?? null,
    }));
  } catch {
    return [];
  }
}

/** Marca (ou troca de lista). Um filme só fica numa lista: a chave é pessoa + filme. */
export async function saveMark(userId: string, movie: MarkSnapshot, status: MarkStatus): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("movie_marks").upsert(
    {
      user_id: userId,
      movie_id: movie.movieId,
      status,
      title: movie.title,
      year: movie.year,
      poster_path: movie.posterPath,
      rating: movie.rating,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "user_id,movie_id" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteMark(userId: string, movieId: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("movie_marks").delete().eq("user_id", userId).eq("movie_id", movieId);
  if (error) throw new Error(error.message);
}

/** Grava as estrelas do filme junto com a lista (dar estrelas põe em "Já assisti"). */
export async function saveMovieStars(
  userId: string,
  movie: MarkSnapshot,
  status: MarkStatus,
  stars: number | null,
): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("movie_marks").upsert(
    {
      user_id: userId,
      movie_id: movie.movieId,
      status,
      stars,
      title: movie.title,
      year: movie.year,
      poster_path: movie.posterPath,
      rating: movie.rating,
    },
    { onConflict: "user_id,movie_id" },
  );
  if (error) throw new Error(error.message);
}
