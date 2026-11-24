import "server-only";
import type { Selection } from "@/lib/selection";
import { createSupabaseServer } from "@/lib/supabase/server";

/** Streamings guardados na conta. Sem linha, sem Supabase ou com erro: null. */
export async function getAccountSelection(userId: string): Promise<Selection | null> {
  try {
    const supabase = await createSupabaseServer();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("user_settings")
      .select("services, include_free")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return { services: data.services ?? [], includeFree: !!data.include_free };
  } catch {
    return null;
  }
}

export async function saveAccountSelection(userId: string, selection: Selection): Promise<void> {
  const supabase = await createSupabaseServer();
  if (!supabase) return;
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      services: selection.services,
      include_free: selection.includeFree,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);
}
