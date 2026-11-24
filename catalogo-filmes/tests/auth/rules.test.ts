import { describe, expect, it } from "vitest";
import { authErrorMessage, safeNext } from "@/lib/auth/rules";

describe("safeNext", () => {
  it("aceita caminhos do próprio app", () => {
    expect(safeNext("/filme/12?x=1")).toBe("/filme/12?x=1");
    expect(safeNext(["/busca", "/x"])).toBe("/busca");
    expect(safeNext("/?aba=quero")).toBe("/?aba=quero");
  });

  it("qualquer outra coisa volta para o início (nunca para outro site)", () => {
    for (const bad of [undefined, "", "//evil.com", "https://evil.com", String.raw`/\evil.com`, "evil", "javascript:alert(1)", " /x"])
      expect(safeNext(bad)).toBe("/");
  });
});

describe("authErrorMessage", () => {
  it("traduz os erros conhecidos", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou senha incorretos");
    expect(authErrorMessage({ code: "user_already_exists" })).toBe("Este e-mail já tem conta");
    expect(authErrorMessage({ code: "email_exists" })).toBe("Este e-mail já tem conta");
    expect(authErrorMessage({ code: "weak_password" })).toBe("A senha precisa ter pelo menos 6 caracteres");
  });

  it("erro desconhecido vira mensagem genérica", () => {
    expect(authErrorMessage({ code: "algo_novo" })).toBe("Não foi possível entrar agora. Tente de novo.");
    expect(authErrorMessage({})).toBe("Não foi possível entrar agora. Tente de novo.");
  });
});
