import { auth } from "@/lib/auth";
import { assertRestaurantPermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/permissions";
import { subscribeOrderEvents } from "@/services/realtime";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return Response.json({ error: "restaurantId is required" }, { status: 400 });
  }

  const session = await auth();
  try {
    assertRestaurantPermission(session, restaurantId, PERMISSIONS.ORDERS_VIEW);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: {
        type: string;
        orderId: string;
        payload?: Record<string, unknown>;
      }) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event.type}\n` +
              `data: ${JSON.stringify(event)}\n\n`,
          ),
        );
      };

      unsubscribe = subscribeOrderEvents(restaurantId, send);

      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));

      const ping = setInterval(() => {
        controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
      }, 25000);

      return () => {
        clearInterval(ping);
        unsubscribe?.();
      };
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
