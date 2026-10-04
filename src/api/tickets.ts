import { apiClient } from "./client";
import type { Order } from "../types/booking";

export type TicketFilter = "upcoming" | "past";

export const getTickets = async (filter: TicketFilter, signal?: AbortSignal) => {
  const response = await apiClient.get<{ data: Order[] }>("/tickets", { params: { filter }, signal });
  return response.data.data;
};

export const refundOrder = async (reference: string) => {
  const response = await apiClient.post<{ data: Order }>(`/orders/${encodeURIComponent(reference)}/refund`);
  return response.data.data;
};
