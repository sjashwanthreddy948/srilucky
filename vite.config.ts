import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "production-metadata",
      transformIndexHtml(html) {
        const configured =
          process.env.SITE_URL ||
          (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
            : "");
        if (!configured) return html;
        const origin = new URL(configured).origin;
        return {
          html,
          tags: [
            {
              tag: "link",
              attrs: { rel: "canonical", href: origin },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:url", content: origin },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: {
                property: "og:image",
                content: origin + "/hero-portrait.webp",
              },
              injectTo: "head",
            },
          ],
        };
      },
    },
  ],
  server: { host: "0.0.0.0", proxy: { "/api": "http://localhost:3001" } },
  build: { chunkSizeWarningLimit: 650 },
});
