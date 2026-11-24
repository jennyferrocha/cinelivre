import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-3 px-4 py-8 text-center text-xs text-muted">
      <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
        <Image src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={140} height={18} />
      </a>
      <p>Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
      <p>Dados de onde assistir: JustWatch.</p>
    </footer>
  );
}
