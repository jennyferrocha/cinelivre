import { describe, expect, it, vi } from "vitest";
import { fetchAllRows } from "@/lib/supabase/pages";

describe("fetchAllRows", () => {
  it("busca de 1000 em 1000 até acabar (o Supabase corta em 1000 por pedido)", async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i);
    const page = vi.fn(async (from: number, to: number) => ({ data: all.slice(from, to + 1), error: null }));
    expect(await fetchAllRows(page)).toEqual(all);
    expect(page.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("erro em qualquer página: lança (quem chama decide o que mostrar)", async () => {
    const page = async (from: number) =>
      from === 0 ? { data: Array<number>(1000).fill(1), error: null } : { data: null, error: { message: "x" } };
    await expect(fetchAllRows(page)).rejects.toThrow("x");
  });
});
