/**
 * Types pour l'assistant IA de champs
 */

export type FieldAssistantAction = 'improve' | 'correct' | 'suggest' | 'complete';

export interface FieldAssistantInput {
  fieldName: string;
  fieldValue: string;
  action: FieldAssistantAction;
  context?: {
    level?: string;
    trainingType?: string;
    category?: string;
    title?: string;
    moduleTitle?: string;
  };
}

export interface FieldAssistantOutput {
  original: string;
  improved: string;
  suggestions?: string[];
  explanation?: string;
}

