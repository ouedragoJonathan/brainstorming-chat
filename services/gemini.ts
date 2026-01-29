import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Récupération de la clé injectée par Vite
const apiKey = process.env.API_KEY;

// Diagnostic au chargement
console.log(`[Gemini Service] Statut Clé API: ${apiKey ? `Présente (${apiKey.length} chars, commence par ${apiKey.substring(0, 4)}...)` : 'MANQUANTE'}`);

// Fonction de validation
const checkApiKey = () => {
  if (!apiKey || apiKey.length < 10 || apiKey.includes("VOTRE_CLE")) {
    console.error("[Gemini Service] Clé invalide détectée:", apiKey);
    throw new Error("🚫 CLÉ API MANQUANTE OU INVALIDE. Vérifiez votre fichier .env et redémarrez le serveur.");
  }
};

// Initialize Gemini Client
// On passe la clé si elle existe, sinon une valeur bidon pour que l'instance se crée (l'appel échouera via checkApiKey)
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

const MODELS = {
  PRIMARY: 'gemini-3-pro-preview',
  FALLBACK: 'gemini-3-flash-preview',
  FAST: 'gemini-3-flash-preview'
};

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
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
    console.error("Gemini Analysis Error Full Object:", error);
    
    // Gestion erreurs Auth
    if (error.message?.includes('leaked') || error.status === 403 || error.status === 400 || error.message?.includes('API Key')) {
      // Message plus technique pour aider au debug
      const details = error.message || "Erreur inconnue";
      throw new Error(`🔑 Erreur d'authentification API (${error.status}): ${details}. Vérifiez votre clé dans le fichier .env.`);
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
    if (error.message?.includes('API Key') || error.status === 400 || error.status === 403) {
      throw error; 
    }
    throw new Error("Prediction unavailable.");
  }
};