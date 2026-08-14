import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Puerto fijo por app: separa sealed (5174) de public (5173) en dev, sin host-detection.
  server: { port: 5174, strictPort: true },
  optimizeDeps: {
    exclude: ['@decant/core', '@decant/firebase-client', '@decant/ui'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
    '@': path.resolve(__dirname, './src'),
  }
  },
  plugins: [react()],
  build: {
  chunkSizeWarningLimit: 700,
  rollupOptions: {
    output: {
      manualChunks(id) {
        // id es la ruta del módulo. Agrupamos por librería.
        if (id.includes('node_modules')) {
          if (id.includes('firebase')) return 'firebase-vendor';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor';
        }
      },
    },
  },
},
})
