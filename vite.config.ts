import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Fonction utilitaire pour lire manuellement les fichiers d'environnement
// Utile si Vite ne charge pas automatiquement ou pour supporter .env.example en fallback
function getApiKeyManually() {
  const filesToCheck = ['.env', '.env.local', '.env.example'];
  
  for (const file of filesToCheck) {
    try {
      const envPath = path.resolve(file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        // Regex simple pour trouver API_KEY=...
        const match = content.match(/^API_KEY\s*=\s*(.*)$/m);
        if (match && match[1]) {
          let value = match[1].trim();
          // Enlever les quotes si présentes
          value = value.replace(/(^['"]|['"]$)/g, '');
          if (value) {
            console.log(`✅ API_KEY trouvée manuellement dans ${file}`);
            return value;
          }
        }
      }
    } catch (e) {
      // Ignorer les erreurs de lecture
    }
  }
  return null;
}

export default defineConfig(({ mode }) => {
  // 1. Charge les variables via la méthode standard de Vite
  // le 3ème argument '' permet de charger toutes les vars, pas juste celles préfixées par VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  // 2. Priorité : Env standard > Lecture manuelle
  let apiKey = env.API_KEY;
  
  if (!apiKey) {
    const manualKey = getApiKeyManually();
    if (manualKey) {
      apiKey = manualKey;
    } else {
      console.warn("⚠️ AUCUNE API_KEY TROUVÉE. L'application ne fonctionnera pas correctement.");
    }
  }

  return {
    plugins: [react()],
    // Remplacement statique de process.env.API_KEY dans le code client
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey || "") 
    }
  }
})