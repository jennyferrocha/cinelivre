import { describe, expect, it } from "vitest";
import { parseSelection, selectionFromForm, serializeSelection } from "@/lib/selection";

describe("parseSelection / serializeSelection", () => {
  it("ida e volta preserva a seleção", () => {
    const s = { services: ["netflix"], includeFree: true };
    expect(parseSelection(serializeSelection(s))).toEqual(s);
  });

  it("sem cookie é sem seleção", () => {
    expect(parseSelection(undefined)).toBeNull();
  });

  it("cookie corrompido é sem seleção", () => {
    expect(parseSelection("lixo{")).toBeNull();
    expect(parseSelection('{"services":"netflix"}')).toBeNull();
    expect(parseSelection('{"services":[1,2],"includeFree":true}')).toBeNull();
    expect(parseSelection("null")).toBeNull();
  });

  it("ignora serviços que não existem mais", () => {
    const raw = serializeSelection({ services: ["netflix", "sumiu"], includeFree: false });
    expect(parseSelection(raw, ["netflix"])).toEqual({ services: ["netflix"], includeFree: false });
  });

  it("nada escolhido e grátis desligado é sem seleção", () => {
    expect(parseSelection(serializeSelection({ services: [], includeFree: false }))).toBeNull();
    const raw = serializeSelection({ services: ["sumiu"], includeFree: false });
    expect(parseSelection(raw, ["netflix"])).toBeNull();
  });

  it("só grátis é uma seleção válida", () => {
    expect(parseSelection(serializeSelection({ services: [], includeFree: true }))).toEqual({
      services: [],
      includeFree: true,
    });
  });
});

describe("selectionFromForm", () => {
  it("lê os serviços marcados e a caixa de grátis", () => {
    const form = new FormData();
    form.append("services", "netflix");
    form.append("services", "globoplay");
    form.append("includeFree", "on");
    expect(selectionFromForm(form, ["netflix", "globoplay"])).toEqual({
      services: ["netflix", "globoplay"],
      includeFree: true,
    });
  });

  it("devolve null quando nada foi marcado", () => {
    expect(selectionFromForm(new FormData(), ["netflix"])).toBeNull();
  });

  it("ignora serviços inventados no formulário", () => {
    const form = new FormData();
    form.append("services", "hacker");
    form.append("includeFree", "on");
    expect(selectionFromForm(form, ["netflix"])).toEqual({ services: [], includeFree: true });
  });
});
