import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    // 优化内存使用
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    // 减少构建内存使用
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
})
