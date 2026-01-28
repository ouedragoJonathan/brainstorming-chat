export enum PersonaType {
  VISIONARY = 'VISIONARY',
  DEVIL = 'DEVIL',
  COACH = 'COACH'
}

export interface PersonaConfig {
  id: PersonaType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  systemPromptName: string;
}

export interface AnalysisState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

export interface IdeaInput {
  text: string;
  persona: PersonaType;
}

export interface StrategicPrediction {
  suggestedPersona: PersonaType;
  reasoning: string;
  focusArea: string;
}
