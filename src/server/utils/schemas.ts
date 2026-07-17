import { z } from "zod";

export const GenerateMenuSchema = z.object({
  preferences: z.object({
    excludedIngredients: z.array(z.string()).default([]),
    clinicalRestrictions: z.array(z.string()).default([]),
    clinicalTreatment: z.string().default("none"),
    dietType: z.string().default("none"),
  }).passthrough(),
  pantry: z.array(z.object({
    name: z.string(),
    quantity: z.string(),
    category: z.string().optional(),
    id: z.string().optional(),
  })).default([]),
  actionType: z.string(),
  locale: z.string().optional(),
  languageInstruction: z.string().optional(),
});

export const ParsePrescriptionSchema = z.object({
  filename: z.string().min(1).max(255),
  fileContent: z.string().min(1),
});

export const AnalyzePantryImageSchema = z.object({
  image: z.string().min(1),
});

export const AnalyzeLabelsSchema = z.object({
  labelText: z.string().min(1).max(10000),
  restrictionType: z.enum(["celiac", "lactose"]),
});

export const ImportRecipeSchema = z.object({
  url: z.string().trim().max(2000).optional(),
  texto: z.string().trim().max(12000).optional(),
  preferences: z.object({
    excludedIngredients: z.array(z.string()).default([]),
    clinicalRestrictions: z.array(z.string()).default([]),
    clinicalTreatment: z.string().default("none"),
    dietType: z.string().default("none"),
  }).passthrough().optional(),
}).refine((body) => Boolean(body.url || body.texto), {
  message: "Envie um link ou cole o texto da receita.",
});

export const CreateSubscriptionSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
  email: z.string().email().optional(),
});

export const WebhookSchema = z.object({
  type: z.string().optional(),
  data: z.object({ id: z.string().optional() }).optional(),
}).passthrough();

export type GenerateMenuInput = z.infer<typeof GenerateMenuSchema>;
export type ParsePrescriptionInput = z.infer<typeof ParsePrescriptionSchema>;
export type AnalyzePantryImageInput = z.infer<typeof AnalyzePantryImageSchema>;
export type AnalyzeLabelsInput = z.infer<typeof AnalyzeLabelsSchema>;
export type ImportRecipeInput = z.infer<typeof ImportRecipeSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;
