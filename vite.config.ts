import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Clé API définie directement
const API_KEY = "AIzaSyBUrntnWDBn5OmkrhN1BViuEKxOc8RIQRA";

export default defineConfig({
  plugins: [react()],
  define: {
    // Injection directe de la variable d'environnement pour le build
    'process.env.API_KEY': JSON.stringify(API_KEY) 
  }
})