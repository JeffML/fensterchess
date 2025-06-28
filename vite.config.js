import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// see https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  preview: {
    port: 8080
  }
});