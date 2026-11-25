import { describe, expect, it } from "vitest";

// Confere as páginas de verdade num app rodando: `npm run test:paginas` (usa http://localhost:3000)
// ou `SITE_URL=https://seu-site.vercel.app npm run test:paginas`.
const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const NETFLIX = `cinelivre-selecao=${encodeURIComponent(JSON.stringify({ services: ["netflix"], includeFree: true }))}`;
const BANNER = "Mostrando filmes de todos os streamings.";

async function page(path: string, cookie?: string): Promise<string> {
  const res = await fetch(base + path, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  expect(res.status).toBe(200);
  return res.text();
}

describe(`páginas em ${base}`, () => {
  it("primeira visita: a tela inicial abre direto, com a faixa e o Top 10", async () => {
    const html = await page("/");
    expect(html).not.toContain("NEXT_REDIRECT;replace;/streamings");
    expect(html).toContain(BANNER);
    expect(html).toContain("Top 10 em alta");
  });

  it("primeira visita: 'O que eu assisto hoje?' abre direto, com a faixa", async () => {
    const html = await page("/sugestoes");
    expect(html).not.toContain("NEXT_REDIRECT;replace;/streamings");
    expect(html).toContain(BANNER);
  });

  it("com streamings escolhidos, a faixa não aparece", async () => {
    expect(await page("/", NETFLIX)).not.toContain(BANNER);
    expect(await page("/sugestoes", NETFLIX)).not.toContain(BANNER);
  });

  it("séries: a tela inicial troca para séries, com o botão e o Top 10", async () => {
    const html = await page("/?tipo=series");
    expect(html).toContain("Séries");
    expect(html).toContain("Top 10 em alta");
    expect(html).toContain('href="/serie/');
    expect(html).toContain("Mostrando séries de todos os streamings.");
    expect(await page("/?tipo=series&nota=8")).toContain('href="/?tipo=series&amp;nota=8"');
  });

  it("séries: página da série com temporadas", async () => {
    const html = await page("/serie/1399");
    expect(html).toContain("Game of Thrones");
    expect(html).toContain("Especiais");
    expect(await page("/serie/1399?temporada=2")).toContain('aria-label="Temporada 2"');
  });

  it("séries: série que não existe mostra 'não encontrada'", async () => {
    for (const path of ["/serie/999999999", "/serie/abc"]) {
      const html = await page(path);
      expect(html).toContain("Esta série não existe ou saiu do catálogo do TMDB.");
      expect(html).toContain("Voltar para o início");
    }
  });

  it("busca acha filmes e séries", async () => {
    const html = await page("/busca?q=the%20office");
    expect(html).toContain('href="/serie/');
  });

  it("séries: abas de listas pedem login para quem não entrou", async () => {
    for (const aba of ["quero", "acompanhando", "assisti", "parei"]) {
      const html = await page(`/?tipo=series&aba=${aba}`);
      expect(html).toContain("Entre para acompanhar suas séries");
      expect(html).toContain('href="/?tipo=series&amp;aba=parei"');
    }
  });
});
