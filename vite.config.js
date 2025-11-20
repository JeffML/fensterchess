import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import netlify from "@netlify/vite-plugin"
// import netlifyPlugin from "@netlify/vite-plugin-react-router";  //for future

// see https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), netlify()],
  server: {
    port: 3000,
  },
  preview: {
    port: 8080
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Note: Test files are automatically excluded from build
    // Vite only bundles files imported from src/index.jsx (entry point)
    // The test/ directory is never imported, so it's naturally excluded
  },
  // Ensure test directory is not served during development
  publicDir: 'public',
});