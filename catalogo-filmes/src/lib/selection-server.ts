import "server-only";
import { cookies } from "next/headers";
import { getServiceGroups } from "@/lib/providers/service";
import { parseSelection, SELECTION_COOKIE, type Selection } from "@/lib/selection";

/** Lê a escolha de streamings do cookie (no servidor). */
export async function getSelection(): Promise<Selection | null> {
  const raw = (await cookies()).get(SELECTION_COOKIE)?.value;
  if (!raw) return null;
  const groups = await getServiceGroups();
  return parseSelection(raw, groups.map((g) => g.key));
}
