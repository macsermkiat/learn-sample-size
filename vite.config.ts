import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Base path is driven by ONE env var so the same build works on any host.
// Local dev / preview: "/". GitHub Pages project site: "/learn-sample-size/".
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      include: ["src/engine/**", "src/charts/geometry.ts"],
      reporter: ["text", "html"],
    },
  },
});
