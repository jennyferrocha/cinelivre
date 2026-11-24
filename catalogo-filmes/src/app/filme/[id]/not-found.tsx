import Link from "next/link";

export default function MovieNotFound() {
  return (
    <main className="flex flex-col items-center gap-4 px-4 py-32 text-center">
      <h1 className="font-display text-3xl font-bold">Filme não encontrado</h1>
      <p className="text-muted">Esse filme não existe ou saiu do catálogo do TMDB.</p>
      <Link href="/" className="rounded-md bg-accent px-5 py-2.5 font-semibold text-background hover:brightness-110">
        Voltar para o início
      </Link>
    </main>
  );
}
