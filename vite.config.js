import { defineConfig } from 'vite';
export default defineConfig({
  publicDir: false,
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false } },
  },
  build: { outDir: 'public', emptyOutDir: true },
  preview: { host: 'localhost' },
});
