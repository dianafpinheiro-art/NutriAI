import { Router, Request, Response } from "express";
import { createHmac } from "crypto";
import { z } from "zod";
import { validateBody } from "../middlewares/validate.js";
import { logger } from "../services/logger.js";
import { supabaseAdmin } from "../utils/supabaseAdmin.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { sendPurchaseEvent } from "../services/metaCapi.js";
import {
  createPaymentPreference,
  handleWebhook,
  type MpWebhookBody,
  type WebhookResult,
} from "../services/paymentService.js";
import { CreateSubscriptionSchema } from "../utils/schemas.js";

export async function postCreateSubscription(req: Request, res: Response): Promise<void> {
  try {
    const body = (req as unknown as { validatedBody: z.infer<typeof CreateSubscriptionSchema> }).validatedBody;
    const userId = res.locals.authUserId as string | undefined;

    if (!userId) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    const { plan } = body;

    let email = body.email;
    if (!email && supabaseAdmin) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData?.user) {
        res.status(400).json({ error: "Nao foi possivel obter o email do usuario." });
        return;
      }
      email = userData.user.email ?? "";
    }

    if (!email) {
      res.status(400).json({ error: "Email do usuario e obrigatorio." });
      return;
    }

    const preference = await createPaymentPreference({ userId, email, plan });

    if (supabaseAdmin) {
      const { error: upsertError } = await supabaseAdmin
        .from("user_profiles")
        .update({
          mercado_pago_preference_id: preference.id,
          subscription_plan: plan,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (upsertError) {
        logger("error", "Erro ao atualizar profile com preference_id", { error: upsertError.message });
      }
    }

    res.json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in postCreateSubscription", { error: errMsg });
    res.status(500).json({ error: errMsg || "Erro ao criar preferencia de pagamento" });
  }
}

async function activateSubscription(result: WebhookResult): Promise<void> {
  if (!supabaseAdmin) {
    logger("error", "supabaseAdmin nao configurado — nao foi possivel ativar subscription");
    return;
  }

  const { userId, plan, paymentId } = result;

  // IDEMPOTENCY: check if this payment was already processed
  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id, status")
    .eq("mercado_pago_payment_id", paymentId)
    .maybeSingle();

  if (existingPayment?.status === "approved") {
    logger("info", "Payment already processed, skipping", { paymentId });
    return;
  }

  const expiresAt =
    plan === "monthly"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const { error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
      subscription_expires_at: expiresAt.toISOString(),
      mercado_pago_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (profileError) {
    logger("error", "Erro ao ativar subscription no profile", { error: profileError.message });
  }

  const { error: paymentError } = await supabaseAdmin.from("payments").upsert(
    {
      user_id: userId,
      mercado_pago_payment_id: paymentId,
      mercado_pago_preference_id: null,
      amount: plan === "monthly" ? 19.9 : 149.9,
      currency: "BRL",
      status: "approved",
      plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "mercado_pago_payment_id" }
  );

  if (paymentError) {
    logger("error", "Erro ao inserir pagamento no historico", { error: paymentError.message });
  }

  // Disparar email de boas-vindas com o acesso
  let userEmail: string | undefined;
  if (supabaseAdmin) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    userEmail = userData?.user?.email ?? undefined;
  }

  if (userEmail) {
    sendWelcomeEmail({
      email: userEmail,
      plan,
      expiresAt: expiresAt.toISOString(),
    }).catch((err) => {
      logger("error", "Falha ao disparar email de boas-vindas (non-blocking)", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  // Meta Conversions API — evento Purchase server-side (non-blocking)
  sendPurchaseEvent({
    email: userEmail,
    userId,
    paymentId,
    value: plan === "monthly" ? 19.9 : 149.9,
    currency: "BRL",
    plan: plan === "monthly" ? "Mensal" : "Anual",
  }).catch((err) => {
    logger("error", "Falha ao enviar Purchase a Meta CAPI (non-blocking)", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

/**
 * Verify Mercado Pago webhook signature (HMAC SHA256).
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/ipn#bookmark_verificación_de_seguridad
 */
function verifyMpSignature(req: Request): boolean {
  const mpSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!mpSecret) {
    // If no secret configured, skip verification (with warning) — but in production it should be set
    logger("warn", "MERCADO_PAGO_WEBHOOK_SECRET not configured — signature verification skipped");
    return true;
  }

  const signature = req.headers["x-signature"] as string | undefined;
  const requestId = req.headers["x-request-id"] as string | undefined;
  if (!signature) return false;

  // MP format: "ts=...,v1=..." — we parse and reconstruct
  const parts = signature.split(",");
  const tsPart = parts.find((p) => p.trim().startsWith("ts="));
  const v1Part = parts.find((p) => p.trim().startsWith("v1="));
  if (!tsPart || !v1Part) return false;

  const ts = tsPart.split("=")[1]?.trim();
  const v1 = v1Part.split("=")[1]?.trim();
  if (!ts || !v1) return false;

  const body = req.body as MpWebhookBody;
  // Manifest oficial MP: id:[data.id_url];request-id:[x-request-id];ts:[ts];
  // data.id vem dos query params da URL; ids alfanumericos em lowercase;
  // segmentos ausentes sao removidos do manifest.
  const queryDataId = String((req.query?.["data.id"] as string | undefined) ?? "");
  const dataId = (queryDataId || String(body?.data?.id || "")).toLowerCase();

  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", mpSecret).update(manifest).digest("hex");

  return expected === v1;
}

export async function postWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verify Mercado Pago signature for security
    if (!verifyMpSignature(req)) {
      logger("warn", "Webhook signature verification failed");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const body = req.body as MpWebhookBody;

    if (!body || typeof body !== "object") {
      res.status(200).json({ received: true, note: "empty body" });
      return;
    }

    if (!body.type || !body.data?.id) {
      res.status(200).json({ received: true, note: "not a payment notification" });
      return;
    }

    const result = await handleWebhook(body);

    if (result && result.status === "approved") {
      await activateSubscription(result);
    }

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Webhook processing error (swallowed to avoid MP retries)", { error: errMsg });
    res.status(200).json({ received: true, note: "error swallowed" });
  }
}

export async function getSubscriptionStatus(_req: Request, res: Response): Promise<void> {
  try {
    const userId = res.locals.authUserId as string | undefined;
    if (!userId) {
      res.status(401).json({ error: "Nao autenticado" });
      return;
    }

    if (!supabaseAdmin) {
      res.status(500).json({ error: "Servidor de autenticacao nao configurado." });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("subscription_status, subscription_plan, subscription_expires_at, trial_ends_at")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Perfil nao encontrado" });
      return;
    }

    const now = new Date();
    const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;

    let status = data.subscription_status ?? "free";
    if (status === "active" && expiresAt && now > expiresAt) {
      status = "expired";
    }
    if (status === "trial" && trialEndsAt && now > trialEndsAt) {
      status = "trial_expired";
    }

    res.json({
      status,
      plan: data.subscription_plan ?? null,
      expiresAt: data.subscription_expires_at ?? null,
      trialEndsAt: data.trial_ends_at ?? null,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Error in getSubscriptionStatus", { error: errMsg });
    res.status(500).json({ error: errMsg });
  }
}

export const paymentRouter = Router();
paymentRouter.post("/subscription", validateBody(CreateSubscriptionSchema), postCreateSubscription);
paymentRouter.get("/status", getSubscriptionStatus);
