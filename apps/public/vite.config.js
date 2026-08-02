import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: { port: 5173, strictPort: true },
  optimizeDeps: {
  exclude: ['@decant/core', '@decant/firebase-client', '@decant/ui']
},
resolve: {
  dedupe: ['react', 'react-dom', 'react-router-dom']
},
  plugins: [react()],
})
