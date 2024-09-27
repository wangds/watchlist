import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    checker({
      eslint: {
        lintCommand: "eslint .",
        useFlatConfig: true,
      },
      typescript: {
        buildMode: true,
      },
    }),
    react(),
  ],
});
