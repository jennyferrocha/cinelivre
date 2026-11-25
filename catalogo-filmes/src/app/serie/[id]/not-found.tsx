import Link from "next/link";

export default function SeriesNotFound() {
  return (
    <main className="flex flex-col items-center gap-4 px-4 py-32 text-center">
      <h1 className="font-display text-3xl font-bold">Série não encontrada</h1>
      <p className="text-muted">Esta série não existe ou saiu do catálogo do TMDB.</p>
      <Link href="/" className="rounded-md bg-accent px-5 py-2.5 font-semibold text-background hover:brightness-110">
        Voltar para o início
      </Link>
    </main>
  );
}
