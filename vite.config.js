import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    proxy: {
      '/api': {
        target: 'https://api.wingo4all.site/',
        changeOrigin: true,
      },
      '/dragon': {
        target: 'https://api.wingo4all.site/',
        changeOrigin: true,
      },
      '/dragon_results': {
        target: 'https://api.wingo4all.site/',
        changeOrigin: true,
      },
      '/dragon_bet': {
        target: 'https://api.wingo4all.site/',
        changeOrigin: true,
      },
      '/dragon-tiger': {
        target: 'https://api.wingo4all.site/',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://api.wingo4all.site/',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
