import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Playground, sessionFromResult } from "../components/playground";
import { CodePanel, ResponsePanel } from "../components/playground-panels";
import { parsePlaygroundInput } from "../lib/playground";
import { PLAYGROUND_CALLS } from "../lib/playground-calls";
import { playgroundExample } from "../lib/playground-example";
import { runPlaygroundCall } from "../lib/playground-runner";

describe("customer-key playground", () => {
  test("starts with a safe read and an empty key", () => {
    const html = renderToStaticMarkup(<Playground />);
    expect(html).toContain("catalog.listChains");
    expect(html).not.toContain("Session token (ss_");
    expect(html).toContain("disabled");
    expect(html).not.toContain("npm install @t3tris/sdk");
    expect(html).toContain("npm install git+https://github.com/t3tris-finance/sdk.git#");
    expect(html).not.toContain("git+ssh:");
    expect(html).not.toContain("requires SSH access");
  });

  test("rejects missing keys, unknown calls and unexpected inputs", () => {
    expect(() => parsePlaygroundInput({ call: "catalog.listChains", values: {} })).toThrow(
      "Paste your customer API key",
    );
    expect(() =>
      parsePlaygroundInput({ call: "not.aCall", apiKey: "sk_12345678", values: {} }),
    ).toThrow("Unknown SDK call");
    expect(() =>
      parsePlaygroundInput({ call: "vaults.updateMetadata", apiKey: "sk_12345678", values: {} }),
    ).toThrow("Paste your session token");
    expect(() =>
      parsePlaygroundInput({
        call: "catalog.listChains",
        apiKey: "sk_12345678",
        values: { address: "0xdead" },
      }),
    ).toThrow("Invalid input: address");
    expect(PLAYGROUND_CALLS).toHaveLength(34);
    for (const call of PLAYGROUND_CALLS) {
      const code = playgroundExample(call, {});
      expect(code).toContain(`client.${call.id}(`);
      expect(code).not.toContain("sk_12345678");
    }
    expect(PLAYGROUND_CALLS.map((call) => call.id)).toContain("billing.getUsage");
    expect(PLAYGROUND_CALLS.map((call) => call.id)).not.toContain("usage.get");
  });

  test("accepts a session only for protected calls", () => {
    const protectedInput = parsePlaygroundInput({
      call: "vaults.updateMetadata",
      apiKey: "sk_12345678",
      session: "ss_12345678",
      values: { chainId: "42161", address: "0x1111111111111111111111111111111111111111" },
    });
    expect(protectedInput.session).toBe("ss_12345678");
    const publicInput = parsePlaygroundInput({
      call: "catalog.listChains",
      apiKey: "sk_12345678",
      session: "ss_12345678",
      values: {},
    });
    expect(publicInput.session).toBeUndefined();
  });

  test("captures issued sessions only from successful auth call results", () => {
    expect(sessionFromResult("auth.verifySiwe", { token: "ss_12345678" })).toBe("ss_12345678");
    expect(sessionFromResult("auth.loginEmail", { token: "ss_12345678" })).toBe("ss_12345678");
    expect(sessionFromResult("auth.registerEmail", { token: "ss_12345678" })).toBe("ss_12345678");
    expect(sessionFromResult("vaults.get", { token: "ss_12345678" })).toBeUndefined();
    expect(sessionFromResult("auth.verifySiwe", { token: "sk_12345678" })).toBeUndefined();
  });

  test("executes only the selected read using the supplied client", async () => {
    const listChains = async (input: { limit?: number }) => ({ items: [{ id: input.limit }] });
    const client = { catalog: { listChains } } as Parameters<typeof runPlaygroundCall>[0];
    const input = parsePlaygroundInput({
      call: "catalog.listChains",
      apiKey: "sk_12345678",
      values: { limit: "2" },
    });
    expect(await runPlaygroundCall(client, input.call, input.values, input.session)).toEqual({
      items: [{ id: 2 }],
    });
    expect(input.apiKey).toBe("sk_12345678");
  });

  test("renders copyable example immediately, without embedding the entered key", () => {
    const call = PLAYGROUND_CALLS.find((item) => item.id === "vaults.get");
    if (call === undefined) throw new Error("Missing vaults.get");
    const code = playgroundExample(call, {
      chainId: "4663",
      address: "0x1111111111111111111111111111111111111111",
    });
    expect(code).toContain("client.vaults.get(");
    expect(code).toContain(`"0x1111111111111111111111111111111111111111" as \`0x\${string}\``);
    expect(code).toContain("process.env.T3TRIS_API_KEY");
    expect(code).not.toContain("sk_12345678");
    const html = renderToStaticMarkup(<CodePanel title="TypeScript example" code={code} />);
    expect(html).toContain("Copy TypeScript example");
    expect(html).toContain("text-violet-400");
  });

  test("renders highlighted plain JSON without a collapsing tree", () => {
    const html = renderToStaticMarkup(<ResponsePanel response={{ items: [1, true, "vault"] }} />);
    expect(html).toContain("text-emerald-400");
    expect(html).toContain("text-violet-400");
    expect(html).not.toContain("<details");
  });
});
