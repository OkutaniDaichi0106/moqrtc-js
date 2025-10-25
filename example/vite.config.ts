import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    fs: {
      // Allow serving files from parent directory
      allow: ['..']
    }
  },
});
