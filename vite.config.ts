import { build } from "esbuild";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

function serviceWorkerPlugin(): Plugin {
  return {
    name: "routine-service-worker",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/sw.js") {
          next();
          return;
        }
        const result = await build({
          entryPoints: ["src/sw.ts"],
          bundle: true,
          format: "iife",
          platform: "browser",
          target: "es2022",
          write: false,
        });
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(result.outputFiles[0]?.text ?? "");
      });
    },
    async closeBundle() {
      await build({
        entryPoints: ["src/sw.ts"],
        bundle: true,
        format: "iife",
        platform: "browser",
        target: "es2022",
        outfile: "dist/sw.js",
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
