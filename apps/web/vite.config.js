import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
  exclude: ['@decant/core', '@decant/firebase-client']
},
  plugins: [react()],
})
