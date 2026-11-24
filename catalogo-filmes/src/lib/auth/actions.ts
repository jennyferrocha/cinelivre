"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authErrorMessage, safeNext } from "@/lib/auth/rules";
import { createSupabaseServer } from "@/lib/supabase/server";

/** `email` volta para o formulário não apagar o que a pessoa digitou quando dá erro. */
export type AuthState = { error: string | null; email: string };

const UNAVAILABLE = "Contas indisponíveis no momento.";

function readForm(form: FormData) {
  return {
    email: String(form.get("email") ?? "").trim(),
    senha: String(form.get("senha") ?? ""),
    next: safeNext(String(form.get("next") ?? "")),
  };
}

function validate(email: string, senha: string): string | null {
  if (!email) return "Digite seu e-mail.";
  if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres";
  return null;
}

/** Formulário "Entrar": confere e-mail e senha no Supabase e volta para onde a pessoa estava. */
export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { email, senha, next } = readForm(form);
  const fail = (error: string): AuthState => ({ error, email });
  const invalid = validate(email, senha);
  if (invalid) return fail(invalid);
  const supabase = await createSupabaseServer();
  if (!supabase) return fail(UNAVAILABLE);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return fail(authErrorMessage(error));
  } catch {
    return fail(authErrorMessage({}));
  }
  revalidatePath("/", "layout");
  redirect(next);
}

/** Formulário "Criar conta": sem confirmação de e-mail, a pessoa já sai logada. */
export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const { email, senha, next } = readForm(form);
  const fail = (error: string): AuthState => ({ error, email });
  const invalid = validate(email, senha);
  if (invalid) return fail(invalid);
  const supabase = await createSupabaseServer();
  if (!supabase) return fail(UNAVAILABLE);
  try {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) return fail(authErrorMessage(error));
    // Se a confirmação de e-mail estiver ligada no painel, não vem sessão.
    if (!data.session) return fail("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.");
  } catch {
    return fail(authErrorMessage({}));
  }
  revalidatePath("/", "layout");
  redirect(next);
}

/** Botão "Sair". */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  try {
    await supabase?.auth.signOut();
  } catch {
    // Mesmo com o Supabase fora do ar, a pessoa volta ao início.
  }
  revalidatePath("/", "layout");
  redirect("/");
}
