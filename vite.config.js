import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api-android': {
        target: 'https://ape-androids.isappcloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-android/, ''),
        secure: true
      },
      '/api-hutch': {
        target: 'https://ape-hutch.isappcloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-hutch/, ''),
        secure: true
      },
      '/api-sprint': {
        target: 'https://ape-sprint.isappcloud.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-sprint/, ''),
        secure: true
      }
    }
  }
})
