import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "Localia <pedidos@localia.es>";

export interface OrderEmailData {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  shopName: string;
  shopEmail?: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  platformFee: number;
  total: number;
  deliveryType: "pickup" | "local_delivery";
  deliveryAddress?: string;
  createdAt: string;
}

function orderSummaryHtml(d: OrderEmailData, forShop: boolean) {
  const itemRows = d.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151">${i.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:center">×${i.qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;text-align:right;font-weight:700">${(i.price * i.qty).toFixed(2)} €</td>
        </tr>`
    )
    .join("");

  const delivery =
    d.deliveryType === "pickup"
      ? `<p style="margin:4px 0;font-size:14px;color:#374151">📍 <strong>Recogida en tienda</strong></p>`
      : `<p style="margin:4px 0;font-size:14px;color:#374151">🛵 <strong>Entrega local</strong> — ${d.deliveryAddress ?? ""}</p>`;

  const greeting = forShop
    ? `¡Tienes un nuevo pedido en <strong>${d.shopName}</strong>!`
    : `Tu pedido en <strong>${d.shopName}</strong> ha sido confirmado.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff">Localia 🛍️</p>
      <p style="margin:8px 0 0;font-size:14px;color:#c7d2fe">El mercado local a tu alcance</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 16px">${greeting}</p>

      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Nº de pedido</p>
        <p style="margin:0;font-size:15px;font-weight:800;color:#4f46e5;font-family:monospace">${d.orderId.slice(0, 8).toUpperCase()}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #f0f0f0">Producto</th>
            <th style="text-align:center;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #f0f0f0">Ud.</th>
            <th style="text-align:right;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #f0f0f0">Precio</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="border-top:2px solid #f0f0f0;padding-top:14px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:#6b7280">Subtotal</span>
          <span style="font-size:13px;color:#374151;font-weight:600">${d.subtotal.toFixed(2)} €</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:13px;color:#6b7280">Comisión plataforma</span>
          <span style="font-size:13px;color:#374151">${d.platformFee.toFixed(2)} €</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #f0f0f0">
          <span style="font-size:16px;font-weight:900;color:#111827">Total pagado</span>
          <span style="font-size:16px;font-weight:900;color:#4f46e5">${d.total.toFixed(2)} €</span>
        </div>
      </div>

      <div style="background:#f0fdf4;border-radius:10px;padding:14px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase">Entrega</p>
        ${delivery}
      </div>

      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">${new Date(d.createdAt).toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}</p>
    </div>
    <div style="background:#f9fafb;padding:18px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#d1d5db">© Localia · El comercio local, digitalizado</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Plantilla genérica reutilizable ──────────────────────────────────────────
function emailShell(heading: string, bodyHtml: string) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.06)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 32px 24px">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff">Localia 🛍️</p>
      <p style="margin:8px 0 0;font-size:14px;color:#c7d2fe">El mercado local a tu alcance</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 16px">${heading}</p>
      ${bodyHtml}
    </div>
    <div style="background:#f9fafb;padding:18px 32px;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;font-size:12px;color:#d1d5db">© Localia · El comercio local, digitalizado</p>
    </div>
  </div>
</body></html>`;
}

export interface ReturnRequestedData {
  sellerEmail?: string;
  orderId: string;
  shopName: string;
  buyerName: string;
  reason: string;
  amount: number;
}

/** Email al VENDEDOR cuando un comprador solicita una devolución. */
export async function sendReturnRequestedEmail(d: ReturnRequestedData) {
  if (!resend || !d.sellerEmail) {
    console.log("[email] devolución solicitada (simulado):", d.orderId);
    return;
  }
  const body = `
    <p style="font-size:14px;color:#374151;margin:0 0 16px">${d.buyerName} ha solicitado la devolución del pedido
      <strong>#${d.orderId.slice(0, 8).toUpperCase()}</strong> en <strong>${d.shopName}</strong>.</p>
    <div style="background:#fef2f2;border-radius:12px;padding:16px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase">Motivo</p>
      <p style="margin:0;font-size:14px;color:#374151">${d.reason}</p>
    </div>
    <p style="font-size:14px;color:#374151;margin:0 0 16px">Importe a reembolsar: <strong>${d.amount.toFixed(2)} €</strong></p>
    <p style="font-size:13px;color:#6b7280;margin:0">Gestiona la solicitud (aceptar o rechazar) desde tu panel de comercio → Devoluciones.</p>`;
  await resend.emails.send({
    from: FROM, to: d.sellerEmail,
    subject: `↩️ Nueva solicitud de devolución — pedido #${d.orderId.slice(0, 8).toUpperCase()}`,
    html: emailShell("Solicitud de devolución recibida", body),
  });
}

export interface ReturnResolvedData {
  buyerEmail?: string;
  orderId: string;
  shopName: string;
  status: "accepted" | "rejected" | "completed";
  note?: string;
  amount: number;
}

/** Email al COMPRADOR cuando cambia el estado de su devolución. */
export async function sendReturnResolvedEmail(d: ReturnResolvedData) {
  if (!resend || !d.buyerEmail) {
    console.log("[email] devolución resuelta (simulado):", d.orderId, d.status);
    return;
  }
  const map = {
    accepted:  { subj: "aceptada", line: `Tu devolución ha sido aceptada. Se ha emitido un reembolso de <strong>${d.amount.toFixed(2)} €</strong>.`, color: "#ecfdf5" },
    completed: { subj: "completada", line: `El reembolso de <strong>${d.amount.toFixed(2)} €</strong> de tu devolución se ha completado.`, color: "#ecfdf5" },
    rejected:  { subj: "rechazada", line: `Tu solicitud de devolución ha sido rechazada por el vendedor.`, color: "#fef2f2" },
  }[d.status];
  const noteHtml = d.note
    ? `<div style="background:#f9fafb;border-radius:12px;padding:14px;margin-bottom:16px"><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase">Nota</p><p style="margin:0;font-size:14px;color:#374151">${d.note}</p></div>`
    : "";
  const body = `
    <div style="background:${map.color};border-radius:12px;padding:16px;margin-bottom:16px">
      <p style="margin:0;font-size:14px;color:#374151">${map.line}</p>
    </div>
    ${noteHtml}
    <p style="font-size:13px;color:#6b7280;margin:0">Pedido <strong>#${d.orderId.slice(0, 8).toUpperCase()}</strong> · ${d.shopName}</p>`;
  await resend.emails.send({
    from: FROM, to: d.buyerEmail,
    subject: `↩️ Tu devolución ha sido ${map.subj} — pedido #${d.orderId.slice(0, 8).toUpperCase()}`,
    html: emailShell(`Devolución ${map.subj}`, body),
  });
}

export async function sendOrderConfirmationEmails(data: OrderEmailData) {
  if (!resend) {
    console.log("[email] RESEND_API_KEY no configurada — email simulado:", data.orderId);
    return;
  }

  const htmlBuyer = orderSummaryHtml(data, false);
  const htmlShop  = orderSummaryHtml(data, true);

  await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: data.buyerEmail,
      subject: `✅ Pedido confirmado en ${data.shopName} — ${data.total.toFixed(2)} €`,
      html: htmlBuyer,
    }),
    data.shopEmail
      ? resend.emails.send({
          from: FROM,
          to: data.shopEmail,
          subject: `🛍️ Nuevo pedido recibido — ${data.total.toFixed(2)} €`,
          html: htmlShop,
        })
      : Promise.resolve(),
  ]);
}
