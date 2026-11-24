import "server-only";
import { cookies } from "next/headers";
import { getServiceGroups } from "@/lib/providers/service";
import { parseSelection, SELECTION_COOKIE, serializeSelection } from "@/lib/selection";
import { reconcileOnLogin } from "@/lib/settings/rules";
import { getAccountSelection, saveAccountSelection } from "@/lib/settings/store";

/** Aviso de uso único ("Usando os streamings da sua conta."), lido e apagado no navegador. */
export const NOTICE_COOKIE = "cinelivre-aviso";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Logo depois de entrar: combina a escolha de streamings do aparelho com a da conta.
 * Nunca impede o login (erros são ignorados).
 */
export async function syncSelectionOnLogin(userId: string): Promise<void> {
  try {
    const store = await cookies();
    const keys = (await getServiceGroups()).map((g) => g.key);
    const device = parseSelection(store.get(SELECTION_COOKIE)?.value, keys);
    const accountRaw = await getAccountSelection(userId);
    const account = accountRaw && parseSelection(JSON.stringify(accountRaw), keys);

    const { selection, copyToAccount, notice } = reconcileOnLogin(account, device);
    if (selection) {
      store.set(SELECTION_COOKIE, serializeSelection(selection), { maxAge: ONE_YEAR, sameSite: "lax", path: "/" });
    }
    if (notice) store.set(NOTICE_COOKIE, "streamings-da-conta", { maxAge: 60, sameSite: "lax", path: "/" });
    if (copyToAccount && selection) await saveAccountSelection(userId, selection);
  } catch {
    // ignora: a pessoa entra mesmo assim
  }
}
