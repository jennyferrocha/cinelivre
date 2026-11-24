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
});
