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
})
