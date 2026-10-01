import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Tests run against the pure logic modules (study engine, answer checking,
 * formatting) so they stay fast and do not need a browser or a database.
 *
 * This is a separate config from `vite.config.ts` on purpose: it does not load
 * the React Router Vite plugin, which is only needed to build the app.
 */
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
