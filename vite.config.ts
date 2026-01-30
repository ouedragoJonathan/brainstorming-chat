import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ L'ancienne clé a été révoquée par Google ("Leaked").
// COLLEZ VOTRE NOUVELLE CLÉ ICI ENTRE LES GUILLEMETS.
const HARDCODED_KEY = "AIzaSyBUrntnWDBn5OmkrhN1BViuEKxOc8RIQRA"; 

export default defineConfig({
  plugins: [react()],
  define: {
    // Si la clé en dur est définie, elle écrase tout. Sinon on regarde le .env
    'process.env.API_KEY': JSON.stringify(HARDCODED_KEY !== "VOTRE_NOUVELLE_CLE_ICI" ? HARDCODED_KEY : process.env.API_KEY || "") 
  }
})