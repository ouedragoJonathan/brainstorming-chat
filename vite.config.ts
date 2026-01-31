import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// Fix: Import `cwd` from `node:process` to resolve TypeScript error with `process.cwd()`.
import { cwd } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement du fichier .env à la racine du projet
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose la variable d'environnement API_KEY au code client de manière sécurisée.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})
