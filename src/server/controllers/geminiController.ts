import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateBody } from "../middlewares/validate.ts";
import {
  GenerateMenuSchema,
  ParsePrescriptionSchema,
  AnalyzePantryImageSchema,
  AnalyzeLabelsSchema,
} from "../utils/schemas.ts";
import { validateBase64Size } from "../utils/helpers.ts";
import { logger } from "../services/logger.ts";
import {
  generateMenu,
  parsePrescription,
  analyzePantryImage,
  analyzeLabels,
} from "../services/geminiService.ts";

const router = Router();

router.post("/generate-menu", validateBody(GenerateMenuSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as unknown as { validatedBody: z.infer<typeof GenerateMenuSchema> }).validatedBody;
    const result = await generateMenu(body.preferences, body.pantry, body.actionType, body.languageInstruction);
    res.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in generate-menu controller", { error: errMsg });
    res.status(500).json({ error: errMsg || "Erro interno ao processar cardapio inteligente." });
  }
});

router.post("/parse-prescription", validateBody(ParsePrescriptionSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as unknown as { validatedBody: z.infer<typeof ParsePrescriptionSchema> }).validatedBody;
    if (!validateBase64Size(body.fileContent)) {
      res.status(400).json({ error: "Arquivo excede o limite de 5MB." });
      return;
    }
    const result = await parsePrescription(body.fileContent);
    res.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in parse-prescription controller", { error: errMsg });
    res.status(500).json({ error: "Erro ao extrair informacoes do PDF da prescricao." });
  }
});

router.post("/analyze-pantry-image", validateBody(AnalyzePantryImageSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as unknown as { validatedBody: z.infer<typeof AnalyzePantryImageSchema> }).validatedBody;
    if (!validateBase64Size(body.image)) {
      res.status(400).json({ error: "Imagem excede o limite de 5MB." });
      return;
    }
    const result = await analyzePantryImage(body.image);
    res.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in analyze-pantry-image controller", { error: errMsg });
    res.status(500).json({ error: "Falha ao escanear a imagem da geladeira/despensa." });
  }
});

router.post("/analyze-labels", validateBody(AnalyzeLabelsSchema), async (req: Request, res: Response) => {
  try {
    const body = (req as unknown as { validatedBody: z.infer<typeof AnalyzeLabelsSchema> }).validatedBody;
    const result = await analyzeLabels(body.labelText, body.restrictionType);
    res.json(result);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in analyze-labels controller", { error: errMsg });
    res.status(500).json({ error: "Falha na analise inteligente de compostos do rotulo." });
  }
});

export { router as geminiRouter };
