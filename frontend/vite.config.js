import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly",
          },
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
      includeAssets: ["icons/*.svg"],
      manifest: {
        name: "Rolling Revenue — Your Money Tool",
        short_name: "Rolling Revenue",
        description: "Rolling Revenue — your all-in-one money tool with AI advisor, multi-currency tracking, and wealth goals",
        theme_color: "#c9a84c",
        background_color: "#0a0c10",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["finance", "productivity"],
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "/icons/maskable-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Add Expense",
            short_name: "Expense",
            description: "Quickly log a new expense",
            url: "/?tab=expenses",
            icons: [{ src: "/icons/icon.svg", sizes: "any" }],
          },
          {
            name: "Add Income",
            short_name: "Income",
            description: "Log new income",
            url: "/?tab=income",
            icons: [{ src: "/icons/icon.svg", sizes: "any" }],
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["rolling-revenue.com", "www.rolling-revenue.com", "api.rolling-revenue.com", "all"],
    proxy: {
      "/api": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
});
