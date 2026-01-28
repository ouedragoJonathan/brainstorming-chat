import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_BASE } from '../constants';
import { PersonaType, StrategicPrediction } from '../types';

// Initialize Gemini Client
// Requires process.env.API_KEY to be set
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAnalysis = async (idea: string, personaName: string): Promise<string> => {
  try {
    const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}`;
    
    // Using gemini-3-pro-preview for complex reasoning and markdown generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `PERSONNALITÉ CHOISIE : ${personaName}\n\nIDÉE À ANALYSER : ${idea}`,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7, // Balance between creativity and structure
        thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for deeper analysis
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "An error occurred while communicating with the AI.");
  }
};

export const predictStrategy = async (idea: string): Promise<StrategicPrediction> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    throw new Error("Could not generate a strategic prediction.");
  }
};
