import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Récupération de la clé injectée par Vite
const apiKey = process.env.API_KEY;

// Fonction de validation pour éviter les erreurs 400 opaques
const checkApiKey = () => {
  if (!apiKey || apiKey.length === 0 || apiKey.includes("VOTRE_CLE")) {
    throw new Error("🚫 CLÉ API MANQUANTE. Veuillez créer un fichier .env à la racine avec : API_KEY=votre_cle_ici (voir .env.example)");
  }
};

// Initialize Gemini Client
// Utilisation d'une chaîne vide par défaut si undefined pour éviter le crash à l'instanciation,
// l'erreur sera levée lors de l'appel via checkApiKey()
const ai = new GoogleGenAI({ apiKey: apiKey || "NO_KEY_PROVIDED" });

const MODELS = {
  PRIMARY: 'gemini-3-pro-preview',
  FALLBACK: 'gemini-3-flash-preview',
  FAST: 'gemini-3-flash-preview'
};

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
  // 0. Vérification de sécurité avant appel
  checkApiKey();

  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}`;
  const contents = `PERSONNALITÉ CHOISIE : ${personaName}\n\nIDÉE À ANALYSER : ${idea}`;

  try {
    // Tentative 1 : Utiliser le modèle puissant (Pro)
    const response = await ai.models.generateContent({
      model: MODELS.PRIMARY,
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7, 
        thinkingConfig: { thinkingBudget: 2048 }, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated from Gemini Pro.");
    return text;

  } catch (error: any) {
    
    // 1. Gestion spécifique "Clé Invalide / Fuite"
    if (error.message?.includes('leaked') || error.status === 403 || error.message?.includes('API Key not found') || error.status === 400) {
      if (error.status === 400) throw new Error("🚫 Configuration API incorrecte. Vérifiez que votre fichier .env est bien sauvegardé et que le serveur a été redémarré.");
      throw new Error("🚨 ALERTE SÉCURITÉ : Votre clé API est invalide ou bloquée. Vérifiez votre fichier .env.");
    }

    // 2. Gestion Quota (Fallback)
    const isQuotaError = error.message?.includes('429') || 
                         error.message?.includes('RESOURCE_EXHAUSTED') || 
                         error.status === 429;

    if (isQuotaError) {
      console.warn(`Quota épuisé pour ${MODELS.PRIMARY}. Basculement vers ${MODELS.FALLBACK}.`);
      try {
        const response = await ai.models.generateContent({
          model: MODELS.FALLBACK,
          contents: contents,
          config: {
            systemInstruction: fullSystemInstruction,
            temperature: 0.7,
            thinkingConfig: { thinkingBudget: 1024 },
          },
        });
        const text = response.text;
        if (!text) throw new Error("No response from Fallback.");
        return text + "\n\n> *Note : Analyse via modèle rapide (Relais Flash) suite à une saturation réseau.*";
      } catch (fallbackError: any) {
        throw new Error("Les services IA sont momentanément saturés. Veuillez réessayer dans 30 secondes.");
      }
    }

    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erreur de communication avec l'IA.");
  }
};

export const predictStrategy = async (idea: string): Promise<StrategicPrediction> => {
  checkApiKey();
  
  try {
    const response = await ai.models.generateContent({
      model: MODELS.FAST,
      contents: `Analyze this business idea summary. Determine the most useful expert persona (VISIONARY, DEVIL, or COACH) to critique it right now based on its apparent maturity and risk profile. Identify the most critical Lean Canvas segment to focus on. 
      
      Idea: ${idea}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPersona: { 
              type: Type.STRING, 
              enum: [PersonaType.VISIONARY, PersonaType.DEVIL, PersonaType.COACH] 
            },
            reasoning: { type: Type.STRING },
            focusArea: { type: Type.STRING }
          },
          required: ["suggestedPersona", "reasoning", "focusArea"]
        }
      }
    });
    
    return JSON.parse(response.text!) as StrategicPrediction;
  } catch (error: any) {
    console.error("Prediction API Error:", error);
    // Silent fail for prediction helper
    if (error.message?.includes('API Key') || error.status === 400 || error.status === 403) {
      throw error; // Rethrow auth errors
    }
    throw new Error("Prediction unavailable.");
  }
};