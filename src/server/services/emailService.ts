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
const APP_URL = "https://nutri-ai-5qaa.vercel.app";

// Design tokens do app (src/index.css + componentes):
// gradiente brand: #ec4899 (pink-500) -> #9333ea (purple-600)
// fundo: #fafaf9 (stone-50) | texto: #292524 (stone-800) | muted: #a8a29e (stone-400)
// bordas: #e7e5e4 (stone-200) | headings: Nunito | corpo: Quicksand

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

  // Opcional: link do video de onboarding (YouTube nao listado).
  // Quando ONBOARDING_VIDEO_URL estiver configurada no Vercel, o bloco do
  // video aparece automaticamente no email.
  const videoUrl = cleanEnv(process.env.ONBOARDING_VIDEO_URL);

  const heading = "font-family:'Nunito','Quicksand','Segoe UI',Arial,sans-serif;letter-spacing:-0.02em;";
  const body = "font-family:'Quicksand','Nunito','Segoe UI',Arial,sans-serif;";

  const videoBlock = videoUrl
    ? `
      <!-- Video de onboarding -->
      <tr>
        <td style="padding:0 32px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:16px;">
            <tr>
              <td style="padding:20px 24px;">
                <p style="${heading}font-size:16px;font-weight:800;color:#292524;margin:0 0 6px;">🎬 Comece por aqui</p>
                <p style="${body}font-size:14px;color:#57534e;margin:0 0 14px;line-height:1.6;">
                  Gravei um vídeo rapidinho te mostrando como usar cada função do app — do primeiro cardápio ao escaner de despensa.
                </p>
                <a href="${videoUrl}"
                   style="${heading}display:inline-block;background:#9333ea;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;">
                  ▶&nbsp; Assistir: como usar o PersonalDiet
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <title>Seu acesso ao PersonalDiet está liberado! 🎉</title>
</head>
<body style="margin:0;padding:0;background:#fafaf9;${body}color:#292524;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40" height="40" align="center" valign="middle" bgcolor="#ec4899"
                      style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#9333ea);color:#ffffff;font-size:20px;line-height:40px;">♥</td>
                  <td style="${heading}padding-left:10px;font-weight:800;font-size:20px;color:#292524;">PersonalDiet</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e5e4;border-radius:24px;overflow:hidden;">

                <!-- Faixa gradiente de topo (identidade do app) -->
                <tr>
                  <td height="8" bgcolor="#ec4899" style="height:8px;background:linear-gradient(90deg,#ec4899,#9333ea);font-size:0;line-height:0;">&nbsp;</td>
                </tr>

                <!-- Titulo -->
                <tr>
                  <td style="padding:32px 32px 8px;">
                    <h1 style="${heading}font-size:26px;font-weight:800;color:#292524;margin:0 0 8px;">Pagamento aprovado! 🎉</h1>
                    <p style="${body}font-size:13px;color:#a8a29e;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0;">Seu acesso Premium está liberado</p>
                  </td>
                </tr>

                <!-- Resumo do plano -->
                <tr>
                  <td style="padding:24px 32px 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border:1px solid #f5f5f4;border-radius:16px;">
                      <tr><td style="${body}padding:18px 24px 4px;font-size:15px;color:#292524;"><strong style="${heading}">Plano:</strong> ${planLabel}</td></tr>
                      <tr><td style="${body}padding:4px 24px;font-size:15px;color:#292524;"><strong style="${heading}">Válido até:</strong> ${expires}</td></tr>
                      <tr><td style="${body}padding:4px 24px 18px;font-size:15px;color:#292524;"><strong style="${heading}">Login:</strong> ${email}</td></tr>
                    </table>
                  </td>
                </tr>

                ${videoBlock}

                <!-- CTA principal -->
                <tr>
                  <td align="center" style="padding:20px 32px 8px;">
                    <a href="${APP_URL}"
                       style="${heading}display:block;background:#ec4899;background:linear-gradient(135deg,#ec4899,#9333ea);color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;padding:16px 32px;border-radius:14px;text-align:center;">
                      Acessar o PersonalDiet →
                    </a>
                    <p style="${body}font-size:13px;color:#a8a29e;margin:10px 0 0;">
                      Entre com seu email e a senha criada no cadastro. No celular, aceite o convite de <strong>instalar o app</strong> na tela inicial. 📲
                    </p>
                  </td>
                </tr>

                <!-- O que voce pode fazer -->
                <tr>
                  <td style="padding:20px 32px 4px;">
                    <h2 style="${heading}font-size:18px;font-weight:800;color:#292524;margin:0 0 12px;">O que você pode fazer agora</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">✅&nbsp; Gerar cardápios semanais ilimitados com IA</td></tr>
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">📸&nbsp; Escanear sua geladeira e cozinhar com o que tem em casa</td></tr>
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">🍝&nbsp; Importar receitas do TikTok, Reels e YouTube</td></tr>
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">🛡️&nbsp; Registrar restrições (glúten, lactose, alergias) — a IA respeita tudo</td></tr>
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">💉&nbsp; Acompanhar seu tratamento (Ozempic, Mounjaro) e sintomas</td></tr>
                      <tr><td style="${body}padding:5px 0;font-size:15px;color:#57534e;line-height:1.6;">🛒&nbsp; Gerar lista de compras automática da semana</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Garantia -->
                <tr>
                  <td style="padding:20px 32px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:16px;">
                      <tr>
                        <td style="${body}padding:16px 24px;font-size:14px;color:#166534;line-height:1.6;">
                          🛡️ <strong style="${heading}">Garantia de 7 dias.</strong> Não gostou? Devolvemos 100%, sem perguntas — é só responder este email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Rodape do card -->
                <tr>
                  <td style="padding:0 32px 28px;border-top:1px solid #f5f5f4;">
                    <p style="${body}font-size:13px;color:#a8a29e;margin:20px 0 0;line-height:1.7;">
                      Dúvidas? Responda este email que a gente te ajuda. 💌<br/>
                      <strong style="${heading}color:#78716c;">PersonalDiet</strong> — Cozinhe com o que você tem em casa.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 8px 0;">
              <p style="${body}font-size:12px;color:#a8a29e;margin:0;line-height:1.8;">
                Você recebeu este email porque assinou o PersonalDiet.<br/>
                <a href="${APP_URL}/termos-de-uso" style="color:#a8a29e;text-decoration:underline;">Termos de Uso</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/politica-de-privacidade" style="color:#a8a29e;text-decoration:underline;">Política de Privacidade</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `PersonalDiet — Pagamento aprovado!

Seu acesso Premium está liberado.
Plano: ${planLabel}
Válido até: ${expires}
Login: ${email}
${videoUrl ? `\nComece por aqui — vídeo de como usar o app: ${videoUrl}\n` : ""}
Acesse: ${APP_URL}

Garantia de 7 dias: não gostou, devolvemos 100% — é só responder este email.

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
