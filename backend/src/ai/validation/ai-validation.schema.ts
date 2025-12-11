import { z } from 'zod';

/**
 * Schémas de validation Zod pour l'IA
 */

export const FieldAssistantInputSchema = z.object({
  fieldName: z.string()
    .min(1, 'fieldName est requis')
    .max(100, 'fieldName trop long'),
  
  fieldValue: z.string()
    .min(1, 'fieldValue est requis')
    .max(5000, 'fieldValue ne peut pas dépasser 5000 caractères'),
  
  action: z.enum(['improve', 'correct', 'suggest', 'complete']).refine(
    (val) => ['improve', 'correct', 'suggest', 'complete'].includes(val),
    { message: 'action doit être: improve, correct, suggest ou complete' }
  ),
  
  context: z.object({
    title: z.string().optional(),
    level: z.string().optional(),
    trainingType: z.string().optional(),
    category: z.string().optional(),
    moduleTitle: z.string().optional()
  }).optional()
});

export const FieldAssistantOutputSchema = z.object({
  original: z.string(),
  improved: z.string(),
  suggestions: z.array(z.string()).optional(),
  explanation: z.string().optional()
});

export type ValidatedFieldAssistantInput = z.infer<typeof FieldAssistantInputSchema>;
export type ValidatedFieldAssistantOutput = z.infer<typeof FieldAssistantOutputSchema>;

