import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:5276'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Khi VITE_API_BASE_URL để trống, FE gọi /api/... cùng origin → proxy sang BE
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
