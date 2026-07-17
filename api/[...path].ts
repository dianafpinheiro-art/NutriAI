// Catch-all para rotas /api/* desconhecidas.
// IMPORTANTE: nao importa o servidor Express — funcoes serverless dedicadas
// (api/health.ts, api/payments/*.ts, api/gemini/*.ts) atendem as rotas reais.
// Isso evita o ERR_MODULE_NOT_FOUND que derrubava esta funcao em producao.
export default function handler(req: any, res: any) {
  res.status(404).json({
    error: "Rota de API nao encontrada",
    path: req.url,
    hint: "Rotas disponiveis: /api/health, /api/payments/subscription, /api/payments/status, /api/payments/webhook, /api/gemini/*",
  });
}
