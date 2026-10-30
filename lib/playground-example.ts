import type { PlaygroundCall } from "./playground-calls";

type Values = Readonly<Record<string, string>>;
const text = (values: Values, key: string) => values[key]?.trim() || undefined;
const integer = (values: Values, key: string) => {
  const raw = text(values, key);
  return raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
};
const csv = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const page = (values: Values) => ({
  limit: integer(values, "limit"),
  cursor: text(values, "cursor"),
});
const ref = (values: Values) => ({
  chainId: integer(values, "chainId") ?? 42161,
  address: text(values, "address") ?? "0x0000000000000000000000000000000000000000",
});
// JSON literals are valid TypeScript, but address fields need a template-literal
// address assertion to satisfy the public SDK's `0x${string}` parameter types.
const params = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(/"(0x[0-9a-fA-F]+)"/g, `"$1" as \`0x\${string}\``);
const sess = "{ session: process.env.T3TRIS_SESSION! }";

/** Copyable server-side SDK example; never embeds the key or session from this browser. */
export function playgroundExample(call: PlaygroundCall, values: Values): string {
  const id = call.id;
  let args = "";
  if (id === "catalog.listChains") args = params(page(values));
  else if (id === "catalog.listAssets")
    args = params({ chainId: integer(values, "chainId"), ...page(values) });
  else if (id === "vaults.list")
    args = params({
      chainIds: csv(text(values, "chainIds"))?.map(Number),
      assetAddress: text(values, "assetAddress"),
      curatorAddress: text(values, "curatorAddress"),
      kind: text(values, "kind"),
      verified: text(values, "verified") ? text(values, "verified") === "true" : undefined,
      search: text(values, "search"),
      sort: text(values, "sort"),
      direction: text(values, "direction"),
      ...page(values),
    });
  else if (id === "vaults.getMany")
    args = params(
      (csv(text(values, "refs")) ?? ["42161:0x0000000000000000000000000000000000000000"]).map(
        (entry) => {
          const [chainId, address] = entry.split(":");
          return { chainId: Number(chainId), address };
        },
      ),
    );
  else if (["vaults.get", "vaults.getComposition", "vaults.getGovernance"].includes(id))
    args = params(ref(values));
  else if (id === "vaults.listHistory")
    args = `${params(ref(values))}, ${params({ range: text(values, "range"), ...page(values) })}`;
  else if (id === "vaults.listActivity")
    args = `${params(ref(values))}, ${params({ categories: csv(text(values, "categories")), ...page(values) })}`;
  else if (id === "vaults.listAnnotations")
    args = `${params(ref(values))}, ${params(page(values))}`;
  else if (id === "vaults.updateMetadata")
    args = `${params(ref(values))}, ${params({
      displayName: text(values, "displayName"),
      description: text(values, "description"),
      curatorName: text(values, "curatorName"),
      curatorUrl: text(values, "curatorUrl"),
      visibility: text(values, "visibility"),
      category: text(values, "category"),
      showComposition: text(values, "showComposition")
        ? text(values, "showComposition") === "true"
        : undefined,
      compositionWallets: csv(text(values, "compositionWallets")),
      depositDisclaimer: text(values, "depositDisclaimer"),
      depositDisclaimerTrigger: text(values, "depositDisclaimerTrigger"),
    })}, ${sess}`;
  else if (["vaults.createAnnotation", "vaults.updateAnnotation"].includes(id)) {
    const annotation = params({
      ts: integer(values, "ts") ?? 0,
      title: text(values, "title") ?? "Title",
      body: text(values, "body"),
      txHash: text(values, "txHash"),
    });
    args =
      id === "vaults.updateAnnotation"
        ? `${params(ref(values))}, ${params(text(values, "annotationId") ?? "annotation-id")}, ${annotation}, ${sess}`
        : `${params(ref(values))}, ${annotation}, ${sess}`;
  } else if (id === "vaults.deleteAnnotation")
    args = `${params(ref(values))}, ${params(text(values, "annotationId") ?? "annotation-id")}, ${sess}`;
  else if (id.startsWith("accounts.")) {
    const identity = {
      address: text(values, "address") ?? "0x0000000000000000000000000000000000000000",
    };
    if (id === "accounts.portfolio" || id === "accounts.listFavorites") args = params(identity);
    else if (id === "accounts.setFavorite" || id === "accounts.deleteFavorite") {
      args = `${params({ ...identity, chainId: integer(values, "chainId") ?? 42161, vault: text(values, "vault") ?? "0x0000000000000000000000000000000000000000", ...(id === "accounts.setFavorite" ? { pinned: text(values, "pinned") === "true" } : {}) })}, ${sess}`;
    } else
      args = params({
        ...identity,
        ...(id === "accounts.listPositions" || id === "accounts.listActivity"
          ? { chainId: integer(values, "chainId") }
          : {}),
        ...(id === "accounts.listActivity" ? { categories: csv(text(values, "categories")) } : {}),
        ...page(values),
      });
  } else if (id === "events.list")
    args = params({
      after: integer(values, "after"),
      types: csv(text(values, "types")),
      ...page(values),
    });
  else if (id === "events.subscribe") {
    return `import { createT3trisClient } from "@t3tris/sdk";\n\nconst client = createT3trisClient({\n  apiKey: process.env.T3TRIS_API_KEY,\n});\n\n// Run on your backend; keep the key in server environment variables.\nfor await (const result of client.events.subscribe(${params({ since: integer(values, "since"), types: csv(text(values, "types")) })})) {\n  console.log(result);\n}`;
  } else if (id.startsWith("keys.") && !id.endsWith("listVaults"))
    args = params({
      address: text(values, "address") ?? "0x0000000000000000000000000000000000000000",
      chainId: integer(values, "chainId"),
    });
  else if (id === "auth.createSiweNonce")
    args = params({
      address: text(values, "address") ?? "0x0000000000000000000000000000000000000000",
      domain: text(values, "domain") ?? "example.com",
    });
  else if (id === "auth.verifySiwe")
    args = params({
      message: text(values, "message") ?? "<signed SIWE message>",
      signature: text(values, "signature") ?? "0x0000000000000000000000000000000000000000",
    });
  else if (["auth.registerEmail", "auth.loginEmail"].includes(id))
    args = params({
      email: text(values, "email") ?? "you@example.com",
      password: text(values, "password") ?? "<password>",
    });
  else if (["auth.whoami", "auth.logout", "auth.logoutAll"].includes(id)) args = sess;
  return `import { createT3trisClient } from "@t3tris/sdk";\n\n// Run on your backend; keep the key in server environment variables.\nconst client = createT3trisClient({\n  apiKey: process.env.T3TRIS_API_KEY,\n});\n${call.session ? "// Set T3TRIS_SESSION to your own authenticated ss_ session.\n" : ""}\nconst result = await client.${id}(${args});\nconsole.log(result);`;
}
