import { apiClient } from "./client";
import type { HoldRequest, Order, OrderRequest, SeatHold } from "../types/booking";

export const createHold = async (sessionId: number, request: HoldRequest) => {
  const response = await apiClient.post<{ data: SeatHold }>(`/sessions/${sessionId}/holds`, request);
  return response.data.data;
};

export const getHold = async (holdId: string, signal?: AbortSignal) => {
  const response = await apiClient.get<{ data: SeatHold }>(`/holds/${encodeURIComponent(holdId)}`, { signal });
  return response.data.data;
};

export const releaseHold = async (holdId: string) => {
  await apiClient.delete(`/holds/${encodeURIComponent(holdId)}`);
};

export const createOrder = async (request: OrderRequest) => {
  const response = await apiClient.post<{ data: Order }>("/orders", request);
  return response.data.data;
};
