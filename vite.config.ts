import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Nettoyage robuste de la valeur (enlève les commentaires #, les espaces, les quotes)
function cleanEnvValue(val: string) {
  if (!val) return '';
  // Enlever les commentaires inline (ex: KEY=123 # commentaire)
  let clean = val.split('#')[0];
  // Nettoyer les espaces autour
  clean = clean.trim();
  // Enlever les quotes simples ou doubles
  clean = clean.replace(/(^['"]|['"]$)/g, '');
  return clean;
}

function getApiKeyManually(): string | null {
  const rootDir = process.cwd();
  const filesToCheck = ['.env', '.env.local', '.env.example'];
  
  console.log(`🔍 [Vite Config] Recherche manuelle de clé API dans : ${rootDir}`);

  for (const file of filesToCheck) {
    try {
      const envPath = path.resolve(rootDir, file);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        // Regex pour capturer la ligne API_KEY=...
        const match = content.match(/^(?:VITE_)?API_KEY\s*=\s*(.*)$/m);
        if (match && match[1]) {
          const rawValue = match[1];
          const cleanValue = cleanEnvValue(rawValue);
          
          if (cleanValue) {
            console.log(`✅ [Vite Config] Clé trouvée dans ${file} (valeur brute: "${rawValue.substring(0, 5)}...", nettoyée: "${cleanValue.substring(0, 5)}...")`);
            return cleanValue;
          }
        }
      }
    } catch (e) {
      console.warn(`[Vite Config] Erreur lecture ${file}`, e);
    }
  }
  return null;
}

export default defineConfig(({ mode }) => {
  // 1. Chargement standard Vite
  const env = loadEnv(mode, process.cwd(), '');
  let apiKey = env.API_KEY || env.VITE_API_KEY;

  // 2. Si non trouvé ou vide, tentative manuelle
  if (!apiKey) {
    console.log("⚠️ [Vite Config] Aucune clé via loadEnv, tentative lecture fichier...");
    const manualKey = getApiKeyManually();
    if (manualKey) {
      apiKey = manualKey;
    }
  } else {
    // Nettoyage même si chargé via loadEnv (pour virer les espaces éventuels)
    apiKey = cleanEnvValue(apiKey);
    console.log(`✅ [Vite Config] Clé chargée via loadEnv (nettoyée: "${apiKey.substring(0, 5)}...")`);
  }

  if (!apiKey) {
      console.error("\n❌ [Vite Config] ERREUR FATALE: Aucune API_KEY trouvée dans .env !");
      console.error("👉 Créez un fichier .env à la racine avec: API_KEY=VotreCléGoogle\n");
  }

  return {
    plugins: [react()],
    // Définition globale sécurisée
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey || "") 
    }
  }
})