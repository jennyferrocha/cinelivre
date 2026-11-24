import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import type { Mark, MarkStatus } from "@/lib/marks/rules";
import { getMarks } from "@/lib/marks/store";
import { supabaseConfig } from "@/lib/supabase/config";

export type MarksState = {
  /** Contas ligadas (Supabase configurado). Desligadas = os botões nem aparecem. */
  enabled: boolean;
  loggedIn: boolean;
  marks: Mark[];
  /** movieId → lista, para os botões saberem o estado de cada pôster. */
  byId: Record<number, MarkStatus>;
};

/** Quem está logado e as marcações dele. Lê a sessão: chamar dentro de um <Suspense>. */
export async function loadMarks(): Promise<MarksState> {
  if (!supabaseConfig()) return { enabled: false, loggedIn: false, marks: [], byId: {} };
  const user = await getCurrentUser();
  if (!user) return { enabled: true, loggedIn: false, marks: [], byId: {} };
  const marks = await getMarks(user.id);
  return { enabled: true, loggedIn: true, marks, byId: Object.fromEntries(marks.map((m) => [m.movieId, m.status])) };
}
