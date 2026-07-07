import { Resend } from "resend";
import { logUsage } from "@/lib/api-usage";

export const EMAIL_FROM = "Assist RS <onboarding@resend.dev>";
export const EMAIL_TO = "sv7hrj3vz@mozmail.com";

/** Gabarit HTML simple aux couleurs de l'app — encadre le contenu propre à chaque e-mail. */
export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#F6F2EA;font-family:Georgia,serif;color:#1C1917;">
    <table role="presentation" width="100%" style="background:#F6F2EA;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" style="max-width:92%;background:#ffffff;border:2px solid #1C1917;">
            <tr>
              <td style="background:#DE2F2C;color:#ffffff;padding:16px 24px;">
                <p style="margin:0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Assist RS</p>
                <h1 style="margin:4px 0 0;font-size:22px;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px;border-top:1px solid #e5e0d5;font-family:Arial,sans-serif;font-size:11px;color:#78716c;">
                Généré avec Assist RS
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/** Envoi d'e-mail — échec propre : logue et continue, ne casse jamais l'appelant (cron notamment). */
export async function sendEmail(subject: string, html: string, action: string): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.error(`[resend] ${action} : RESEND_API_KEY manquant, e-mail non envoyé`);
    return { ok: false, error: "RESEND_API_KEY manquant." };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: EMAIL_FROM, to: EMAIL_TO, subject, html });
    await logUsage("resend", action, 0);
    return { ok: true };
  } catch (e) {
    console.error(`[resend] ${action} échoué`, e);
    return { ok: false, error: "L'envoi de l'e-mail a échoué." };
  }
}
