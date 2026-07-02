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
const supabaseAnonKey = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
const mercadoPagoAccessToken = cleanEnv(process.env.MERCADO_PAGO_ACCESS_TOKEN);
const appBaseUrl = cleanEnv(process.env.APP_BASE_URL) || "https://nutri-ai-5qaa.vercel.app";

const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const supabaseAdmin = supabaseUrl && serviceRoleKey
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

async function createPaymentPreference(req: {
  userId: string;
  email: string;
  plan: "monthly" | "annual";
}): Promise<{ id: string; init_point: string; sandbox_init_point: string }> {
  const items =
    req.plan === "monthly"
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

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items,
      payer: { email: req.email },
      back_urls: {
        success: `${appBaseUrl}/subscription/success`,
        failure: `${appBaseUrl}/subscription/failure`,
        pending: `${appBaseUrl}/subscription/pending`,
      },
      auto_return: "approved",
      external_reference: `${req.userId}:${req.plan}`,
      notification_url: `${appBaseUrl}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago error: ${response.status} ${text}`);
  }

  const raw = (await response.json()) as Record<string, unknown>;
  const preference = {
    id: String(raw.id ?? ""),
    init_point: String(raw.init_point ?? ""),
    sandbox_init_point: String(raw.sandbox_init_point ?? ""),
  };

  if (!preference.id) {
    throw new Error("Resposta do Mercado Pago nao contem preference id");
  }

  return preference;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!supabaseAuth || !supabaseAdmin) {
      return res.status(500).json({ error: "Supabase server env vars missing on Vercel." });
    }
    if (!mercadoPagoAccessToken) {
      return res.status(500).json({ error: "MERCADO_PAGO_ACCESS_TOKEN missing on Vercel." });
    }

    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Login obrigatorio para usar a API." });
    }

    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData.user) {
      return res.status(401).json({ error: "Sessao invalida ou expirada." });
    }

    const body = await readBody(req);
    const plan = body.plan === "annual" ? "annual" : body.plan === "monthly" ? "monthly" : null;
    if (!plan) {
      return res.status(400).json({ error: "Plano invalido." });
    }

    const email = userData.user.email || "";
    if (!email) {
      return res.status(400).json({ error: "Email do usuario e obrigatorio." });
    }

    const preference = await createPaymentPreference({ userId: userData.user.id, email, plan });

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        mercado_pago_preference_id: preference.id,
        subscription_plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userData.user.id);

    if (profileError) {
      console.error("[payments/subscription] profile update failed", profileError.message);
    }

    return res.status(200).json({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
    });
  } catch (err: any) {
    console.error("[payments/subscription]", err?.message || err);
    return res.status(500).json({ error: err?.message || "Erro ao criar preferencia de pagamento." });
  }
}
