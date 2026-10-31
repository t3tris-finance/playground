import { expect, test } from "bun:test";
import { inputJson, ONCHAIN_CALLS, onchainExample } from "../lib/onchain-calls";

test("creation supports both oracle variants, optional bounds and referral", () => {
  const call = ONCHAIN_CALLS.find((entry) => entry.id === "vaults.create");
  if (!call) throw new Error("Missing creation call");
  const sample = JSON.parse(inputJson(call.sample));
  const minimalSample = {
    ...sample,
    oracle: { safe: true, owner: sample.owner },
    config: { ...sample.config },
  };
  delete minimalSample.config.ipfsHash;
  const minimal = onchainExample(call, JSON.stringify(minimalSample));
  expect(minimal).toContain("safe: true");
  expect(minimal).not.toContain("maxDeviationUp");
  expect(minimal).not.toContain("safeOracle");
  expect(minimal).not.toContain("ipfsHash");
  const code = onchainExample(
    call,
    JSON.stringify({
      ...sample,
      oracle: { ...sample.oracle, maxDeviationUp: "10000000000000000" },
      deployment: { ...sample.deployment, referralCode: `0x${"22".repeat(32)}` },
    }),
  );
  expect(code).toContain("maxDeviationUp: 10000000000000000n");
  const existing = { ...sample, oracle: { address: sample.asset } };
  expect(onchainExample(call, JSON.stringify(existing))).toContain(`address: "${sample.asset}"`);
  expect(() =>
    onchainExample(
      call,
      JSON.stringify({ ...sample, oracle: { ...sample.oracle, address: sample.asset } }),
    ),
  ).toThrow("unknown field");
  expect(() =>
    onchainExample(
      call,
      JSON.stringify({ ...existing, oracle: { ...existing.oracle, maxDeviationDown: "1" } }),
    ),
  ).toThrow("unknown field");
});
