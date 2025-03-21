import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows access from network (useful for local testing)
    port: 5173,      // Default Vite port, matches your local setup
    open: false,     // Prevents auto-opening browser
    proxy: {         // Optional: Proxy API calls during local dev
      '/api': {
        target: 'http://localhost:8000', // Local FastAPI
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'build', // Matches Cloudflare Pages output directory
    sourcemap: true, // Useful for debugging
  },
});