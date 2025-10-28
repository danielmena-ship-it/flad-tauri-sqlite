import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    maxHeaderSize: 16384, // Fix Error 431: Increase from 8KB to 16KB
    watch: {
      ignored: ['**/src-tauri/**']
    }
  }
});