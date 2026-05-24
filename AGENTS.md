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

This project ships to the App Store via EAS. Release config lives in `eas.json`, `app.json`, and `store.config.json`.

### Release flow

1. **Pre-flight**
   - Ensure the working tree is clean and tests/lint pass: `bun x ultracite check` and `bun x tsc --noEmit`.
   - Bump `expo.version` in `app.json` and mirror the same value in `package.json#version`.
   - Update `apple.version` in `store.config.json` to match.
   - Update `apple.info.en-US.releaseNotes` in `store.config.json` with the changelog for this version.

2. **Commit and push**
   - Commit all release changes (code, version bumps, metadata) in a single commit.
   - Pushing directly to `main` is the house style for this repo.

3. **Metadata push**
   - `bun run metadata:push` (alias for `bun x eas metadata:push`).
   - Prompts interactively for Apple ID login on first run per session. Cached afterwards.

4. **Local build**
   - `bun run build:local` (alias for `eas build --platform ios --local`).
   - Requires working Xcode + signing credentials. Takes 10 to 20 minutes.
   - Must be online because EAS assigns the build number remotely (`appVersionSource: remote` + `autoIncrement: true`).
   - **The build will prompt: `Do you want to log in to your Apple account? (Y/n)`.** This is optional — EAS already has remote iOS credentials cached. Answer `n` to skip the Apple login and let the build proceed non-interactively. Pipe the answer in: `printf 'n\n' | bun run build:local`.

5. **Submit**
   - `bun run build:submit` (alias for `eas submit --platform ios`).
   - Uploads the local `.ipa` to App Store Connect.

6. **Release**
   - `automaticRelease: true` is set in `store.config.json`, so the version auto-releases after Apple approves review. No manual release step needed.

### Gotchas

- `promoText` in `store.config.json` has a **170 character max**. `metadata:push` will fail validation otherwise.
- `description` has a 4000 character max, `keywords` must be a comma-joined string under 100 characters when serialized, `subtitle` is 30 characters max.
- `buildNumber` in `ios/` is managed by EAS. Do not edit it manually.
- `ITSAppUsesNonExemptEncryption: false` is already declared in `app.json`, so no export compliance prompt at submit time.
- iCloud container (`iCloud.com.praveenjuge.practice`) is set to `Production`. It must exist and be enabled on the App ID in the Apple Developer account.
- Apple ID auth prompts are interactive. If automating, set up an App Store Connect API key and export `ASC_API_KEY_*` env vars.

### Versioning convention

- Patch (`1.1.0` → `1.1.1`): bug fixes only, no user-visible behavior changes.
- Minor (`1.1.0` → `1.2.0`): user-facing feature additions.
- Major (`1.x.y` → `2.0.0`): breaking changes to data shape, iCloud schema migrations, or major UX overhauls.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
