import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Clé API fournie explicitement par l'utilisateur
const HARDCODED_KEY = "AIzaSyDtMMCHaGDqCNbH0F4MhqoM_vlzu_YAPPo";

export default defineConfig({
  plugins: [react()],
  define: {
    // Force la clé dans tout le code client via process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(HARDCODED_KEY) 
  }
})