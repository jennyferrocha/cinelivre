import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { getServiceGroups } from "@/lib/providers/service";
import { allServicesSelection, parseSelection, SELECTION_COOKIE, type Selection } from "@/lib/selection";
import { getAccountSelection } from "@/lib/settings/store";

/**
 * A escolha de streamings da pessoa. Logada e com escolha na conta: vale a da conta
 * (a mesma em qualquer aparelho). Senão, a do cookie deste aparelho.
 * Lê cookies: chamar dentro de um <Suspense>.
 */
export async function getSelection(): Promise<Selection | null> {
  const [raw, groups, user] = await Promise.all([
    cookies().then((store) => store.get(SELECTION_COOKIE)?.value),
    getServiceGroups(),
    getCurrentUser(),
  ]);
  const validKeys = groups.map((g) => g.key);
  if (user) {
    const account = await getAccountSelection(user.id);
    const valid = account && parseSelection(JSON.stringify(account), validKeys);
    if (valid) return valid;
  }
  return parseSelection(raw, validKeys);
}

/**
 * A escolha usada para mostrar filmes: a real (conta ou aparelho) ou, se a pessoa ainda não
 * escolheu, "todos os streamings". `chosen` diz qual dos dois (para mostrar o convite).
 * A escolha "todos" nunca é gravada.
 */
export async function getEffectiveSelection(): Promise<{ selection: Selection; chosen: boolean }> {
  const selection = await getSelection();
  if (selection) return { selection, chosen: true };
  return { selection: allServicesSelection(await getServiceGroups()), chosen: false };
}
