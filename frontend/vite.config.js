import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  if (mode !== 'production' && !env.VITE_BACKEND_URL) {
    throw new Error('VITE_BACKEND_URL must be set for local development')
  }
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
