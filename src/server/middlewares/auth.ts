import { Request, Response, NextFunction } from "express";
import { supabaseAuth } from "../utils/supabase.ts";

export async function requireSupabaseSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!supabaseAuth) {
    res.status(500).json({ error: "Autenticacao do servidor nao configurada." });
    return;
  }

  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ error: "Login obrigatorio para usar a API." });
    return;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Sessao invalida ou expirada." });
    return;
  }

  res.locals.authUserId = data.user.id;
  next();
}
