import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Initialisation directe
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
  PRIMARY: 'gemini-3-pro-preview',
  FALLBACK: 'gemini-3-flash-preview',
  FAST: 'gemini-3-flash-preview'
};

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
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
    console.error("Gemini API Error:", error);

    // ERREUR SPÉCIFIQUE : CLÉ FUITÉE (Celle que vous avez eue)
    if (error.message && (error.message.includes('leaked') || error.message.includes('PERMISSION_DENIED'))) {
        throw new Error("⛔ CLÉ BLOQUÉE PAR SÉCURITÉ. Google a détecté que votre clé précédente a fuité et l'a désactivée. Vous devez générer une NOUVELLE clé sur Google AI Studio et la remplacer dans le code.");
    }
    
    // Gestion simplifiée des erreurs
    const isQuotaError = error.status === 429 || 
                         (error.message && error.message.includes('429')) ||
                         (error.message && error.message.includes('RESOURCE_EXHAUSTED'));

    if (isQuotaError) {
      try {
        console.warn("Quota exceeded, switching to fallback model.");
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
        return text + "\n\n> *Note : Analyse générée via le modèle rapide (Gemini Flash) suite à une saturation temporaire.*";
      } catch (fallbackError) {
        throw new Error("Les services IA sont saturés. Réessayez dans quelques instants.");
      }
    }

    if (error.status === 400 || (error.message && error.message.includes('API_KEY_INVALID'))) {
        throw new Error("Clé API invalide. Vérifiez que la clé dans vite.config.ts est correcte.");
    }

    throw new Error(error.message || "Erreur technique lors de la génération.");
  }
};

export const predictStrategy = async (idea: string): Promise<StrategicPrediction> => {
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
    console.warn("Prediction failed silently:", error);
    if (error.message && error.message.includes('leaked')) {
        throw error; // On remonte l'erreur critique
    }
    throw new Error("Prediction unavailable.");
  }
};