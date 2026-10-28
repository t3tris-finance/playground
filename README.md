# T3tris Playground

A standalone Next.js demo for the [T3tris SDK](https://github.com/t3tris-finance/sdk).
Choose a call, enter its inputs, and inspect the JSON response alongside a copyable TypeScript example.

## Run locally

Requires **Node.js 22+**, **Bun 1.4+**, and GitHub SSH access to this repo and
[`t3tris-finance/sdk`](https://github.com/t3tris-finance/sdk). The SDK is not on npm yet;
this app installs it from GitHub at a pinned commit.

```sh
git clone git@github.com:t3tris-finance/playground.git
cd playground
bun install --frozen-lockfile
bun dev
```

Open **http://localhost:3000**, paste your customer `sk_…` API key, select
`catalog.listChains`, and click **Run call**. Obtain a customer key from your
[T3tris Curate](https://curate.t3tris.finance/premium) organisation. No database, Docker, or monorepo checkout is needed.

The app uses `https://api.t3tris.finance` by default. To use another API:

```sh
cp .env.example .env.local
# Edit T3TRIS_API_URL (API origin only, without /v1), then restart bun dev.
```

## Credentials and live data

- Calls go through the same-origin `/api/playground` server route using **your entered key**.
  There is no bundled or shared API key. Only run this app on a server you trust.
- Keys and sessions stay in page memory, are sent to that server per call, and are
  not saved to browser storage or included in generated example credentials.
- This is **not a sandbox**: writes affect the configured API and count towards
  your quota. Protected writes need your own `ss_…` session; login or SIWE verification
  fills it automatically. SIWE signing requires an injected wallet extension.
- Customer vault lists contain only vaults attached to that key. Key attach/detach
  calls require the `manage` scope. Live events require `stream`.

## Commands

```sh
bun run lint
bun run typecheck
bun test
bun run build
bun start              # serve the production build on :3000
```

The repo contains only the playground, its two local UI components, and tests.
SDK calls execute server-side; the browser imports only the SDK wallet helpers for SIWE signing.
