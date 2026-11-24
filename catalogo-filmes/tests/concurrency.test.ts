import { expect, it } from "vitest";
import { mapWithConcurrency } from "@/lib/concurrency";

it("nunca roda mais que o limite ao mesmo tempo e mantém a ordem", async () => {
  let running = 0;
  let maxRunning = 0;
  const result = await mapWithConcurrency([5, 1, 4, 2, 3, 6, 0], 3, async (n) => {
    running++;
    maxRunning = Math.max(maxRunning, running);
    await new Promise((r) => setTimeout(r, n * 3));
    running--;
    return n * 10;
  });
  expect(result).toEqual([50, 10, 40, 20, 30, 60, 0]);
  expect(maxRunning).toBe(3);
});

it("lista vazia devolve lista vazia", async () => {
  expect(await mapWithConcurrency([], 3, async (n: number) => n)).toEqual([]);
});
