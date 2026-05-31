import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Required for Docker — binds to all interfaces
    proxy: {
      // In dev, proxy /graphql to the api-gateway container.
      // This avoids CORS issues during local development.
      '/graphql': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
