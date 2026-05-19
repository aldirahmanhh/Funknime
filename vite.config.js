import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
  },
  preview: {
    historyApiFallback: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split heavy/shared deps into their own chunks so the home route
        // doesn't have to ship videojs and friends. Vite 8 (Rolldown) requires
        // the function form rather than the object form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@videojs/react')) return 'videojs';
          if (id.includes('react-router')) return 'react-vendor';
          if (
            id.includes('/react-dom/') ||
            id.endsWith('/react/index.js') ||
            id.includes('/react/cjs/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
})
