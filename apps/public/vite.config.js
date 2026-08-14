import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Puerto fijo por app: separa public (5173) de sealed (5174) en dev, sin host-detection.
  server: { port: 5173, strictPort: true },
  optimizeDeps: {
    exclude: ['@decant/core', '@decant/firebase-client', '@decant/ui'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  plugins: [react()],
  build: {
  chunkSizeWarningLimit: 700,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('firebase')) return 'firebase-vendor';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor';
        }
      },
    },
  },
},
})
