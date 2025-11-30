import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    outDir: 'dist'
  },
  publicDir: 'vite-public'
});
