// Usar a API REST do Mercado Pago (sem SDK, para nao adicionar dependencia)
// https://www.mercadopago.com.br/developers/pt/reference

import { cleanEnv } from "../utils/helpers.js";

const MP_ACCESS_TOKEN = cleanEnv(process.env.MERCADO_PAGO_ACCESS_TOKEN);
const APP_BASE_URL = cleanEnv(process.env.APP_BASE_URL) || "http://localhost:3000";

export interface CreateSubscriptionRequest {
  userId: string;
  email: string;
  plan: "monthly" | "annual";
}

export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface MpItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

interface MpPayer {
  email: string;
}

interface MpBackUrls {
  success: string;
  failure: string;
  pending: string;
}

interface MpPreferenceBody {
  items: MpItem[];
  payer: MpPayer;
  back_urls: MpBackUrls;
  auto_return: string;
  external_reference: string;
  notification_url: string;
}

export interface MpWebhookBody {
  type?: string;
  data?: { id?: string };
  [key: string]: unknown;
}

interface MpPaymentResponse {
  id?: number;
  status?: string;
  external_reference?: string;
  [key: string]: unknown;
}

export async function createPaymentPreference(
  req: CreateSubscriptionRequest
): Promise<PaymentPreference> {
  const { userId, email, plan } = req;

  const items: MpItem[] =
    plan === "monthly"
      ? [
          {
            title: "PersonalDiet Premium - Mensal",
            quantity: 1,
            unit_price: 19.9,
            currency_id: "BRL",
          },
        ]
      : [
          {
            title: "PersonalDiet Premium - Anual",
            quantity: 1,
            unit_price: 149.9,
            currency_id: "BRL",
          },
        ];

  const body: MpPreferenceBody = {
    items,
    payer: { email },
    back_urls: {
      success: `${APP_BASE_URL}/subscription/success`,
      failure: `${APP_BASE_URL}/subscription/failure`,
      pending: `${APP_BASE_URL}/subscription/pending`,
    },
    auto_return: "approved",
    external_reference: `${userId}:${plan}`,
    notification_url: `${APP_BASE_URL}/api/payments/webhook`,
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago error: ${response.status} ${text}`);
  }

  const raw = (await response.json()) as Record<string, unknown>;

  const preference: PaymentPreference = {
    id: String(raw.id ?? ""),
    init_point: String(raw.init_point ?? ""),
    sandbox_init_point: String(raw.sandbox_init_point ?? ""),
  };

  if (!preference.id) {
    throw new Error("Resposta do Mercado Pago nao contem preference id");
  }

  return preference;
}

export async function verifyPayment(paymentId: string): Promise<MpPaymentResponse> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error("Falha ao verificar pagamento no Mercado Pago");
  }

  return (await response.json()) as MpPaymentResponse;
}

export interface WebhookResult {
  userId: string;
  plan: "monthly" | "annual";
  status: string;
  paymentId: string;
}

export async function handleWebhook(body: MpWebhookBody): Promise<WebhookResult | null> {
  if (body.type !== "payment") {
    return null;
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return null;
  }

  const payment = await verifyPayment(paymentId);

  const externalReference = payment.external_reference;
  if (!externalReference) {
    return null;
  }

  const parts = externalReference.split(":");
  if (parts.length !== 2) {
    return null;
  }

  const [userId, plan] = parts;
  if (!userId || (plan !== "monthly" && plan !== "annual")) {
    return null;
  }

  return {
    userId,
    plan,
    status: payment.status ?? "unknown",
    paymentId: String(payment.id ?? paymentId),
  };
}
