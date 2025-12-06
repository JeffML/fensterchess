import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import netlify from "@netlify/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

// see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    netlify(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Fenster: Interactive Chess Opening Database",
        short_name: "Fenster",
        description:
          "Interactive chess opening database with links to Shredder, FICS, lichess, and TWIC",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "eco-json-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  preview: {
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Note: Test files are automatically excluded from build
    // Vite only bundles files imported from src/index.jsx (entry point)
    // The test/ directory is never imported, so it's naturally excluded
  },
  // Ensure test directory is not served during development
  publicDir: "public",
});
