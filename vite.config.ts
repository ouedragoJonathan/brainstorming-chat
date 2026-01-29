import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Fonction utilitaire pour lire manuellement les fichiers d'environnement
function getApiKeyManually() {
  const rootDir = process.cwd();
  const filesToCheck = ['.env', '.env.local', '.env.example'];
  
  console.log(`🔍 Recherche de clé API dans : ${rootDir}`);

  for (const file of filesToCheck) {
    try {
      const envPath = path.resolve(rootDir, file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/^API_KEY\s*=\s*(.*)$/m);
        if (match && match[1]) {
          let value = match[1].trim();
          value = value.replace(/(^['"]|['"]$)/g, '');
          if (value) {
            console.log(`✅ Clé trouvée dans ${file} (Début: ${value.substring(0, 4)}...)`);
            return value;
          }
        }
      }
    } catch (e) {
      console.warn(`Erreur lecture ${file}`, e);
    }
  }
  return null;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let apiKey = env.API_KEY;
  
  // Si la clé chargée par Vite est vide, on tente la lecture manuelle
  if (!apiKey) {
    console.log("⚠️ Aucune clé trouvée via loadEnv, tentative manuelle...");
    const manualKey = getApiKeyManually();
    if (manualKey) {
      apiKey = manualKey;
    }
  } else {
     console.log(`✅ Clé chargée via loadEnv (Début: ${apiKey.substring(0, 4)}...)`);
  }

  if (!apiKey) {
      console.error("❌ ERREUR FATALE: Aucune API_KEY trouvée. L'application ne pourra pas contacter Google Gemini.");
  }

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey || "") 
    }
  }
})