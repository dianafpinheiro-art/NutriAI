import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export interface ValidatedRequest<T> extends Request {
  validatedBody: T;
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Dados invalidos", details: result.error.flatten() });
      return;
    }
    (req as ValidatedRequest<T>).validatedBody = result.data;
    next();
  };
}
