"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceGroups } from "@/lib/providers/service";
import { SELECTION_COOKIE, selectionFromForm, serializeSelection } from "@/lib/selection";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type SaveSelectionState = { error: string | null };

/** Server action do formulário da tela /streamings: grava o cookie e volta ao início. */
export async function saveSelection(
  _previous: SaveSelectionState,
  form: FormData,
): Promise<SaveSelectionState> {
  const groups = await getServiceGroups();
  const selection = selectionFromForm(form, groups.map((g) => g.key));
  if (!selection) {
    return { error: "Escolha pelo menos um streaming ou inclua os grátis." };
  }
  (await cookies()).set(SELECTION_COOKIE, serializeSelection(selection), {
    maxAge: ONE_YEAR,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}
