import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Ensure Vite serves on all interfaces
    port: 5173,      // Or whatever port your React app runs on
    open: false,     // Prevent Vite from automatically opening the browser
  },
});
