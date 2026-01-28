import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Fonction utilitaire pour lire manuellement le fichier .env.example
// car Vite ne le charge pas automatiquement comme variables d'environnement
function loadEnvExample() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const config: Record<string, string> = {};
      
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          // Nettoyage basique des quotes
          value = value.replace(/(^['"]|['"]$)/g, '').trim();
          config[key] = value;
        }
      });
      return config;
    }
  } catch (e) {
    console.warn('Impossible de lire .env.example', e);
  }
  return {};
}

export default defineConfig(({ mode }) => {
  // 1. Charge les variables standard (.env, .env.local, etc.)
  const env = loadEnv(mode, process.cwd(), '');
  
  // 2. Si API_KEY n'est pas trouvée, on essaie de la lire dans .env.example
  // (Spécifique à votre demande pour utiliser ce fichier comme source)
  let apiKey = env.API_KEY;
  
  if (!apiKey) {
    const exampleEnv = loadEnvExample();
    if (exampleEnv.API_KEY) {
      console.log('✅ API_KEY chargée depuis .env.example');
      apiKey = exampleEnv.API_KEY;
    }
  }

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})