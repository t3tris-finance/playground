# T3tris SDK Playground

Explore API and on-chain methods, edit their inputs, and copy ready-to-use TypeScript examples.

Uses SDK 0.4.0. Both modes use `createT3trisClient` from `@t3tris/sdk`.
Optional protocol and provider helpers come from `@t3tris/sdk/onchain`.

## Quick start

Requires [Bun 1.4+](https://bun.sh), Node.js 22+ and Git.

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

[SDK documentation](https://github.com/t3tris-finance/sdk#readme) ·
[Report an issue](https://github.com/t3tris-finance/playground/issues)
