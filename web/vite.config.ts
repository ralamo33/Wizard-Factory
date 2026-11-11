import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const port = Number(process.env["WEB_PORT"] ?? "8080");
const apiPort = process.env["API_PORT"] ?? "3000";

export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  envDir: "..",
  // The root .env also holds server secrets (CLERK_SECRET_KEY, CLERK_JWT_KEY, DATABASE_URL), so never widen this to "CLERK_".
  envPrefix: ["VITE_", "CLERK_PUBLISHABLE_"],
  build: {
    chunkSizeWarningLimit: 5000,
  },
  preview: {
    port,
    strictPort: true,
  },
  server: {
    port,
    strictPort: true,
    proxy: {
      "/trpc": {
        target: `http://localhost:${apiPort}`,
        rewrite: (path) => path.replace(/^\/trpc/, ""),
      },
    },
  },
});
