import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// import netlifyPlugin from "@netlify/vite-plugin-react-router";  //for future

// see https://vitejs.dev/config/
export default defineConfig({
  plugins: [react() /*, netlifyPlugin()*/],
  server: {
    port: 3000,
  },
  preview: {
    port: 8080
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
});