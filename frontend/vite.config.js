import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  base: '/',
  publicDir: resolve(__dirname, 'static'),
  resolve: {
    alias: {
      '$lib': resolve(__dirname, 'src/lib'),
      '/assets/jieba-wasm-html/jieba_rs_wasm.js': resolve(__dirname, '../public/assets/jieba-wasm-html/jieba_rs_wasm.js')
    }
  },
  plugins: [
    svelte({
      emitCss: false
    })
  ],
  build: {
    outDir: resolve(__dirname, '../public'),
    emptyOutDir: false,
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      external: ['/assets/jieba-wasm-html/jieba_rs_wasm.js'],
      input: resolve(__dirname, 'index.html'),
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'assets/js/app.js',
        chunkFileNames: 'assets/js/app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
