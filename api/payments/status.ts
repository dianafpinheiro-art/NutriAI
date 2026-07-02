import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!supabaseAuth || !supabaseAdmin) {
      return res.status(500).json({ error: "Supabase server env vars missing on Vercel." });
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

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("subscription_status, subscription_plan, subscription_expires_at, trial_ends_at")
      .eq("user_id", userData.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Perfil nao encontrado" });
    }

    const now = new Date();
    const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
    const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    let status = data.subscription_status ?? "free";

    if (status === "active" && expiresAt && now > expiresAt) status = "expired";
    if (status === "trial" && trialEndsAt && now > trialEndsAt) status = "trial_expired";

    return res.status(200).json({
      status,
      plan: data.subscription_plan ?? null,
      expiresAt: data.subscription_expires_at ?? null,
      trialEndsAt: data.trial_ends_at ?? null,
    });
  } catch (err: any) {
    console.error("[payments/status]", err?.message || err);
    return res.status(500).json({ error: err?.message || "Erro ao consultar assinatura." });
  }
}
