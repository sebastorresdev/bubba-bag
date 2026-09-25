import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4300,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5205',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
