# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Diagnose setup**: `bun x ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `bun x ultracite fix` before committing to ensure compliance.

---

## Release Process (App Store)

Releases are built and uploaded locally with Xcode. Expo's hosted services (EAS Build, Submit, Metadata) are not used; don't add them back.

### Release flow

1. **Pre-flight**
   - Working tree clean, and these pass: `bun x ultracite check`, `bun x tsc --noEmit`, `bun run test:api`, and the local end-to-end check (see "Local verification for AI agents").
   - Bump `version` in `app.config.ts` and mirror it in `package.json#version`.
   - Bump `ios.buildNumber` in `app.config.ts`. It must be higher than every build already uploaded (App Store Connect > TestFlight).

2. **Commit and push**
   - Commit the release changes in one commit and push to `main` (house style). This also deploys the backend.

3. **Build and upload**
   - `bun run release:ios` (runs `scripts/release-ios.sh`): clean prebuild, `xcodebuild archive`, then export with `release/ExportOptions.plist`, which uploads straight to App Store Connect.
   - Uses the Apple account signed in to Xcode (team `LW385M78LW`) with automatic signing. Takes about 10 minutes.
   - `EXPO_NO_DOTENV=1` is set so `.env.local` (the localhost API) is never baked in; store builds use the production API.

4. **App Store Connect** (by hand, in the browser)
   - Create the new iOS version, attach the uploaded build once it finishes processing, and fill in "What's New".
   - Update the description, keywords or App Privacy answers if the app's behavior changed.
   - Submit for review. "Automatically release" is on, so it goes live after approval.

### Gotchas

- Promotional text has a 170 character max, description 4000, keywords 100 (comma-separated), subtitle 30.
- `ITSAppUsesNonExemptEncryption: false` is declared in `app.config.ts`, so there is no export compliance prompt.
- App Privacy must match reality: the app collects email, name, user ID and habit data, linked to the user, not used for tracking.
- Reviewers sign in with their own Apple or Google account; account deletion lives in the home screen's account menu.
- Support URL should be https://praveenjuge.com/practice/support/ (2.0.0 still points at the privacy page; change it on the next version).

## Release Process (Google Play)

1. Bump `version` like for iOS, and `android.versionCode` in `app.config.ts` (every upload needs a higher one).
2. `bun run release:android` (runs `scripts/release-android.sh`): clean prebuild, then `./gradlew bundleRelease` signed with the upload key. Output: `android/app/build/outputs/bundle/release/app-release.aab`.
   - The upload key is `~/Downloads/Sensitive - keep local/practice-upload.jks`; its settings are `PRACTICE_UPLOAD_*` in `~/.gradle/gradle.properties`. Never commit either. Play App Signing holds the real signing key.
3. Upload the AAB in Play Console (Practice: Habit Tracker) to the track you need, fill in release notes, and roll out.
- The account is a personal developer account: a new app needs a closed test with at least 12 testers opted in for 14 days before production access.

### Versioning convention

- Patch (`1.1.0` → `1.1.1`): bug fixes only, no user-visible behavior changes.
- Minor (`1.1.0` → `1.2.0`): user-facing feature additions.
- Major (`1.x.y` → `2.0.0`): breaking changes to data shape, D1 schema migrations that break older clients, or major UX overhauls.

## Backend

The backend is a Cloudflare Worker (`worker/`, Hono) with D1 (`migrations/`) and WorkOS AuthKit for auth.

- Keep logic on the server: validation, streaks and history are computed in `worker/`; the apps render what the API returns.
- Schema changes go in a new numbered file in `migrations/`; never edit an applied migration.
- Run `bun run test:api` after changing `worker/`. Tests run in the Workers runtime against a local D1.
- Local runs need no secrets: `bun run dev:auth` (WorkOS emulator, seeded users in `workos-emulate.config.yaml`) + `bun run dev:api`. See README "Local development".
- WorkOS project "Practice": Staging for optional real-auth testing, Production for the deployed Worker.
- Pushes to `main` deploy through Cloudflare Workers Builds.

## Local verification for AI agents

Verify changes against the real app running locally. Everything runs on this machine with no secrets: the API in `wrangler dev` with a local D1, and sign-in through the WorkOS emulator. Server configs are in `.claude/launch.json` (`auth`, `api`, `metro`), so `preview_start` can start them.

1. **Start the services** (keep them running):
   - `bun run dev:auth` - WorkOS emulator on :4100. Seeded users are in `workos-emulate.config.yaml`; sign in as `alex@example.com` (pick it under "Pick an account" on the emulator's login page).
   - `bun run dev:api` - applies local D1 migrations, then serves the API and the web build on :8787.
   - `bun run start` - Metro on :8081, for development builds.
2. **API**: `bun run test:api` (Workers runtime, local D1, no network). Inspect data with `bunx wrangler d1 execute practice --local --json --command "SELECT * FROM habits"`.
3. **Web**: open http://localhost:8787 (drive it with Aside). Rebuild after web changes with `bun run dev:web`.
4. **iOS**: boot a simulator, `bun run ios` for a dev build. The first sign-in shows the system "Wants to Use localhost to Sign In" prompt; tap Continue.
5. **Android**: boot an emulator, then
   - `adb reverse tcp:8787 tcp:8787 && adb reverse tcp:4100 tcp:4100 && adb reverse tcp:8081 tcp:8081`
   - skip Chrome's first-run screens (test devices only): `adb shell 'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line' && adb shell am set-debug-app --persistent com.android.chrome`
   - `bun run android`
   - Never accept Chrome or Google terms on a device to get past a screen.
6. **End-to-end (Maestro)**: build a Release app against the local stack once per app change (`bun run e2e:build:ios` or `bun run e2e:build:android`), then `bun run e2e`. The flow in `.maestro/habit-flow.yaml` signs in, adds, checks in, deletes and signs out, and cleans up after interrupted runs. Run Maestro with `JAVA_HOME` set to a JDK (e.g. `/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home`).
7. **Report** what you ran and what you saw (screens, API log lines, test output). A change isn't verified until it has run on the platforms it touches.

Notes:
- The iOS Keychain keeps the session across reinstalls; the Maestro flow signs out first if needed.
- Release builds read `.env.local` (`EXPO_PUBLIC_API_URL=http://localhost:8787`); only `bun run release:ios` builds for production.
- To test real Apple/Google sign-in instead of the emulator, follow the comments in `.dev.vars.example` (WorkOS Staging).
