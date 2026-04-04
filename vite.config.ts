import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        float: path.resolve(__dirname, 'float.html'),
        panel: path.resolve(__dirname, 'panel.html'),
        cover: path.resolve(__dirname, 'cover.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          store: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: ws: wss:; connect-src 'self' http: https: ws: wss:; img-src 'self' data: http: https:; style-src 'self' 'unsafe-inline' http: https:;",
    },
  },
});
