import { ApiError, type T3trisClient } from "@t3tris/sdk";
import type { Address } from "@t3tris/sdk/entities";

import type { PlaygroundCall } from "./playground-calls";

type Values = Readonly<Record<string, string>>;

class PlaygroundInputError extends Error {}

const optional = (values: Values, key: string): string | undefined => {
  const value = values[key]?.trim() ?? "";
  return value === "" ? undefined : value;
};

const required = (values: Values, key: string, label: string): string => {
  const value = optional(values, key);
  if (value === undefined) throw new PlaygroundInputError(`${label} is required.`);
  return value;
};

const numberValue = (
  values: Values,
  key: string,
  label: string,
  mode: "optional" | "required",
): number | undefined => {
  const raw = mode === "required" ? required(values, key, label) : optional(values, key);
  if (raw === undefined) return undefined;
  if (!/^-?[0-9]+$/.test(raw)) throw new PlaygroundInputError(`${label} must be an integer.`);
  return Number(raw);
};

const address = (values: Values, key: string, label: string): Address =>
  required(values, key, label) as Address;

const page = (values: Values) => ({
  limit: numberValue(values, "limit", "Limit", "optional"),
  cursor: optional(values, "cursor"),
});

const list = (value: string | undefined): string[] | undefined => {
  if (value === undefined) return undefined;
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
  return items.length === 0 ? undefined : items;
};

const booleanValue = (values: Values, key: string): boolean | undefined => {
  const value = optional(values, key);
  if (value === undefined) return undefined;
  return value === "true";
};

const ref = (values: Values) => ({
  chainId: numberValue(values, "chainId", "Chain ID", "required") as number,
  address: address(values, "address", "Vault address"),
});

const refs = (values: Values) => {
  const raw = required(values, "refs", "References");
  return raw.split(",").map((item) => {
    const [chain, vault] = item.trim().split(":");
    if (chain === undefined || vault === undefined || !/^[0-9]+$/.test(chain) || vault === "") {
      throw new PlaygroundInputError("References must use chainId:address, separated by commas.");
    }
    return { chainId: Number(chain), address: vault as Address };
  });
};

const metadata = (values: Values) => ({
  displayName: optional(values, "displayName"),
  description: optional(values, "description"),
  curatorName: optional(values, "curatorName"),
  curatorUrl: optional(values, "curatorUrl"),
  visibility: optional(values, "visibility") as "public" | "private" | undefined,
  category: optional(values, "category"),
  showComposition: booleanValue(values, "showComposition"),
  compositionWallets: list(optional(values, "compositionWallets")) as Address[] | undefined,
  depositDisclaimer: optional(values, "depositDisclaimer"),
  depositDisclaimerTrigger: optional(values, "depositDisclaimerTrigger") as
    | "once"
    | "every"
    | undefined,
});

const annotation = (values: Values) => ({
  ts: numberValue(values, "ts", "Timestamp", "required") as number,
  title: required(values, "title", "Title"),
  body: optional(values, "body"),
  txHash: optional(values, "txHash") as `0x${string}` | undefined,
});

const session = (value: string | undefined) => {
  const token = value?.trim() ?? "";
  if (token === "") throw new PlaygroundInputError("Session is required for this call.");
  return { session: token };
};

export async function runPlaygroundCall(
  client: T3trisClient,
  call: PlaygroundCall,
  values: Values,
  sessionToken: string | undefined,
): Promise<unknown> {
  const auth = call.session === true ? session(sessionToken) : undefined;
  switch (call.id) {
    case "catalog.listChains":
      return client.catalog.listChains(page(values));
    case "catalog.listAssets":
      return client.catalog.listAssets({
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
        ...page(values),
      });
    case "billing.getPricing":
      return client.billing.getPricing();
    case "vaults.list":
      return client.vaults.list({
        chainIds: list(optional(values, "chainIds"))?.map(Number),
        assetAddress: optional(values, "assetAddress") as Address | undefined,
        curatorAddress: optional(values, "curatorAddress") as Address | undefined,
        kind: optional(values, "kind") as "sync" | "async" | undefined,
        verified: booleanValue(values, "verified"),
        search: optional(values, "search"),
        sort: optional(values, "sort") as "tvl" | "newest" | "name" | undefined,
        direction: optional(values, "direction") as "asc" | "desc" | undefined,
        ...page(values),
      });
    case "vaults.get":
      return client.vaults.get(ref(values));
    case "vaults.getMany":
      return client.vaults.getMany(refs(values));
    case "vaults.listHistory":
      return client.vaults.listHistory(ref(values), {
        range: optional(values, "range") as "1d" | "1w" | "1m" | "3m" | "1y" | "all" | undefined,
        ...page(values),
      });
    case "vaults.getComposition":
      return client.vaults.getComposition(ref(values));
    case "vaults.listActivity":
      return client.vaults.listActivity(ref(values), {
        categories: list(optional(values, "categories")) as
          | readonly (
              | "deposit"
              | "redeem"
              | "valuation"
              | "settlement"
              | "roles"
              | "fees"
              | "config"
              | "transfer"
            )[]
          | undefined,
        ...page(values),
      });
    case "vaults.listAnnotations":
      return client.vaults.listAnnotations(ref(values), page(values));
    case "vaults.getGovernance":
      return client.vaults.getGovernance(ref(values));
    case "vaults.updateMetadata":
      return client.vaults.updateMetadata(
        ref(values),
        metadata(values),
        auth as { session: string },
      );
    case "vaults.createAnnotation":
      return client.vaults.createAnnotation(
        ref(values),
        annotation(values),
        auth as { session: string },
      );
    case "vaults.updateAnnotation":
      return client.vaults.updateAnnotation(
        ref(values),
        required(values, "annotationId", "Annotation ID"),
        annotation(values),
        auth as { session: string },
      );
    case "vaults.deleteAnnotation":
      return client.vaults.deleteAnnotation(
        ref(values),
        required(values, "annotationId", "Annotation ID"),
        auth as { session: string },
      );
    case "accounts.portfolio":
      return client.accounts.portfolio({ address: address(values, "address", "Account address") });
    case "accounts.listVaults":
      return client.accounts.listVaults({
        address: address(values, "address", "Account address"),
        ...page(values),
      });
    case "accounts.listPositions":
      return client.accounts.listPositions({
        address: address(values, "address", "Account address"),
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
        ...page(values),
      });
    case "accounts.listActivity":
      return client.accounts.listActivity({
        address: address(values, "address", "Account address"),
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
        categories: list(optional(values, "categories")) as
          | readonly (
              | "deposit"
              | "redeem"
              | "valuation"
              | "settlement"
              | "roles"
              | "fees"
              | "config"
              | "transfer"
            )[]
          | undefined,
        ...page(values),
      });
    case "accounts.listFavorites":
      return client.accounts.listFavorites({
        address: address(values, "address", "Account address"),
      });
    case "accounts.setFavorite":
      return client.accounts.setFavorite(
        {
          address: address(values, "address", "Account address"),
          chainId: numberValue(values, "chainId", "Chain ID", "required") as number,
          vault: address(values, "vault", "Vault address"),
          pinned: booleanValue(values, "pinned"),
        },
        auth as { session: string },
      );
    case "accounts.deleteFavorite":
      return client.accounts.deleteFavorite(
        {
          address: address(values, "address", "Account address"),
          chainId: numberValue(values, "chainId", "Chain ID", "required") as number,
          vault: address(values, "vault", "Vault address"),
        },
        auth as { session: string },
      );
    case "events.list":
      return client.events.list({
        after: numberValue(values, "after", "After sequence", "optional"),
        types: list(optional(values, "types")),
        ...page(values),
      });
    case "events.subscribe": {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const events = [];
      try {
        for await (const event of client.events.subscribe(
          {
            since: numberValue(values, "since", "Since sequence", "optional"),
            types: list(optional(values, "types")),
          },
          { signal: controller.signal },
        )) {
          events.push(event);
          if (events.length >= 20) break;
        }
      } finally {
        clearTimeout(timeout);
      }
      return events;
    }
    case "keys.attachVault":
      return client.keys.attachVault({
        address: address(values, "address", "Vault address"),
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
      });
    case "keys.detachVault":
      return client.keys.detachVault({
        address: address(values, "address", "Vault address"),
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
      });
    case "keys.listVaults":
      return client.keys.listVaults(page(values));
    case "keys.lookupVaults":
      return client.keys.lookupVaults({
        address: address(values, "address", "Vault address"),
        chainId: numberValue(values, "chainId", "Chain ID", "optional"),
      });
    case "billing.getUsage":
      return client.billing.getUsage();
    case "auth.createSiweNonce":
      return client.auth.createSiweNonce({
        address: address(values, "address", "Wallet address"),
        domain: required(values, "domain", "Domain"),
      });
    case "auth.verifySiwe":
      return client.auth.verifySiwe({
        message: required(values, "message", "SIWE message"),
        signature: required(values, "signature", "Signature") as `0x${string}`,
      });
    case "auth.registerEmail":
      return client.auth.registerEmail({
        email: required(values, "email", "Email"),
        password: required(values, "password", "Password"),
      });
    case "auth.loginEmail":
      return client.auth.loginEmail({
        email: required(values, "email", "Email"),
        password: required(values, "password", "Password"),
      });
    case "auth.whoami":
      return client.auth.whoami(auth as { session: string });
    case "auth.logout":
      return client.auth.logout(auth as { session: string });
    case "auth.logoutAll":
      return client.auth.logoutAll(auth as { session: string });
    default:
      throw new PlaygroundInputError("Unknown SDK call.");
  }
}

export function playgroundFailure(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  if (error instanceof PlaygroundInputError || error instanceof ApiError) {
    return {
      status: error instanceof ApiError ? error.status : 400,
      code: error instanceof ApiError ? error.code : "bad_request",
      message: error.message,
    };
  }
  return { status: 500, code: "internal", message: "The SDK call failed." };
}
