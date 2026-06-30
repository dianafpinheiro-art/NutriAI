import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

import { logger } from "./src/server/services/logger.ts";
import { requireSupabaseSession } from "./src/server/middlewares/auth.ts";
import { rateLimitGemini } from "./src/server/middlewares/rateLimit.ts";
import { geminiRouter } from "./src/server/controllers/geminiController.ts";
import { paymentRouter, postWebhook } from "./src/server/controllers/paymentController.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

const isBundledServer = process.argv[1]?.includes(`${path.sep}dist${path.sep}`) ?? false;
process.env.NODE_ENV = process.env.NODE_ENV || (isBundledServer ? "production" : "development");

const app = express();
const PORT = 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "*"].filter(Boolean),
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.disable("x-powered-by");

app.use((_req: Request, res: Response, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "2.1.0-pwa",
  });
});

app.use("/api/gemini", requireSupabaseSession, rateLimitGemini, geminiRouter);
app.post("/api/payments/webhook", postWebhook);
app.use("/api/payments", requireSupabaseSession, paymentRouter);

// Error handler — loga e retorna o erro para debug
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("[SERVER ERROR]", err);
  res.status(500).json({ error: err?.message || "Internal server error", stack: err?.stack });
});

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    logger("info", "Vite dev server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    logger("info", "Serving static production assets from dist.");
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      logger("info", `Express custom server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
