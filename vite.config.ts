import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_KEY = "AIzaSyCdpBPx5YIqLXdj0Df6zss1vR8YP17X-gI";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(API_KEY)
  }
})