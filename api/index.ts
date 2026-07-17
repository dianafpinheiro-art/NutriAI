export default function handler(_req: any, res: any) {
  res.status(200).json({
    name: "PersonalDiet API",
    status: "ok",
    routes: [
      "/api/health",
      "/api/payments/subscription",
      "/api/payments/status",
      "/api/payments/webhook",
      "/api/gemini/generate-menu",
      "/api/gemini/parse-prescription",
      "/api/gemini/analyze-pantry-image",
      "/api/gemini/analyze-labels",
      "/api/gemini/import-recipe",
    ],
  });
}
