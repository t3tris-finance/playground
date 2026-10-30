import { expect, test } from "bun:test";
import { ONCHAIN_CALLS, onchainExample } from "../lib/onchain-calls";

test("redemption settlement accepts fullClaim and rejects deposit fee options", () => {
  const call = ONCHAIN_CALLS.find((entry) => entry.id === "vaults.settle");
  if (!call) throw new Error("Missing settlement call");
  const input = {
    chainId: 42161,
    vault: "0x1111111111111111111111111111111111111111",
    kind: "redemptions",
    fullClaim: true,
    unsafe: false,
    permit2Data: "0x",
  };
  const code = onchainExample(call, JSON.stringify(input));
  expect(code).toContain("fullClaim: true");
  expect(code).not.toContain("feeClaimType");
  expect(() => onchainExample(call, JSON.stringify({ ...input, feeClaimType: 0 }))).toThrow(
    "unknown field",
  );
});
