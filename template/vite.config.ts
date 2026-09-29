import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { site } from "./src/site.ts";

// prerendered to static HTML and listed in the sitemap; everything else renders on demand
const marketingPages = ["/", "/privacy", "/terms"];

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 4300 },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        autoSubfolderIndex: false,
        crawlLinks: false,
      },
      pages: marketingPages.map((path) => ({ path })),
      sitemap: { enabled: true, host: site.url },
    }),
    react(),
  ],
});
