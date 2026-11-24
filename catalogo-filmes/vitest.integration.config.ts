import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Teste de segurança contra o projeto real do Supabase (rode com `npm run test:seguranca`).
// Lê a URL e a chave pública do .env.local.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests-integration/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});
