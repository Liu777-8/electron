import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    target: 'esnext',
    // 确保依赖被正确打包
    rollupOptions: {
      external: []
    }
  },
  server: {
    port: 5173
  },
  // 优化依赖预构建，确保vue-router等依赖被正确处理
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios']
  }
})
