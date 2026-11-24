import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { safeNext } from "@/lib/auth/rules";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar · CineLivre" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect(next);
  const mode = first(sp.modo) === "criar" ? "criar" : "entrar";
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{mode === "criar" ? "Criar conta" : "Entrar"}</h1>
      <p className="max-w-sm text-center text-sm text-muted">
        Com uma conta você guarda os filmes que quer ver e os que já viu, em qualquer aparelho.
      </p>
      <AuthForm key={mode} mode={mode} next={next} marcar={first(sp.marcar)} />
    </>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="flex flex-col items-center gap-5 px-4 pt-10 pb-20">
      <Suspense fallback={<div className="h-80 w-full max-w-sm animate-pulse rounded-lg bg-surface-2" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
