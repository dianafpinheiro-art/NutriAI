// Meta Conversions API (CAPI) — dispara evento Purchase server-side quando
// um pagamento e aprovado no webhook do Mercado Pago.
//
// 100% opcional: se META_PIXEL_ID ou META_CAPI_ACCESS_TOKEN nao estiverem
// configuradas, vira no-op (apenas loga um aviso). Nunca lanca erro para o
// chamador — falha de tracking jamais pode quebrar a ativacao da assinatura.
//
// O event_id usa o id do pagamento do Mercado Pago, entao se um dia o Pixel
// do navegador tambem disparar Purchase com o mesmo event_id, o Meta
// deduplica automaticamente.
import { createHash } from "crypto";
import { logger } from "./logger.js";
import { cleanEnv } from "../utils/helpers.js";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface PurchaseEventParams {
  email?: string;
  userId: string;
  paymentId: string;
  value: number;
  currency: string;
  plan: string;
}

export async function sendPurchaseEvent(params: PurchaseEventParams): Promise<void> {
  const pixelId = cleanEnv(process.env.META_PIXEL_ID);
  const accessToken = cleanEnv(process.env.META_CAPI_ACCESS_TOKEN);

  if (!pixelId || !accessToken) {
    logger("warn", "Meta CAPI nao configurada (META_PIXEL_ID / META_CAPI_ACCESS_TOKEN) — evento Purchase nao enviado");
    return;
  }

  const userData: Record<string, unknown> = {
    external_id: [sha256(params.userId)],
  };
  if (params.email) {
    userData.em = [sha256(params.email)];
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `mp_${params.paymentId}`,
        action_source: "website",
        event_source_url: "https://nutri-ai-5qaa.vercel.app",
        user_data: userData,
        custom_data: {
          currency: params.currency,
          value: params.value,
          content_name: `PersonalDiet Premium - ${params.plan}`,
          content_type: "product",
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      logger("error", "Meta CAPI rejeitou o evento Purchase", { status: response.status, body: JSON.stringify(body).slice(0, 300) });
    } else {
      logger("info", "Evento Purchase enviado a Meta CAPI", { paymentId: params.paymentId, events_received: body.events_received });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Falha ao enviar evento Purchase a Meta CAPI (non-blocking)", { error: errMsg });
  }
}
