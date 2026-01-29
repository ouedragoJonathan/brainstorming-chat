import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Récupération de la clé injectée et nettoyage de sécurité ultime
// .trim() est crucial ici au cas où l'injection contienne des espaces résiduels
const rawApiKey = process.env.API_KEY || "";
const apiKey = rawApiKey.trim();

// Diagnostic console visible dans le navigateur
console.group("[Gemini Service Debug]");
console.log("Statut Brut:", rawApiKey ? "Présent" : "Vide");
console.log("Longueur Clé:", apiKey.length);
console.log("Aperçu:", apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "N/A");
console.groupEnd();

// Fonction de validation stricte
const checkApiKey = () => {
  if (!apiKey || apiKey.length < 20 || apiKey.includes("VOTRE_CLE")) {
    const msg = "🚫 CLÉ API INVALIDE : La clé semble incorrecte ou absente du fichier .env.";
    console.error(msg, { apiKey });
    throw new Error(msg);
  }
};

// Initialize Gemini Client
// Utilisation d'une clé factice explicite si vide pour que l'erreur vienne de notre checkApiKey et pas du SDK
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY_FOR_INIT" });

const MODELS = {
  PRIMARY: 'gemini-3-pro-preview',
  FALLBACK: 'gemini-3-flash-preview',
  FAST: 'gemini-3-flash-preview'
};

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
  // 1. Validation avant appel
  checkApiKey();

  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}`;
  const contents = `PERSONNALITÉ CHOISIE : ${personaName}\n\nIDÉE À ANALYSER : ${idea}`;

  try {
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
    console.error("Gemini API Error Details:", error);
    
    // Gestion spécifique de l'erreur 400 "API Key not found" qui est souvent un pb de format
    if (error.message?.includes('API Key not found') || error.status === 400) {
       throw new Error(`⚠️ Problème d'authentification (400). La clé API est peut-être mal formatée ou contient des espaces. Vérifiez le fichier .env. (Clé lue: ${apiKey.substring(0,5)}...)`);
    }

    // Autres erreurs d'auth
    if (error.message?.includes('leaked') || error.status === 403) {
      throw new Error(`🚨 Clé API refusée (403). Elle a peut-être expiré ou été révoquée.`);
    }

    // Gestion Quota
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

    throw new Error(error.message || "Erreur technique lors de la génération.");
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
    if (error.status === 400 || error.status === 403) throw error;
    throw new Error("Prediction unavailable.");
  }
};