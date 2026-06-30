import { Request, Response, NextFunction } from "express";

const GEMINI_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const GEMINI_RATE_LIMIT_MAX_REQUESTS = 30;
const geminiRateLimits = new Map<string, { count: number; resetAt: number }>();
let requestCountSinceCleanup = 0;

export function rateLimitGemini(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = String(res.locals.authUserId || req.ip || "anonymous");

  requestCountSinceCleanup++;
  if (requestCountSinceCleanup >= 100) {
    requestCountSinceCleanup = 0;
    for (const [k, v] of geminiRateLimits.entries()) {
      if (v.resetAt <= now) {
        geminiRateLimits.delete(k);
      }
    }
  }

  const current = geminiRateLimits.get(key);
  if (!current || current.resetAt <= now) {
    geminiRateLimits.set(key, { count: 1, resetAt: now + GEMINI_RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (current.count >= GEMINI_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "Muitas tentativas. Tente novamente em alguns minutos." });
    return;
  }

  current.count += 1;
  next();
}
