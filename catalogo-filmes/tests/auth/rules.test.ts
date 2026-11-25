import { describe, expect, it } from "vitest";
import { authErrorMessage, parsePendingMark, safeNext } from "@/lib/auth/rules";

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

  it("caracteres invisíveis não abrem brecha para outro site", () => {
    for (const bad of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/ /evil.com", "/\u0000/evil.com"])
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

describe("parsePendingMark", () => {
  it("lê o filme que a pessoa tentou marcar antes de entrar", () => {
    expect(parsePendingMark("603:quero")).toEqual({ movieId: 603, status: "quero" });
    expect(parsePendingMark(["603:assisti"])).toEqual({ movieId: 603, status: "assisti" });
  });

  it("valores inválidos são ignorados", () => {
    for (const bad of [undefined, "", "abc:quero", "603:outra", "603", "-1:quero", "1.5:quero", "0:quero", "603:quero:x"])
      expect(parsePendingMark(bad)).toBeNull();
  });

  it("séries: 'quero assistir' e um episódio", () => {
    expect(parsePendingMark("s1399:quero")).toEqual({ kind: "tv", seriesId: 1399, status: "quero" });
    expect(parsePendingMark("s1399:t2e6")).toEqual({ kind: "tv", seriesId: 1399, episode: { season: 2, episode: 6 } });
    expect(parsePendingMark("s1399:t0e1")).toEqual({ kind: "tv", seriesId: 1399, episode: { season: 0, episode: 1 } });
    for (const bad of ["s0:quero", "s1:assisti", "s1:t2", "s1:t1000e1", "s1:t1e0", "sx:quero", "s1:t1e1:x"])
      expect(parsePendingMark(bad)).toBeNull();
  });
});
