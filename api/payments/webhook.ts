import { createClient } from "@supabase/supabase-js";

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

  const { error: paymentError } = await supabaseAdmin.from("payments").upsert(
    {
      user_id: params.userId,
      mercado_pago_payment_id: params.paymentId,
      mercado_pago_preference_id: null,
      amount: params.plan === "monthly" ? 19.9 : 149.9,
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
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readBody(req);
    const paymentId = body?.data?.id || body?.id;

    if (!paymentId || (body?.type && body.type !== "payment")) {
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
