import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Настройки для разработки
  server: {
    port: 3000,
    host: true, // Для доступа извне (важно для Telegram Mini App)
  },
  
  // Настройки сборки
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Оптимизация для Telegram Mini App
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'socket.io-client', 'zustand'],
        },
      },
    },
  },
  
  // Алиасы для импортов
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@styles': resolve(__dirname, 'src/styles'),
    },
  },
  
  // Настройки тестирования
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
  },
  
  // Определение глобальных переменных
  define: {
    global: 'globalThis',
  },
}); 