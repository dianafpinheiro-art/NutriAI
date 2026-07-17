import { Resend } from "resend";
import { logger } from "./logger.js";
import { cleanEnv } from "../utils/helpers.js";

// LAZY INIT: instanciar o Resend somente quando for enviar email.
// `new Resend(undefined)` lanca erro no momento do import e derrubava
// TODAS as funcoes serverless que importam este modulo quando
// RESEND_API_KEY nao estava configurada no ambiente.
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey) {
    logger("warn", "RESEND_API_KEY nao configurada — email de boas-vindas desabilitado");
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_EMAIL = "PersonalDiet <onboarding@resend.dev>";

export async function sendWelcomeEmail(params: {
  email: string;
  plan: string;
  expiresAt: string;
}): Promise<void> {
  const { email, plan, expiresAt } = params;

  const planLabel = plan === "monthly" ? "Mensal (R$ 19,90/mês)" : "Anual (R$ 149,90/ano)";
  const expires = new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu acesso ao PersonalDiet está liberado! 🎉</title>
</head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:'Nunito','Segoe UI',sans-serif;color:#292524;">

  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">

    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#9333ea);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;">♥</div>
      <span style="font-weight:800;font-size:20px;color:#292524;">PersonalDiet</span>
    </div>

    <!-- Card -->
    <div style="background:#fff;border:1px solid #e7e5e4;border-radius:20px;padding:32px;">

      <h1 style="font-size:26px;color:#292524;margin:0 0 8px;">Pagamento aprovado! 🎉</h1>
      <p style="color:#a8a29e;font-size:14px;margin:0 0 24px;">Seu acesso ao PersonalDiet está liberado.</p>

      <div style="background:#f5f3f2;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 12px;font-size:15px;"><strong>Plano:</strong> ${planLabel}</p>
        <p style="margin:0 0 12px;font-size:15px;"><strong>Válido até:</strong> ${expires}</p>
        <p style="margin:0;font-size:15px;"><strong>Login:</strong> ${email}</p>
      </div>

      <h2 style="font-size:18px;color:#292524;margin:24px 0 12px;">Como acessar o app</h2>
      <ol style="color:#57534e;font-size:15px;line-height:1.8;padding-left:20px;">
        <li>Clique no botão abaixo para abrir o app</li>
        <li>Entre com seu email e a senha que você criou no cadastro</li>
        <li>Pronto! Seu cardápio semanal já está esperando 🍽️</li>
      </ol>

      <a href="https://nutri-ai-5qaa.vercel.app"
         style="display:inline-block;background:linear-gradient(135deg,#ec4899,#9333ea);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px;margin:20px 0;">
        Acessar o PersonalDiet →
      </a>

      <h2 style="font-size:18px;color:#292524;margin:32px 0 12px;">O que você pode fazer agora</h2>
      <ul style="color:#57534e;font-size:15px;line-height:1.8;padding-left:20px;">
        <li>✅ Gerar cardápios semanais personalizados com IA</li>
        <li>✅ Importar receitas do TikTok, Reels e YouTube</li>
        <li>�️ Registrar restrições alimentares (glúten, lactose, etc.)</li>
        <li>✅ Acompanhar seus medicamentos (Ozempic, Mounjaro)</li>
        <li>✅ Gerar lista de compras automática</li>
      </ul>

      <div style="border-top:1px solid #e7e5e4;margin-top:32px;padding-top:20px;">
        <p style="font-size:13px;color:#a8a29e;margin:0;">
          Dúvidas? Responda este email que a gente te ajuda.<br/>
          PersonalDiet — Cozinhe com o que você tem em casa.
        </p>
      </div>

    </div>

    <p style="text-align:center;font-size:12px;color:#a8a29e;margin-top:20px;">
      Você recebeu este email porque assinou o PersonalDiet.
    </p>

  </div>
</body>
</html>
  `.trim();

  const text = `PersonalDiet — Pagamento aprovado!

Seu acesso está liberado.
Plano: ${planLabel}
Válido até: ${expires}
Login: ${email}

Acesse: https://nutri-ai-5qaa.vercel.app

PersonalDiet — Cozinhe com o que você tem em casa.`;

  const resend = getResend();
  if (!resend) {
    logger("warn", "Email de boas-vindas nao enviado (sem RESEND_API_KEY)", { email });
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Seu acesso ao PersonalDiet está liberado! 🎉",
      html,
      text,
    });

    if (error) {
      logger("error", "Erro ao enviar email de boas-vindas", { error: error.message });
    } else {
      logger("info", "Email de boas-vindas enviado", { email, id: data?.id });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger("error", "Exceção ao enviar email", { error: errMsg });
  }
}
