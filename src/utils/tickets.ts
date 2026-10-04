import type { QueryClient } from "@tanstack/react-query";
import type { Order } from "../types/booking";

export const syncRefundedOrder = async (client: QueryClient, userId: number, order: Order) => {
  // Cancel older reads so they cannot overwrite the successful refund response.
  await client.cancelQueries({ queryKey: ["tickets", userId] });
  for (const filter of ["upcoming", "past"] as const) {
    client.setQueryData<Order[]>(["tickets", userId, filter], (cached) => {
      // Do not turn a never-fetched Past tab into an incomplete one-order list.
      if (!cached) return cached;
      const rest = cached.filter((item) => item.id !== order.id);
      const belongs = filter === "upcoming" ? order.isUpcoming : !order.isUpcoming;
      return belongs ? [...rest, order].sort((a, b) => b.session.startsAt.localeCompare(a.session.startsAt)) : rest;
    });
  }
  await client.invalidateQueries({ queryKey: ["tickets", userId] });
};
