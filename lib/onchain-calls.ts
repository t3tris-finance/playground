import type { Address, T3trisWalletClient } from "@t3tris/sdk";
import type { Hex } from "viem";

const address = "0x1111111111111111111111111111111111111111" as Address;
const bytes32 = `0x${"00".repeat(32)}` as Hex;
const vault = { chainId: 42161, vault: address };
const oracle = { chainId: 42161, oracle: address };
const role = { ...vault, role: bytes32 };
const oracleRole = { ...oracle, role: bytes32, account: address };
const token = { chainId: 42161, token: address, owner: address, spender: address };

export interface OnchainCall {
  id: string;
  write: boolean;
  sample: unknown;
  run(client: T3trisWalletClient, json: string): Promise<unknown>;
}

/** Match editable JSON to the example's structure; raw integer amounts are decimal strings. */
function parseLike(value: unknown, template: unknown, path = "input"): unknown {
  const field = path.split(".").at(-1);
  if (field === "kind" && !["both", "deposits", "redemptions"].includes(String(value)))
    throw new Error(`${path}: choose both, deposits or redemptions.`);
  if (field === "op" && value !== "grant" && value !== "revoke")
    throw new Error(`${path}: choose grant or revoke.`);
  if (field === "feeClaimType" && value !== 0 && value !== 1 && value !== 2)
    throw new Error(`${path}: choose 0, 1 or 2.`);
  if (typeof template === "bigint") {
    if (typeof value !== "string" || !/^\d+$/.test(value))
      throw new Error(`${path}: use a non-negative integer string.`);
    return BigInt(value);
  }
  if (typeof template === "number") {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
      throw new Error(`${path}: use a non-negative integer.`);
    return value;
  }
  if (typeof template === "string" || typeof template === "boolean") {
    if (typeof value !== typeof template) throw new Error(`${path}: expected ${typeof template}.`);
    if (
      typeof template === "string" &&
      template.startsWith("0x") &&
      (typeof value !== "string" || !/^0x[\da-f]*$/i.test(value) || value.length % 2 !== 0)
    )
      throw new Error(`${path}: invalid hex value.`);
    if (
      typeof template === "string" &&
      template.length === 42 &&
      template.startsWith("0x") &&
      String(value).length !== 42
    )
      throw new Error(`${path}: expected a full address.`);
    if (
      typeof template === "string" &&
      template.startsWith("0x") &&
      template.length === 66 &&
      String(value).length !== 66
    )
      throw new Error(`${path}: expected 32 bytes.`);
    return value;
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length === 0 || value.length > 100)
      throw new Error(`${path}: use 1–100 entries.`);
    return value.map((item, index) => parseLike(item, template[0], `${path}[${index}]`));
  }
  if (typeof template === "object" && template !== null) {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      throw new Error(`${path}: expected an object.`);
    const source = value as Record<string, unknown>;
    const shape = template as Record<string, unknown>;
    if (Object.keys(source).some((key) => !(key in shape)))
      throw new Error(`${path}: unknown field.`);
    return Object.fromEntries(
      Object.entries(shape).map(([key, child]) => [
        key,
        parseLike(source[key], child, `${path}.${key}`),
      ]),
    );
  }
  throw new Error(`${path}: unsupported input.`);
}

function call<T>(
  id: string,
  write: boolean,
  sample: T,
  invoke: (client: T3trisWalletClient, input: T) => Promise<unknown>,
): OnchainCall {
  return {
    id,
    write,
    sample,
    run: (client, json) => {
      // SAFETY: parseLike checks every field against the typed sample, including bigint conversion.
      const input = parseLike(JSON.parse(json), sample) as T;
      return invoke(client, input);
    },
  };
}

export const ONCHAIN_CALLS: readonly OnchainCall[] = [
  call(
    "vaults.create",
    true,
    {
      chainId: 42161,
      factory: address,
      salt: bytes32,
      oracle: address,
      safeOracle: {
        owner: address,
        maxDeviationUpWad: 10n ** 16n,
        maxDeviationDownWad: 10n ** 16n,
      },
      params: {
        shareName: "My Vault",
        shareSymbol: "mvUSDC",
        ipfsHash: "",
        underlyingAsset: address,
        oracle: address,
        vaultOwner: address,
        curator: address,
        feeRecipient: address,
        transferEnabled: true,
        depositEnabled: false,
        depositWhitelistEnabled: false,
        withdrawWhitelistEnabled: false,
        vaultOpened: false,
        globalFees: {
          entryFeeWad: 0n,
          exitFeeWad: 0n,
          managementFeeWad: 0n,
          performanceFeeWad: 0n,
          managementFeeDays: 365,
        },
      },
    },
    (c, i) => c.vaults.create(i),
  ),
  call(
    "vaults.deposit",
    true,
    { ...vault, amount: 1000000n, receiver: address, permit2Data: "0x" as Hex },
    (c, i) => c.vaults.deposit(i),
  ),
  call(
    "vaults.requestDeposit",
    true,
    { ...vault, amount: 1000000n, controller: address, permit2Data: "0x" as Hex },
    (c, i) => c.vaults.requestDeposit(i),
  ),
  call(
    "vaults.redeem",
    true,
    { ...vault, shares: 1000000n, receiver: address, owner: address },
    (c, i) => c.vaults.redeem(i),
  ),
  call(
    "vaults.requestRedeem",
    true,
    { ...vault, shares: 1000000n, controller: address, owner: address },
    (c, i) => c.vaults.requestRedeem(i),
  ),
  call(
    "vaults.decreaseDepositRequest",
    true,
    { ...vault, amount: 1000000n, receiver: address, minAmountOut: 990000n },
    (c, i) => c.vaults.decreaseDepositRequest(i),
  ),
  call(
    "vaults.decreaseRedeemRequest",
    true,
    { ...vault, shares: 1000000n, receiver: address, owner: address },
    (c, i) => c.vaults.decreaseRedeemRequest(i),
  ),
  call("vaults.claimDeposit", true, { ...vault, receiver: address }, (c, i) =>
    c.vaults.claimDeposit(i),
  ),
  call("vaults.claimRedeem", true, { ...vault, receiver: address, owner: address }, (c, i) =>
    c.vaults.claimRedeem(i),
  ),
  call(
    "vaults.settle",
    true,
    {
      ...vault,
      kind: "both" as const,
      feeClaimType: 0 as const,
      unsafe: false,
      permit2Data: "0x" as Hex,
    },
    (c, i) => c.vaults.settle(i),
  ),
  call("vaults.setNextManagementFee", true, { ...vault, wad: 10n ** 16n, days: 365 }, (c, i) =>
    c.vaults.setNextManagementFee(i),
  ),
  call("vaults.setNextPerformanceFee", true, { ...vault, wad: 10n ** 17n }, (c, i) =>
    c.vaults.setNextPerformanceFee(i),
  ),
  call("vaults.setNextEntryFee", true, { ...vault, wad: 10n ** 16n }, (c, i) =>
    c.vaults.setNextEntryFee(i),
  ),
  call("vaults.setNextExitFee", true, { ...vault, wad: 10n ** 16n }, (c, i) =>
    c.vaults.setNextExitFee(i),
  ),
  call(
    "vaults.claimFees",
    true,
    { ...vault, shares: 1000000n, unsafe: false, minAssetsOut: 0n, permit2Data: "0x" as Hex },
    (c, i) => c.vaults.claimFees(i),
  ),
  call("vaults.updateAccruedFees", true, vault, (c, i) => c.vaults.updateAccruedFees(i)),
  call(
    "vaults.updateSharesBatched",
    true,
    { ...vault, receivers: [address], values: [1000000n] },
    (c, i) => c.vaults.updateSharesBatched(i),
  ),
  call("vaults.setDepositEnabled", true, { ...vault, enabled: false }, (c, i) =>
    c.vaults.setDepositEnabled(i),
  ),
  call("vaults.setTransferEnabled", true, { ...vault, enabled: true }, (c, i) =>
    c.vaults.setTransferEnabled(i),
  ),
  call("vaults.pause", true, vault, (c, i) => c.vaults.pause(i)),
  call("vaults.unpause", true, vault, (c, i) => c.vaults.unpause(i)),
  call(
    "vaults.open",
    true,
    { ...vault, feeClaimType: 0 as const, unsafe: false, permit2Data: "0x" as Hex },
    (c, i) => c.vaults.open(i),
  ),
  call("vaults.close", true, { ...vault, unsafe: false, minAssetsOut: 0n }, (c, i) =>
    c.vaults.close(i),
  ),
  call(
    "vaults.enableEndOfFund",
    true,
    { ...vault, feeClaimType: 0 as const, unsafe: false, permit2Data: "0x" as Hex },
    (c, i) => c.vaults.enableEndOfFund(i),
  ),
  call(
    "vaults.disableEndOfFund",
    true,
    { ...vault, unsafe: false, closeVault: true, minAssetsOut: 0n },
    (c, i) => c.vaults.disableEndOfFund(i),
  ),
  call("vaults.setDepositWhitelistEnabled", true, { ...vault, enabled: true }, (c, i) =>
    c.vaults.setDepositWhitelistEnabled(i),
  ),
  call("vaults.setWithdrawWhitelistEnabled", true, { ...vault, enabled: true }, (c, i) =>
    c.vaults.setWithdrawWhitelistEnabled(i),
  ),
  call(
    "vaults.applyDepositWhitelist",
    true,
    { ...vault, addresses: [address], whitelisted: true },
    (c, i) => c.vaults.applyDepositWhitelist(i),
  ),
  call(
    "vaults.applyWithdrawWhitelist",
    true,
    { ...vault, addresses: [address], whitelisted: true },
    (c, i) => c.vaults.applyWithdrawWhitelist(i),
  ),
  call(
    "vaults.setShareNameAndSymbol",
    true,
    { ...vault, name: "My Vault", symbol: "mvUSDC" },
    (c, i) => c.vaults.setShareNameAndSymbol(i),
  ),
  call("vaults.setIpfsHash", true, { ...vault, hash: "ipfs://..." }, (c, i) =>
    c.vaults.setIpfsHash(i),
  ),
  call("vaults.setCurator", true, { ...vault, curator: address }, (c, i) => c.vaults.setCurator(i)),
  call("vaults.setFeeRecipient", true, { ...vault, feeRecipient: address }, (c, i) =>
    c.vaults.setFeeRecipient(i),
  ),
  call("vaults.setOracle", true, { ...vault, oracle: address }, (c, i) => c.vaults.setOracle(i)),
  call("vaults.setT3treasury", true, { ...vault, treasury: address }, (c, i) =>
    c.vaults.setT3treasury(i),
  ),
  call(
    "vaults.setSyncSilo",
    true,
    { ...vault, silo: address, unsafeOut: false, unsafeIn: false },
    (c, i) => c.vaults.setSyncSilo(i),
  ),
  call(
    "vaults.setDepositSilo",
    true,
    { ...vault, silo: address, unsafeOut: false, unsafeIn: false },
    (c, i) => c.vaults.setDepositSilo(i),
  ),
  call(
    "vaults.setRedeemSilo",
    true,
    { ...vault, silo: address, unsafeOut: false, unsafeIn: false },
    (c, i) => c.vaults.setRedeemSilo(i),
  ),
  call(
    "vaults.claimSilosPnl",
    true,
    { ...vault, sync: true, deposit: true, unsafe: false, redeemRequestId: 0n },
    (c, i) => c.vaults.claimSilosPnl(i),
  ),
  call("vaults.sweep", true, { ...vault, token: address }, (c, i) => c.vaults.sweep(i)),
  call("vaults.read.curator", false, vault, (c, i) => c.vaults.read.curator(i)),
  call("vaults.read.isOpen", false, vault, (c, i) => c.vaults.read.isOpen(i)),
  call("vaults.read.previewSettleAll", false, { ...vault, feeClaimType: 0 as const }, (c, i) =>
    c.vaults.read.previewSettleAll(i),
  ),
  call("vaults.read.previewSettleDeposits", false, { ...vault, feeClaimType: 0 as const }, (c, i) =>
    c.vaults.read.previewSettleDeposits(i),
  ),
  call("vaults.read.previewSettleRedemptions", false, { ...vault, fullClaim: false }, (c, i) =>
    c.vaults.read.previewSettleRedemptions(i),
  ),
  call("vaults.read.previewOpen", false, { ...vault, feeClaimType: 0 as const }, (c, i) =>
    c.vaults.read.previewOpen(i),
  ),
  call(
    "vaults.read.previewEnableEndOfFund",
    false,
    { ...vault, feeClaimType: 0 as const },
    (c, i) => c.vaults.read.previewEnableEndOfFund(i),
  ),
  call("vaults.read.previewCloseFund", false, vault, (c, i) => c.vaults.read.previewCloseFund(i)),
  call("vaults.read.previewClaimFees", false, { ...vault, shares: 1000000n }, (c, i) =>
    c.vaults.read.previewClaimFees(i),
  ),
  call("vaults.read.balanceOf", false, { ...vault, owner: address }, (c, i) =>
    c.vaults.read.balanceOf(i),
  ),
  call("vaults.read.nextEntryFee", false, vault, (c, i) => c.vaults.read.nextEntryFee(i)),
  call("vaults.read.nextExitFee", false, vault, (c, i) => c.vaults.read.nextExitFee(i)),
  call("vaults.read.nextPerformanceFee", false, vault, (c, i) =>
    c.vaults.read.nextPerformanceFee(i),
  ),
  call("vaults.read.nextManagementFee", false, vault, (c, i) => c.vaults.read.nextManagementFee(i)),
  call(
    "vaults.read.previewAddress",
    false,
    { chainId: 42161, factory: address, deployer: address, salt: bytes32 },
    (c, i) => c.vaults.read.previewAddress(i),
  ),
  call("vaults.read.asset", false, vault, (c, i) => c.vaults.read.asset(i)),
  call("vaults.read.totalSupply", false, vault, (c, i) => c.vaults.read.totalSupply(i)),
  call("vaults.read.maxDeposit", false, { ...vault, receiver: address }, (c, i) =>
    c.vaults.read.maxDeposit(i),
  ),
  call("vaults.read.maxRedeem", false, { ...vault, owner: address }, (c, i) =>
    c.vaults.read.maxRedeem(i),
  ),
  call("vaults.read.previewDeposit", false, { ...vault, amount: 1000000n }, (c, i) =>
    c.vaults.read.previewDeposit(i),
  ),
  call("vaults.read.previewRedeem", false, { ...vault, shares: 1000000n }, (c, i) =>
    c.vaults.read.previewRedeem(i),
  ),
  call("vaults.read.previewClaimDeposit", false, { ...vault, owner: address }, (c, i) =>
    c.vaults.read.previewClaimDeposit(i),
  ),
  call("roles.grant", true, { ...role, account: address }, (c, i) => c.roles.grant(i)),
  call("roles.revoke", true, { ...role, account: address }, (c, i) => c.roles.revoke(i)),
  call("roles.renounceRole", true, { ...role, account: address }, (c, i) =>
    c.roles.renounceRole(i),
  ),
  call("roles.grantAll", true, { ...vault, account: address, roles: [bytes32] }, (c, i) =>
    c.roles.grantAll(i),
  ),
  call(
    "roles.grantBatch",
    true,
    { ...vault, calls: [{ role: bytes32, account: address }] },
    (c, i) => c.roles.grantBatch(i),
  ),
  call(
    "roles.revokeBatch",
    true,
    { ...vault, calls: [{ role: bytes32, account: address }] },
    (c, i) => c.roles.revokeBatch(i),
  ),
  call("roles.initGrantAdminRole", true, { ...role, account: address }, (c, i) =>
    c.roles.initGrantAdminRole(i),
  ),
  call("roles.acceptAdminRole", true, role, (c, i) => c.roles.acceptAdminRole(i)),
  call("roles.cancelGrantAdminRole", true, role, (c, i) => c.roles.cancelGrantAdminRole(i)),
  call("roles.applyAdminBurn", true, role, (c, i) => c.roles.applyAdminBurn(i)),
  call("roles.read.has", false, { ...role, account: address }, (c, i) => c.roles.read.has(i)),
  call("roles.read.adminOf", false, role, (c, i) => c.roles.read.adminOf(i)),
  call("roles.read.memberCount", false, role, (c, i) => c.roles.read.memberCount(i)),
  call("roles.read.members", false, role, (c, i) => c.roles.read.members(i)),
  call("roles.read.defaultAdminRole", false, vault, (c, i) => c.roles.read.defaultAdminRole(i)),
  call("roles.read.nextDefaultAdminRecipient", false, vault, (c, i) =>
    c.roles.read.nextDefaultAdminRecipient(i),
  ),
  call("roles.read.nextGovernanceAdminRecipient", false, vault, (c, i) =>
    c.roles.read.nextGovernanceAdminRecipient(i),
  ),
  call("oracles.setTotalAssets", true, { ...oracle, totalAssets: 1000000n }, (c, i) =>
    c.oracles.setTotalAssets(i),
  ),
  call("oracles.setMaxPricePerShareDeviationUpWad", true, { ...oracle, wad: 10n ** 16n }, (c, i) =>
    c.oracles.setMaxPricePerShareDeviationUpWad(i),
  ),
  call(
    "oracles.setMaxPricePerShareDeviationDownWad",
    true,
    { ...oracle, wad: 10n ** 16n },
    (c, i) => c.oracles.setMaxPricePerShareDeviationDownWad(i),
  ),
  call("oracles.beginDefaultAdminTransfer", true, { ...oracle, newAdmin: address }, (c, i) =>
    c.oracles.beginDefaultAdminTransfer(i),
  ),
  call("oracles.acceptDefaultAdminTransfer", true, oracle, (c, i) =>
    c.oracles.acceptDefaultAdminTransfer(i),
  ),
  call("oracles.cancelDefaultAdminTransfer", true, oracle, (c, i) =>
    c.oracles.cancelDefaultAdminTransfer(i),
  ),
  call("oracles.changeDefaultAdminDelay", true, { ...oracle, newDelay: 86400 }, (c, i) =>
    c.oracles.changeDefaultAdminDelay(i),
  ),
  call("oracles.rollbackDefaultAdminDelay", true, oracle, (c, i) =>
    c.oracles.rollbackDefaultAdminDelay(i),
  ),
  call("oracles.grant", true, oracleRole, (c, i) => c.oracles.grant(i)),
  call("oracles.revoke", true, oracleRole, (c, i) => c.oracles.revoke(i)),
  call("oracles.renounce", true, oracleRole, (c, i) => c.oracles.renounce(i)),
  call(
    "oracles.applyRoles",
    true,
    { ...oracle, calls: [{ op: "grant" as const, role: bytes32, account: address }] },
    (c, i) => c.oracles.applyRoles(i),
  ),
  call("oracles.read.totalAssets", false, oracle, (c, i) => c.oracles.read.totalAssets(i)),
  call("oracles.read.maxDeviationUp", false, oracle, (c, i) => c.oracles.read.maxDeviationUp(i)),
  call("oracles.read.maxDeviationDown", false, oracle, (c, i) =>
    c.oracles.read.maxDeviationDown(i),
  ),
  call("oracles.read.admin", false, oracle, (c, i) => c.oracles.read.admin(i)),
  call("oracles.read.defaultAdminDelay", false, oracle, (c, i) =>
    c.oracles.read.defaultAdminDelay(i),
  ),
  call("oracles.read.pendingAdmin", false, oracle, (c, i) => c.oracles.read.pendingAdmin(i)),
  call("oracles.read.owner", false, oracle, (c, i) => c.oracles.read.owner(i)),
  call("oracles.read.has", false, oracleRole, (c, i) => c.oracles.read.has(i)),
  call("oracles.read.lastSavedPps", false, oracle, (c, i) => c.oracles.read.lastSavedPps(i)),
  call(
    "tokens.approve",
    true,
    { chainId: 42161, token: address, spender: address, amount: 1000000n },
    (c, i) => c.tokens.approve(i),
  ),
  call("tokens.balanceOf", false, { chainId: 42161, token: address, owner: address }, (c, i) =>
    c.tokens.balanceOf(i),
  ),
  call("tokens.allowance", false, token, (c, i) => c.tokens.allowance(i)),
  call("permit2.allowance", false, token, (c, i) => c.permit2.allowance(i)),
].sort((a, b) => a.id.localeCompare(b.id));

export function inputJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_, item: unknown) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function typescript(value: unknown, level = 0): string {
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "string")
    return JSON.stringify(value) + (value.startsWith("0x") ? ` as \`0x\${string}\`` : "");
  if (Array.isArray(value)) return `[${value.map((item) => typescript(item, level)).join(", ")}]`;
  if (value && typeof value === "object")
    return `{\n${Object.entries(value)
      .map(([key, item]) => `${"  ".repeat(level + 1)}${key}: ${typescript(item, level + 1)},`)
      .join("\n")}\n${"  ".repeat(level)}}`;
  return JSON.stringify(value);
}

export function onchainExample(call: OnchainCall, json: string): string {
  const input = parseLike(JSON.parse(json), call.sample);
  return `import { createT3trisClient } from "@t3tris/sdk";\nimport { createPublicClient, createWalletClient, custom } from "viem";\n\n// provider and account come from your app's existing wallet connection.\nconst transport = custom(provider);\nconst walletClient = createWalletClient({ account, transport });\nconst publicClient = createPublicClient({ transport });\nconst client = createT3trisClient({ walletClient, publicClient });\n\n// Select the correct network in your app before this call.\n${call.write ? "// Submit only this action. Approvals/permits must be prepared separately.\n" : ""}const result = await client.${call.id}(${typescript(input)});\n${call.write ? '\n// A submitted hash is not confirmation. Safe proposals execute in the wallet.\nif (result.status === "submitted") {\n  const receipt = await publicClient.waitForTransactionReceipt({ hash: result.hash });\n  if (receipt.status === "reverted") throw new Error("Transaction reverted");\n}\n' : ""}`;
}
