# T3tris SDK Playground

Explore API and on-chain methods, edit their inputs, and copy ready-to-use TypeScript examples.

Uses [`@t3tris-labs/sdk@0.8.1`](https://www.npmjs.com/package/@t3tris-labs/sdk/v/0.8.1) from npm, pinned in `package.json` and `bun.lock`.
API `/v0` and SDK `0.x` are unstable: breaking changes may occur before `/v1`
and SDK `1.0.0`. Pinning the SDK does not freeze the API server.
Both modes use `createT3trisClient` from `@t3tris-labs/sdk`.
Optional protocol and provider helpers come from `@t3tris-labs/sdk/onchain`.

## Quick start

Requires [Bun 1.4+](https://bun.sh), Node.js 22+ and Git to clone this playground.
`.nvmrc` selects Node.js 22, the minimum supported runtime for both the app and SDK.
The SDK itself installs from npm and does not require Git.

```sh
git clone https://github.com/t3tris-finance/playground.git
cd playground
bun install --frozen-lockfile
bun dev
```

Open **http://localhost:3000**.

## API

Enter a customer API key from [T3tris Curate](https://curate.t3tris.finance/premium),
select a method and click **Run call**. Start with `catalog.listChains`.
Protected writes also require a session token. Vault queries return the vaults attached to your key.

API requests run through the playground server. Credentials are held in page memory
and are not saved in browser storage. Use only a server you trust.

## On-chain

Select a method to view its payload and viem example. To execute it, connect a
wallet extension, select the correct network in your wallet and enter the target
addresses. Amounts use raw token units, represented as integer strings in the editor.

Each write submits one transaction. Network switching, token approvals and Permit2
signatures are separate, explicit operations. A `submitted` result is not a mining
confirmation. A `proposed` result must be executed through the contract wallet.

**Calls use live data. Transactions spend real gas and may move funds or change permissions.**
Review the payload before confirming a write.

## Production build

```sh
bun run build
bun start
```

## Dependency maintenance

Direct dependencies are used by application code, CSS, configuration or tests. In particular,
`tw-animate-css` powers the select animations, and the TypeScript compiler validates every
copyable example. TypeScript stays on 6.0.x because the test uses its compiler API; moving to
TypeScript 7 requires migrating that API, not just changing the version range.

```sh
bun run lint
bun run typecheck
bun test
bun run build
```

[SDK documentation](https://docs.t3tris.finance/developers/overview) ·
[Report an issue](https://github.com/t3tris-finance/playground/issues)
