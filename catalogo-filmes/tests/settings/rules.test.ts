import { describe, expect, it } from "vitest";
import { reconcileOnLogin, sameSelection } from "@/lib/settings/rules";

const A = { services: ["netflix", "max"], includeFree: true };
const B = { services: ["hbo-max"], includeFree: false };

describe("reconcileOnLogin", () => {
  it("a conta tem uma escolha diferente da do aparelho: vale a da conta, com aviso", () => {
    expect(reconcileOnLogin(A, B)).toEqual({ selection: A, copyToAccount: false, notice: true });
  });

  it("iguais (a ordem não importa): sem aviso", () => {
    expect(reconcileOnLogin(A, { services: ["max", "netflix"], includeFree: true })).toEqual({
      selection: A,
      copyToAccount: false,
      notice: false,
    });
  });

  it("primeira vez na conta: copia a escolha do aparelho para a conta", () => {
    expect(reconcileOnLogin(null, B)).toEqual({ selection: B, copyToAccount: true, notice: false });
  });

  it("aparelho sem escolha: usa a da conta, sem aviso", () => {
    expect(reconcileOnLogin(A, null)).toEqual({ selection: A, copyToAccount: false, notice: false });
  });

  it("nenhum dos dois: nada a fazer", () => {
    expect(reconcileOnLogin(null, null)).toEqual({ selection: null, copyToAccount: false, notice: false });
  });
});

describe("sameSelection", () => {
  it("compara serviços sem ordem e o grátis", () => {
    expect(sameSelection(A, { ...A, services: ["max", "netflix"] })).toBe(true);
    expect(sameSelection(A, { ...A, includeFree: false })).toBe(false);
  });
});
