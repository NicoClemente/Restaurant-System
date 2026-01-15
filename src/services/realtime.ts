import { EventEmitter } from "events";

type OrderEvent = {
  restaurantId: string;
  type: "ORDER_PLACED" | "ORDER_UPDATED" | "ORDER_CANCELLED";
  orderId: string;
  payload?: Record<string, unknown>;
};

const emitter = new EventEmitter();

export const publishOrderEvent = (event: OrderEvent) => {
  emitter.emit(`orders:${event.restaurantId}`, event);
};

export const subscribeOrderEvents = (
  restaurantId: string,
  listener: (event: OrderEvent) => void,
) => {
  const channel = `orders:${restaurantId}`;
  emitter.on(channel, listener);
  return () => emitter.off(channel, listener);
};
