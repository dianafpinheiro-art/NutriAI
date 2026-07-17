import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

import { logger } from "./src/server/services/logger.js";
import { requireSupabaseSession } from "./src/server/middlewares/auth.js";
import { rateLimitGemini } from "./src/server/middlewares/rateLimit.js";
import { geminiRouter } from "./src/server/controllers/geminiController.js";
import { paymentRouter, postWebhook } from "./src/server/controllers/paymentController.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const isBundledServer = process.argv[1]?.includes(`${path.sep}dist${path.sep}`) ?? false;
process.env.NODE_ENV = process.env.NODE_ENV || (isBundledServer ? "production" : "development");

const app = express();
const PORT = 3000;

// Sanitiza valores de env: remove BOM, quebras de linha (\r\n de copy-paste
// no painel do Vercel/Windows) e aspas envolventes. Um caractere invalido
// aqui derruba TODAS as respostas com "Invalid character in header content"
// quando o helmet monta o header Content-Security-Policy.
function cleanEnv(value: string | undefined): string {
  let v = (value || "").replace(/^\uFEFF/, "").replace(/[\r\n]/g, "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

const supabaseOrigin = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'", supabaseOrigin || "*"].filter(Boolean),
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// In production, lock CORS to the APP_URL / APP_BASE_URL domain.
// In development, allow localhost on any port.
const corsOrigin = process.env.NODE_ENV === "production"
  ? cleanEnv(process.env.APP_URL || process.env.APP_BASE_URL).replace(/\/$/, "")
  : "*";

app.use(cors({
  origin: corsOrigin || false, // false = reject cross-origin requests
  credentials: true,
}));
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

// Error handler — loga internamente, retorna mensagem genérica em produção
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("[SERVER ERROR]", err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    error: isDev ? (err?.message || "Internal server error") : "Internal server error",
    ...(isDev ? { stack: err?.stack } : {}),
  });
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
