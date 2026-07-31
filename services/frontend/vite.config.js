import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',  // Required for Docker — listen on all interfaces
    proxy: {
      // Proxy /graphql to the api-gateway in development
      // This avoids CORS issues when running outside Docker
      '/graphql': {
        target: process.env.VITE_GRAPHQL_URL || 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  }
})
