import { defineConfig } from "vite";

// Relative base so the build works from any path (GitHub Pages project site, a sub-path, or a root domain).
export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 700 },
});
