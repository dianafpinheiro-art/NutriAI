import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { sendPurchaseEvent } from "../../src/server/services/metaCapi.js";

function cleanEnv(value: string | undefined): string {
  const trimmed = (value || "").replace(/^\uFEFF/, "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/^\uFEFF/, "").trim();
  }
  return trimmed;
}

const supabaseUrl = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
const mercadoPagoAccessToken = cleanEnv(process.env.MERCADO_PAGO_ACCESS_TOKEN);

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

async function readBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function verifyPayment(paymentId: string): Promise<Record<string, any>> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao verificar pagamento no Mercado Pago: ${response.status}`);
  }

  return (await response.json()) as Record<string, any>;
}

async function activateSubscription(params: {
  userId: string;
  plan: "monthly" | "annual";
  paymentId: string;
}): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin env vars missing on Vercel.");
  }

  // IDEMPOTENCY: skip if this payment was already processed
  const { data: existingPayment } = await supabaseAdmin
    .from("payments")
    .select("id, status")
    .eq("mercado_pago_payment_id", params.paymentId)
    .maybeSingle();

  if (existingPayment?.status === "approved") {
    console.log("[payments/webhook] Payment already processed, skipping:", params.paymentId);
    return;
  }

  const expiresAt =
    params.plan === "monthly"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const { error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .update({
      subscription_status: "active",
      subscription_plan: params.plan,
      subscription_expires_at: expiresAt.toISOString(),
      mercado_pago_payment_id: params.paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId);

  if (profileError) {
    throw profileError;
  }

  const amount = params.plan === "monthly" ? 19.9 : 149.9;

  const { error: paymentError } = await supabaseAdmin.from("payments").upsert(
    {
      user_id: params.userId,
      mercado_pago_payment_id: params.paymentId,
      mercado_pago_preference_id: null,
      amount,
      currency: "BRL",
      status: "approved",
      plan: params.plan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "mercado_pago_payment_id" }
  );

  if (paymentError) {
    throw paymentError;
  }

  // Meta Conversions API — evento Purchase server-side (non-blocking).
  // No-op se META_PIXEL_ID / META_CAPI_ACCESS_TOKEN nao estiverem configuradas.
  let buyerEmail: string | undefined;
  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(params.userId);
    buyerEmail = userData?.user?.email ?? undefined;
  } catch {
    // segue sem email — external_id (user_id) ainda permite match
  }

  sendPurchaseEvent({
    email: buyerEmail,
    userId: params.userId,
    paymentId: params.paymentId,
    value: amount,
    currency: "BRL",
    plan: params.plan === "monthly" ? "Mensal" : "Anual",
  }).catch((err) => {
    console.error("[payments/webhook] Meta CAPI falhou (non-blocking):", err?.message || err);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readBody(req);

    // Mercado Pago tambem envia data.id e type como QUERY PARAMS (?data.id=...&type=payment)
    const searchParams = new URL(req.url || "/", "http://localhost").searchParams;
    const queryDataId = String(req.query?.["data.id"] ?? searchParams.get("data.id") ?? "");
    const queryType = String(req.query?.type ?? searchParams.get("type") ?? "");

    // Verify Mercado Pago signature
    // Manifest oficial: id:[data.id_url];request-id:[x-request-id];ts:[ts];
    // - data.id vem dos query params da URL (nao do body)
    // - ids alfanumericos devem estar em lowercase
    // - segmentos ausentes sao removidos do manifest
    // Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    const mpSecret = cleanEnv(process.env.MERCADO_PAGO_WEBHOOK_SECRET);
    if (mpSecret) {
      const signature = req.headers["x-signature"] || "";
      const requestId = String(req.headers["x-request-id"] || "");
      if (!signature || typeof signature !== "string") {
        return res.status(401).json({ error: "Missing signature" });
      }
      const parts = signature.split(",");
      const tsPart = parts.find((p) => p.trim().startsWith("ts="));
      const v1Part = parts.find((p) => p.trim().startsWith("v1="));
      if (!tsPart || !v1Part) {
        return res.status(401).json({ error: "Invalid signature format" });
      }
      const ts = tsPart.split("=")[1]?.trim();
      const v1 = v1Part.split("=")[1]?.trim();
      const dataIdForManifest = (queryDataId || String(body?.data?.id || body?.id || "")).toLowerCase();

      let manifest = "";
      if (dataIdForManifest) manifest += `id:${dataIdForManifest};`;
      if (requestId) manifest += `request-id:${requestId};`;
      manifest += `ts:${ts};`;

      const expected = createHmac("sha256", mpSecret).update(manifest).digest("hex");
      if (expected !== v1) {
        console.error("[payments/webhook] Signature mismatch");
        return res.status(401).json({ error: "Invalid signature" });
      }
    } else {
      console.warn("[payments/webhook] MERCADO_PAGO_WEBHOOK_SECRET not set — skipping verification");
    }

    const paymentId = body?.data?.id || body?.id || queryDataId;
    const notificationType = body?.type || queryType;

    if (!paymentId || (notificationType && notificationType !== "payment")) {
      return res.status(200).json({ received: true, note: "not a payment notification" });
    }

    if (!mercadoPagoAccessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN missing on Vercel.");
    }

    const payment = await verifyPayment(String(paymentId));
    const externalReference = String(payment.external_reference || "");
    const [userId, plan] = externalReference.split(":");

    if (!userId || (plan !== "monthly" && plan !== "annual")) {
      return res.status(200).json({ received: true, note: "external_reference invalida" });
    }

    if (payment.status === "approved") {
      await activateSubscription({
        userId,
        plan,
        paymentId: String(payment.id || paymentId),
      });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("[payments/webhook]", err?.message || err);
    return res.status(200).json({ received: true, note: "error swallowed" });
  }
}
