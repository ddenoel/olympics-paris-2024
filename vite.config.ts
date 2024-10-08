import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.olympics.kevle.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/blot': {
        target: 'https://olympics.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/blot/, '')
      }
    }
  }
})
