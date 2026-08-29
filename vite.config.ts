/// <reference types="vitest/config" />

import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const isGithubPages = mode === "github";

  return {
    base: isGithubPages ? "./" : "/",

    plugins: [
      vue(),
      tailwindcss(),

      {
        name: "github-pages-nojekyll",
        closeBundle() {
          if (!isGithubPages) return;

          const nojekyllPath = path.resolve(__dirname, "docs/.nojekyll");
          fs.writeFileSync(nojekyllPath, "");
        },
      },
    ],

    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        vue: "vue/dist/vue.esm-bundler.js",
      },
    },

    build: {
      outDir: isGithubPages ? "docs" : "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("echarts") || id.includes("zrender")) {
                return "echarts-vendor";
              }

              if (id.includes("@supabase")) {
                return "supabase-vendor";
              }

              return "vendor";
            }
          },
        },
      },
    },

    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
    },
  };
});
