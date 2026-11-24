"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";

type Props = { mode: "entrar" | "criar"; next: string; marcar: string };

/** Formulário de e-mail e senha, nos modos "Entrar" e "Criar conta". */
export function AuthForm({ mode, next, marcar }: Props) {
  const creating = mode === "criar";
  const [state, action, pending] = useActionState<AuthState, FormData>(creating ? signUp : signIn, { error: null, email: "" });
  const params = new URLSearchParams();
  if (!creating) params.set("modo", "criar");
  params.set("next", next);
  if (marcar) params.set("marcar", marcar);
  const inputClass =
    "rounded-md border border-foreground/20 bg-surface-2 px-4 py-3 text-base outline-none focus:border-accent";

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="marcar" value={marcar} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        E-mail
        <input type="email" name="email" required autoComplete="email" defaultValue={state.email} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Senha
        <input
          type="password"
          name="senha"
          required
          minLength={6}
          autoComplete={creating ? "new-password" : "current-password"}
          className={inputClass}
        />
        {creating && <span className="text-xs text-muted">Pelo menos 6 caracteres.</span>}
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-5 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Aguarde…" : creating ? "Criar conta" : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        {creating ? "Já tem conta? " : "Ainda não tem conta? "}
        <Link href={`/entrar?${params}`} className="font-semibold text-accent hover:underline">
          {creating ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </form>
  );
}
