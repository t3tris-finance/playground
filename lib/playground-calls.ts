export type PlaygroundFieldKind = "text" | "number" | "boolean" | "select" | "json";

export interface PlaygroundField {
  key: string;
  label: string;
  kind: PlaygroundFieldKind;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: readonly string[];
}

export interface PlaygroundCall {
  id: string;
  namespace: string;
  method: string;
  description: string;
  session?: boolean;
  fields: readonly PlaygroundField[];
}

export const PLAYGROUND_CALLS: readonly PlaygroundCall[] = [
  {
    id: "catalog.listChains",
    namespace: "catalog",
    method: "listChains",
    description: "List supported chains.",
    fields: [
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "catalog.listAssets",
    namespace: "catalog",
    method: "listAssets",
    description: "List assets, optionally on one chain.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number" },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "billing.getPricing",
    namespace: "billing",
    method: "getPricing",
    description: "Read the public billing configuration.",
    fields: [],
  },
  {
    id: "vaults.list",
    namespace: "vaults",
    method: "list",
    description: "List the vaults visible to this key.",
    fields: [
      { key: "chainIds", label: "Chain IDs", kind: "text", placeholder: "42161, 4663" },
      { key: "assetAddress", label: "Asset address", kind: "text" },
      { key: "curatorAddress", label: "Curator address", kind: "text" },
      { key: "kind", label: "Kind", kind: "select", options: ["", "sync", "async"] },
      { key: "verified", label: "Verified", kind: "select", options: ["", "true", "false"] },
      { key: "search", label: "Search", kind: "text" },
      { key: "sort", label: "Sort", kind: "select", options: ["", "tvl", "newest", "name"] },
      { key: "direction", label: "Direction", kind: "select", options: ["", "asc", "desc"] },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "vaults.get",
    namespace: "vaults",
    method: "get",
    description: "Read one vault by chain and address.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
    ],
  },
  {
    id: "vaults.getMany",
    namespace: "vaults",
    method: "getMany",
    description: "Read up to 100 vaults by explicit references.",
    fields: [
      {
        key: "refs",
        label: "References",
        kind: "text",
        required: true,
        placeholder: "42161:0xabc…, 4663:0xdef…",
      },
    ],
  },
  {
    id: "vaults.listHistory",
    namespace: "vaults",
    method: "listHistory",
    description: "Read a vault's sampled valuation history.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      {
        key: "range",
        label: "Range",
        kind: "select",
        options: ["", "1d", "1w", "1m", "3m", "1y", "all"],
      },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "vaults.getComposition",
    namespace: "vaults",
    method: "getComposition",
    description: "Read a vault's composition.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
    ],
  },
  {
    id: "vaults.listActivity",
    namespace: "vaults",
    method: "listActivity",
    description: "Read a vault's activity.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "categories", label: "Categories", kind: "text", placeholder: "deposit, redeem" },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "vaults.listAnnotations",
    namespace: "vaults",
    method: "listAnnotations",
    description: "Read a vault's chart annotations.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "vaults.getGovernance",
    namespace: "vaults",
    method: "getGovernance",
    description: "Read a vault's roles, whitelist, and depositors.",
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
    ],
  },
  {
    id: "vaults.updateMetadata",
    namespace: "vaults",
    method: "updateMetadata",
    description: "Update curator metadata. Requires a session.",
    session: true,
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "displayName", label: "Display name", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "curatorName", label: "Curator name", kind: "text" },
      { key: "curatorUrl", label: "Curator URL", kind: "text" },
      {
        key: "visibility",
        label: "Visibility",
        kind: "select",
        options: ["", "public", "private"],
      },
      { key: "category", label: "Category", kind: "text" },
      {
        key: "showComposition",
        label: "Show composition",
        kind: "select",
        options: ["", "true", "false"],
      },
      { key: "compositionWallets", label: "Composition wallets", kind: "text" },
      { key: "depositDisclaimer", label: "Deposit disclaimer", kind: "text" },
      {
        key: "depositDisclaimerTrigger",
        label: "Disclaimer trigger",
        kind: "select",
        options: ["", "once", "every"],
      },
    ],
  },
  {
    id: "vaults.createAnnotation",
    namespace: "vaults",
    method: "createAnnotation",
    description: "Create a chart annotation. Requires a session.",
    session: true,
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "ts", label: "Timestamp (unix seconds)", kind: "number", required: true },
      { key: "title", label: "Title", kind: "text", required: true },
      { key: "body", label: "Body", kind: "text" },
      { key: "txHash", label: "Transaction hash", kind: "text" },
    ],
  },
  {
    id: "vaults.updateAnnotation",
    namespace: "vaults",
    method: "updateAnnotation",
    description: "Replace a chart annotation. Requires a session.",
    session: true,
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "annotationId", label: "Annotation ID", kind: "text", required: true },
      { key: "ts", label: "Timestamp (unix seconds)", kind: "number", required: true },
      { key: "title", label: "Title", kind: "text", required: true },
      { key: "body", label: "Body", kind: "text" },
      { key: "txHash", label: "Transaction hash", kind: "text" },
    ],
  },
  {
    id: "vaults.deleteAnnotation",
    namespace: "vaults",
    method: "deleteAnnotation",
    description: "Delete a chart annotation. Requires a session.",
    session: true,
    fields: [
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "annotationId", label: "Annotation ID", kind: "text", required: true },
    ],
  },
  {
    id: "accounts.portfolio",
    namespace: "accounts",
    method: "portfolio",
    description: "Read a wallet's positions and vault records.",
    fields: [{ key: "address", label: "Account address", kind: "text", required: true }],
  },
  {
    id: "accounts.listVaults",
    namespace: "accounts",
    method: "listVaults",
    description: "List vaults operated by an account.",
    fields: [
      { key: "address", label: "Account address", kind: "text", required: true },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "accounts.listPositions",
    namespace: "accounts",
    method: "listPositions",
    description: "List an account's positions.",
    fields: [
      { key: "address", label: "Account address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number" },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "accounts.listActivity",
    namespace: "accounts",
    method: "listActivity",
    description: "List an account's activity.",
    fields: [
      { key: "address", label: "Account address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number" },
      { key: "categories", label: "Categories", kind: "text" },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "accounts.listFavorites",
    namespace: "accounts",
    method: "listFavorites",
    description: "List an account's favorites.",
    fields: [{ key: "address", label: "Account address", kind: "text", required: true }],
  },
  {
    id: "accounts.setFavorite",
    namespace: "accounts",
    method: "setFavorite",
    description: "Pin or unpin a vault. Requires a session.",
    session: true,
    fields: [
      { key: "address", label: "Account address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "vault", label: "Vault address", kind: "text", required: true },
      { key: "pinned", label: "Pinned", kind: "select", options: ["", "true", "false"] },
    ],
  },
  {
    id: "accounts.deleteFavorite",
    namespace: "accounts",
    method: "deleteFavorite",
    description: "Remove a favorite. Requires a session.",
    session: true,
    fields: [
      { key: "address", label: "Account address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number", required: true },
      { key: "vault", label: "Vault address", kind: "text", required: true },
    ],
  },
  {
    id: "events.list",
    namespace: "events",
    method: "list",
    description: "Read the event outbox.",
    fields: [
      { key: "after", label: "After sequence", kind: "number" },
      { key: "types", label: "Types", kind: "text", placeholder: "vault.metadata.updated" },
      { key: "limit", label: "Limit", kind: "number" },
      { key: "cursor", label: "Cursor", kind: "text" },
    ],
  },
  {
    id: "events.subscribe",
    namespace: "events",
    method: "subscribe",
    description: "Collect live events for up to 10 seconds.",
    fields: [
      { key: "since", label: "Since sequence", kind: "number" },
      { key: "types", label: "Types", kind: "text" },
    ],
  },
  {
    id: "keys.attachVault",
    namespace: "keys",
    method: "attachVault",
    description: "Attach a vault to this key. Requires manage scope.",
    fields: [
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number" },
    ],
  },
  {
    id: "keys.detachVault",
    namespace: "keys",
    method: "detachVault",
    description: "Detach a vault from this key. Requires manage scope.",
    fields: [
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number" },
    ],
  },
  {
    id: "keys.listVaults",
    namespace: "keys",
    method: "listVaults",
    description: "Return all attached vaults as an array (no pagination).",
    fields: [],
  },
  {
    id: "keys.lookupVaults",
    namespace: "keys",
    method: "lookupVaults",
    description: "Look up vaults by address.",
    fields: [
      { key: "address", label: "Vault address", kind: "text", required: true },
      { key: "chainId", label: "Chain ID", kind: "number" },
    ],
  },
  {
    id: "billing.getUsage",
    namespace: "billing",
    method: "getUsage",
    description: "Read this key's usage and its organization quota.",
    fields: [],
  },
  {
    id: "auth.createSiweNonce",
    namespace: "auth",
    method: "createSiweNonce",
    description: "Create a SIWE nonce and message.",
    fields: [
      { key: "address", label: "Wallet address", kind: "text", required: true },
      { key: "domain", label: "Domain", kind: "text", required: true },
    ],
  },
  {
    id: "auth.verifySiwe",
    namespace: "auth",
    method: "verifySiwe",
    description: "Verify a signed SIWE message.",
    fields: [
      { key: "message", label: "SIWE message", kind: "text", required: true },
      { key: "signature", label: "Signature", kind: "text", required: true },
    ],
  },
  {
    id: "auth.registerEmail",
    namespace: "auth",
    method: "registerEmail",
    description: "Register an email account.",
    fields: [
      { key: "email", label: "Email", kind: "text", required: true },
      { key: "password", label: "Password", kind: "text", required: true },
    ],
  },
  {
    id: "auth.loginEmail",
    namespace: "auth",
    method: "loginEmail",
    description: "Log in with email.",
    fields: [
      { key: "email", label: "Email", kind: "text", required: true },
      { key: "password", label: "Password", kind: "text", required: true },
    ],
  },
  {
    id: "auth.whoami",
    namespace: "auth",
    method: "whoami",
    description: "Read the session's account and organizations.",
    session: true,
    fields: [],
  },
  {
    id: "auth.logout",
    namespace: "auth",
    method: "logout",
    description: "Revoke the supplied session.",
    session: true,
    fields: [],
  },
  {
    id: "auth.logoutAll",
    namespace: "auth",
    method: "logoutAll",
    description: "Revoke every session of this account, including sessions in other applications.",
    session: true,
    fields: [],
  },
];
