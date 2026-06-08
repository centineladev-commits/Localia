import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Localia <hello@localia.es>";
const CONTACT_EMAIL = "hello@localia.es";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "El correo electrónico es obligatorio." }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: "El mensaje es obligatorio." }, { status: 400 });
    }

    const subjectLabel = subject?.trim() || "Sin asunto";
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    // Build HTML for internal notification email
    const internalHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px 20px">
      <p style="margin:0;font-size:20px;font-weight:900;color:#fff">Localia — Nuevo mensaje de contacto</p>
    </div>
    <div style="padding:28px 32px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#6b7280;width:100px;vertical-align:top">Nombre</td>
          <td style="padding:8px 0;font-size:14px;color:#111827">${trimmedName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#6b7280;vertical-align:top">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#4f46e5"><a href="mailto:${trimmedEmail}" style="color:#4f46e5">${trimmedEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;font-weight:700;color:#6b7280;vertical-align:top">Asunto</td>
          <td style="padding:8px 0;font-size:14px;color:#111827">${subjectLabel}</td>
        </tr>
      </table>
      <div style="margin-top:16px;background:#f9fafb;border-radius:10px;padding:16px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Mensaje</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${trimmedMessage}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#d1d5db">© Localia · El comercio local, digitalizado</p>
    </div>
  </div>
</body>
</html>`;

    // Build HTML for confirmation email to the user
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff">Localia</p>
      <p style="margin:8px 0 0;font-size:14px;color:#c7d2fe">El mercado local a tu alcance</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 12px">Hola, ${trimmedName}.</p>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px">
        Hemos recibido tu mensaje y te responderemos en menos de <strong>48 horas laborables</strong>.
      </p>
      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Tu mensaje</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap">${trimmedMessage}</p>
      </div>
      <p style="font-size:14px;color:#6b7280;margin:0">
        Si tienes alguna pregunta urgente, puedes escribirnos directamente a
        <a href="mailto:${CONTACT_EMAIL}" style="color:#4f46e5">${CONTACT_EMAIL}</a>.
      </p>
    </div>
    <div style="background:#f9fafb;padding:18px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#d1d5db">© Localia · El comercio local, digitalizado</p>
    </div>
  </div>
</body>
</html>`;

    if (!resend) {
      console.log("[contact] RESEND_API_KEY no configurada — email simulado:", {
        from: trimmedName,
        email: trimmedEmail,
        subject: subjectLabel,
        message: trimmedMessage,
      });
      return NextResponse.json({ success: true });
    }

    await Promise.allSettled([
      // Internal notification to the Localia team
      resend.emails.send({
        from: FROM,
        to: CONTACT_EMAIL,
        replyTo: trimmedEmail,
        subject: `Contacto: ${subjectLabel} — ${trimmedName}`,
        html: internalHtml,
      }),
      // Confirmation to the user
      resend.emails.send({
        from: FROM,
        to: trimmedEmail,
        subject: "Hemos recibido tu mensaje — Localia",
        html: confirmationHtml,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[contact]", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
