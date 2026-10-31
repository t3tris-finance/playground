import { describe, expect, spyOn, test } from "bun:test";
import { POST } from "../app/api/playground/route";

const request = (body: unknown) =>
  new Request("http://localhost:3000/api/playground", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("same-origin SDK route", () => {
  test("uses production with no API URL setting", async () => {
    const previousUrl = process.env.T3TRIS_API_URL;
    delete process.env.T3TRIS_API_URL;
    const upstream = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ items: [] }));
    try {
      const response = await POST(
        request({ call: "catalog.listChains", apiKey: "sk_customer_test", values: {} }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ result: { items: [] } });
      expect(upstream).toHaveBeenCalledTimes(1);
      expect(upstream.mock.calls[0]?.[0]).toBe("https://api.t3tris.finance/v0/chains");
    } finally {
      upstream.mockRestore();
      if (previousUrl === undefined) delete process.env.T3TRIS_API_URL;
      else process.env.T3TRIS_API_URL = previousUrl;
    }
  });
  test("rejects missing credentials, malformed JSON and oversized input without caching", async () => {
    const inputs = [
      request({ call: "catalog.listChains", values: {} }),
      new Request("http://localhost:3000/api/playground", { method: "POST", body: "{" }),
      new Request("http://localhost:3000/api/playground", {
        method: "POST",
        headers: { "content-length": "16385" },
        body: "{}",
      }),
    ];
    for (const input of inputs) {
      const response = await POST(input);
      expect(response.status).toBe(400);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
  });

  test("uses the configured API and only the supplied customer key, preserving API errors", async () => {
    const previousUrl = process.env.T3TRIS_API_URL;
    const previousKey = process.env.T3TRIS_API_KEY;
    const calls: { path: string; authorization: string | null; session: string | null }[] = [];
    const upstream = Bun.serve({
      port: 0,
      fetch(input) {
        calls.push({
          path: new URL(input.url).pathname,
          authorization: input.headers.get("authorization"),
          session: input.headers.get("x-t3tris-session"),
        });
        return calls.length === 1
          ? Response.json({ items: [{ id: 42161 }] })
          : Response.json(
              { error: { code: "rate_limited", message: "Quota reached." } },
              { status: 429 },
            );
      },
    });
    try {
      process.env.T3TRIS_API_URL = `http://127.0.0.1:${upstream.port}`;
      process.env.T3TRIS_API_KEY = "sk_environment_not_for_visitors";
      const input = { call: "catalog.listChains", apiKey: "sk_customer_test", values: {} };
      const response = await POST(request(input));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ result: { items: [{ id: 42161 }] } });
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(calls[0]).toEqual({
        path: "/v0/chains",
        authorization: "Bearer sk_customer_test",
        session: null,
      });
      const limited = await POST(request(input));
      expect(limited.status).toBe(429);
      expect(await limited.json()).toEqual({
        error: { code: "rate_limited", message: "Quota reached." },
      });
    } finally {
      upstream.stop(true);
      if (previousUrl === undefined) delete process.env.T3TRIS_API_URL;
      else process.env.T3TRIS_API_URL = previousUrl;
      if (previousKey === undefined) delete process.env.T3TRIS_API_KEY;
      else process.env.T3TRIS_API_KEY = previousKey;
    }
  });

  test("returns a valid gateway error when the upstream API is unreachable", async () => {
    const previousUrl = process.env.T3TRIS_API_URL;
    try {
      process.env.T3TRIS_API_URL = "http://127.0.0.1:1";
      const response = await POST(
        request({ call: "catalog.listChains", apiKey: "sk_customer_test", values: {} }),
      );
      expect(response.status).toBe(502);
      expect(await response.json()).toMatchObject({ error: { code: "network_error" } });
    } finally {
      if (previousUrl === undefined) delete process.env.T3TRIS_API_URL;
      else process.env.T3TRIS_API_URL = previousUrl;
    }
  });
});
