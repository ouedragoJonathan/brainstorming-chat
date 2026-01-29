import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Initialize Gemini Client
// Requires process.env.API_KEY to be set
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
  PRIMARY: 'gemini-3-pro-preview', // Pour l'analyse approfondie
  FALLBACK: 'gemini-3-flash-preview', // En cas d'erreur de quota
  FAST: 'gemini-3-flash-preview' // Pour la prédiction rapide
};

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}`;
  const contents = `PERSONNALITÉ CHOISIE : ${personaName}\n\nIDÉE À ANALYSER : ${idea}`;

  try {
    // Tentative 1 : Utiliser le modèle puissant (Pro)
    const response = await ai.models.generateContent({
      model: MODELS.PRIMARY,
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7, // Balance between creativity and structure
        thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for deeper analysis
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini Pro.");
    }

    return text;

  } catch (error: any) {
    // 1. Détection CLÉ RÉVOQUÉE / FUITÉE
    if (error.message?.includes('leaked') || error.status === 403) {
      throw new Error("🚨 ALERTE SÉCURITÉ : Votre clé API a été détectée comme compromise et bloquée par Google. Veuillez générer une nouvelle clé sur aistudio.google.com et mettre à jour votre fichier .env.");
    }

    // 2. Détection de l'erreur de quota (429 ou RESOURCE_EXHAUSTED)
    const isQuotaError = error.message?.includes('429') || 
                         error.message?.includes('RESOURCE_EXHAUSTED') || 
                         error.status === 429;

    if (isQuotaError) {
      console.warn(`Quota épuisé pour ${MODELS.PRIMARY}. Basculement automatique vers ${MODELS.FALLBACK}.`);
      
      try {
        // Tentative 2 : Fallback sur le modèle Flash (plus rapide/léger)
        const response = await ai.models.generateContent({
          model: MODELS.FALLBACK,
          contents: contents,
          config: {
            systemInstruction: fullSystemInstruction,
            temperature: 0.7,
            // Budget de pensée réduit pour Flash
            thinkingConfig: { thinkingBudget: 1024 },
          },
        });

        const text = response.text;
        if (!text) throw new Error("No response generated from Gemini Flash.");
        
        // On ajoute une petite note discrète à la fin
        return text + "\n\n> *Note système : Analyse générée via le circuit rapide (Flash) pour optimiser les ressources.*";
        
      } catch (fallbackError: any) {
        console.error("Fallback Error:", fallbackError);
        throw new Error("Les services IA sont momentanément saturés. Veuillez réessayer dans quelques instants.");
      }
    }

    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred while communicating with the AI.");
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
    
    // The response is guaranteed to be JSON due to responseMimeType and responseSchema
    return JSON.parse(response.text!) as StrategicPrediction;
  } catch (error: any) {
    console.error("Prediction API Error:", error);
     if (error.message?.includes('leaked') || error.status === 403) {
      throw new Error("Votre clé API est invalide (fuitée). Mettez à jour le fichier .env.");
    }
    // On ne bloque pas l'utilisateur si la prédiction échoue pour d'autres raisons
    throw new Error("Could not generate a strategic prediction.");
  }
};