import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "node", environment: "node", include: ["test/*.test.ts"] },
      },
      {
        extends: true,
        plugins: [
          cloudflareTest(async () => ({
            main: "./test/worker/entry.ts",
            wrangler: { configPath: "./wrangler.jsonc" },
            miniflare: {
              bindings: {
                BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
                STRIPE_SECRET_KEY: "sk_test_x",
                STRIPE_WEBHOOK_SECRET: "whsec_test_x",
                TEST_MIGRATIONS: await readD1Migrations(
                  fileURLToPath(new URL("./migrations", import.meta.url)),
                ),
              },
            },
          })),
        ],
        test: {
          name: "workers",
          include: ["test/worker/*.test.ts"],
          setupFiles: ["./test/worker/apply-migrations.ts"],
        },
      },
    ],
  },
});
