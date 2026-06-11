# Practice

Practice is a habit tracker built with Expo, React Native, Convex, and Clerk.
It ships as a native iOS app and a web app, with categorized habits, daily
check-ins, streaks, search, and habit history.

- Web: https://practice.praveenjuge.com
- App Store: https://apps.apple.com/app/id6756779057
- Support and privacy: https://praveenjuge.com/practice/privacy/

## Local development

Install dependencies:

```sh
bun install
```

Create a local environment file:

```sh
cp .env.example .env.local
```

Fill `.env.local` with your own Clerk and Convex values. This repository keeps
the production app identifiers in source, but forks should use their own Clerk,
Convex, EAS, and deployment projects.

Run Convex in one terminal:

```sh
bun run dev:convex
```

Run the app in another terminal:

```sh
bun run web
```

For iOS development:

```sh
bun run ios
```

## Notes

This repository is shared as the real source for Practice, not as a general
starter template. Issues are welcome and handled on a best-effort basis.

## License

MIT
