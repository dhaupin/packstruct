import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Separate vendor chunk for better caching. vite 8 is rolldown-based:
        // manualChunks must be a FUNCTION (the object form vite <=7 accepted is
        // rejected), and minify defaults to oxc (esbuild is unbundled).
        manualChunks(id) {
          if (id.replace(/\\/g, '/').includes('node_modules/react')) return 'vendor'
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
