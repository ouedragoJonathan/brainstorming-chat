import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Clé API définie directement.
// ⚠️ IMPORTANT : Cette clé a été révoquée par Google et ne fonctionnera pas.
// Vous DEVEZ la remplacer par une NOUVELLE clé que vous générez sur Google AI Studio.
const API_KEY = "AIzaSyBUrntnWDBn5OmkrhN1BViuEKxOc8RIQRA";

export default defineConfig({
  plugins: [react()],
  define: {
    // Injection directe de la variable d'environnement pour le build.
    // C'est la méthode la plus simple pour éviter les erreurs de typage.
    'process.env.API_KEY': JSON.stringify(API_KEY) 
  }
})