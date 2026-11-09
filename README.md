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

Install dependencies:

```sh
bun install
```

Create the local settings files:

```sh
cp .env.example .env.local
```

```sh
cp .dev.vars.example .dev.vars
```

Put the WorkOS **Staging** API key in `.dev.vars`. Forks should use their own
WorkOS, Cloudflare, and EAS projects.

Run the API (applies D1 migrations locally, then starts `wrangler dev` on
port 8787):

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

The Android emulator reaches the local API through `adb reverse tcp:8787 tcp:8787`.

The web app needs the API on the same origin, so build it and serve both from
the Worker at http://localhost:8787:

```sh
bun run dev:web
```

Run the API tests:

```sh
bun run test:api
```

## Deploying

`bun run deploy` builds the web app, applies D1 migrations to production, and
deploys the Worker. The production WorkOS API key is a Worker secret:

```sh
bunx wrangler secret put WORKOS_API_KEY
```

## License

MIT
