import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Utilisation de la variable d'env OU de la clé en dur si l'environnement échoue
  // (Comme demandé : "reexpose ma clé")
  const apiKey = env.API_KEY || "AIzaSyDtMMCHaGDqCNbH0F4MhqoM_vlzu_YAPPo";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey) 
    }
  }
})