import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // No @vitejs/plugin-react: Next 16 bundles with Turbopack, and Vitest's
  // esbuild transform already handles the automatic JSX runtime. Adding the
  // plugin pulls in a second Vite major and breaks type resolution.
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    // Never hit the network from unit/integration tests.
    restoreMocks: true,
  },
});