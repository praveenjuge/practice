# Practice

Practice is a habit tracker built with Expo and React Native, with a
Cloudflare Worker backend (Hono + D1) and WorkOS AuthKit for sign-in. It ships
as a native iOS and Android app and a web app, with categorized habits, daily
check-ins, streaks, search, and habit history.

- Web: https://practice.praveenjuge.com
- App Store: https://apps.apple.com/app/id6756779057
- Support and privacy: https://praveenjuge.com/practice/privacy/

## How it fits together

- `worker/` is the API, served at `/api/*` by the same Worker that serves the
  web build. It talks to WorkOS (sign-in, refresh, sign-out, account
  deletion) and D1, and computes streaks and history so the apps only render.
- `migrations/` holds the D1 schema.
- `shared/` has the types and category list used by both sides.
- `components/session.ts` is the app's whole auth client: it opens AuthKit in
  the system sign-in sheet (PKCE), keeps the access token in memory and the
  refresh token in the Keychain/Keystore (an httpOnly cookie on web).

## Local development

Everything runs locally, with no cloud accounts or secrets: the API runs in
`wrangler dev` with a local D1 database, and sign-in goes through the
[WorkOS emulator](https://github.com/workos/emulate) instead of real WorkOS.

Install dependencies and create the local settings files:

```sh
bun install
```

```sh
cp .env.example .env.local
```

```sh
cp .dev.vars.example .dev.vars
```

Start the WorkOS emulator (port 4100). Sign in as any user seeded in
`workos-emulate.config.yaml`, such as `alex@example.com`:

```sh
bun run dev:auth
```

Start the API (applies D1 migrations locally, then serves the API and the web
build on port 8787):

```sh
bun run dev:api
```

Run the iOS or Android app against it:

```sh
bun run ios
```

```sh
bun run android
```

The Android emulator reaches the local services through `adb reverse`:

```sh
adb reverse tcp:8787 tcp:8787 && adb reverse tcp:4100 tcp:4100
```

The web app is served by the Worker at http://localhost:8787. Rebuild it after
web changes with `bun run dev:web`.

Run the API tests (Workers runtime, local D1, no network):

```sh
bun run test:api
```

To test against the real WorkOS Staging environment instead of the emulator,
follow the comments in `.dev.vars.example`.

## Deploying

Every push to `main` deploys automatically through Cloudflare Workers Builds
(D1 migrations, web build, then `wrangler deploy`). Other branches get preview
versions. `bun run deploy` does the same by hand. The production WorkOS API key is a Worker secret:

```sh
bunx wrangler secret put WORKOS_API_KEY
```

## License

MIT
