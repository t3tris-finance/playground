import { describe, expect, test } from "bun:test";
import { createT3trisClient } from "@t3tris/sdk";
import { renderToStaticMarkup } from "react-dom/server";
import { OnchainPlayground } from "../components/onchain-playground";
import { inputJson, ONCHAIN_CALLS, onchainExample } from "../lib/onchain-calls";

describe("on-chain playground", () => {
  test("covers every wallet-mode SDK method exactly once", () => {
    const unavailable = async (): Promise<never> => {
      throw new Error("No IO during inventory");
    };
    const client = createT3trisClient({
      walletClient: {
        getChainId: unavailable,
        getAddresses: unavailable,
        sendTransaction: unavailable,
      },
      publicClient: { getChainId: unavailable, call: unavailable, getCode: unavailable },
    });
    const methods = Object.entries(client).flatMap(([namespace, entries]) =>
      Object.entries(entries).flatMap(([name, value]) =>
        typeof value === "function"
          ? [`${namespace}.${name}`]
          : Object.keys(value).map((read) => `${namespace}.${name}.${read}`),
      ),
    );
    expect(ONCHAIN_CALLS.map((call) => call.id).sort()).toEqual(methods.sort());
    expect(new Set(methods).size).toBe(104);
    for (const call of ONCHAIN_CALLS) {
      const code = onchainExample(call, inputJson(call.sample));
      expect(code).toContain(`client.${call.id}(`);
      expect(code).toContain('from "viem"');
      expect(code).not.toContain("apiKey");
      expect(code).not.toContain("Steps(");
      expect(code).not.toContain("switchChain(");
      expect(code).not.toContain("requestAddresses(");
      expect(call.write).toBe(
        !call.id.includes(".read.") &&
          !["tokens.balanceOf", "tokens.allowance", "permit2.allowance"].includes(call.id),
      );
    }
  });
  test("renders an inert read by default and requires an explicit connection", () => {
    const html = renderToStaticMarkup(<OnchainPlayground />);
    expect(html).toContain("Connect wallet");
    expect(html).toContain("vaults.read.asset");
    expect(html).not.toContain("Customer API key");
    expect(html).not.toContain("Submit transaction");
  });
  test("editable payload preserves bigint precision and rejects missing fields", () => {
    const call = ONCHAIN_CALLS.find((entry) => entry.id === "vaults.setNextEntryFee");
    if (!call) throw new Error("missing call");
    const input = {
      chainId: 42161,
      vault: "0x1111111111111111111111111111111111111111",
      wad: "1234567890123456789",
    };
    expect(onchainExample(call, JSON.stringify(input))).toContain("1234567890123456789n");
    expect(() => onchainExample(call, JSON.stringify({ ...input, wad: 0.01 }))).toThrow(
      "integer string",
    );
    expect(() => onchainExample(call, "{}")).toThrow();
    expect(() => onchainExample(call, JSON.stringify({ ...input, apiKey: "sk_no" }))).toThrow(
      "unknown field",
    );
  });
});
