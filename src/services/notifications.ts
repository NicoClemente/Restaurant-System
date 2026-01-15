import { Resend } from "resend";

import { env } from "@/lib/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const sendOrderConfirmation = async (params: {
  to: string;
  restaurantName: string;
  orderNumber: number;
  trackingUrl?: string;
}) => {
  if (!resend) return;

  await resend.emails.send({
    from: "Orders <no-reply@restaurant.local>",
    to: params.to,
    subject: `Pedido #${params.orderNumber} confirmado`,
    html: `
      <p>Gracias por tu pedido en ${params.restaurantName}.</p>
      <p>Tu número de pedido es <strong>#${params.orderNumber}</strong>.</p>
      ${
        params.trackingUrl
          ? `<p>Seguimiento: <a href="${params.trackingUrl}">${params.trackingUrl}</a></p>`
          : ""
      }
    `,
  });
};
