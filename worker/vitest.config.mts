import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      miniflare: {
        bindings: {
          APP_ORIGIN: "https://practice.test",
          TEST_MIGRATIONS: await readD1Migrations(`${root}/worker/migrations`),
          WORKOS_API_KEY: "sk_test_practice",
          WORKOS_CLIENT_ID: "client_test_practice",
        },
      },
      wrangler: { configPath: `${root}/wrangler.jsonc` },
    })),
  ],
  test: {
    include: ["worker/test/**/*.test.ts"],
    root,
    setupFiles: ["worker/test/setup.ts"],
  },
});
