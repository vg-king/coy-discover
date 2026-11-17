import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    hookTimeout: 30_000,
    setupFiles: ["./src/lib/services/__tests__/setup.ts"],
    testTimeout: 30_000,
  },
});
