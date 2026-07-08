import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" makes the build work on GitHub Pages under any repository name
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.js",
    css: false,
  },
});
