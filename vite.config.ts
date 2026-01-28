import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration pour permettre l'utilisation de process.env.API_KEY côté client
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})