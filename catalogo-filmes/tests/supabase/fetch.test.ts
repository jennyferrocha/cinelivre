import { describe, expect, it } from "vitest";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

// Um "Supabase" que nunca responde (só desiste se o pedido for cancelado).
const hangingFetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
  })) as typeof fetch;

describe("fetchWithTimeout", () => {
  it("desiste depois do tempo limite em vez de travar a página", async () => {
    const started = Date.now();
    await expect(fetchWithTimeout(50, hangingFetch)("https://x.supabase.co/auth/v1/user")).rejects.toThrow();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("respostas rápidas passam normalmente", async () => {
    const quick = (async () => new Response("ok")) as typeof fetch;
    const res = await fetchWithTimeout(50, quick)("https://x.supabase.co");
    expect(await res.text()).toBe("ok");
  });
});
