import { defineConfig, ViteDevServer } from "vite";
import checker from "vite-plugin-checker";
import react from "@vitejs/plugin-react";
import routes from "./server.ts";

// https://vitejs.dev/guide/api-plugin.html#configureserver
function expressPlugin() {
  return {
    name: "express-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(routes);
    },
  };
}

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
    expressPlugin(),
    react(),
  ],
});
