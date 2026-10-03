import { apiClient } from "./client";
import type { SeatMap, SessionDetails, SessionsParams, SessionsResponse } from "../types/sessions";
import { sessionsQuery } from "../utils/sessionFilters";

export const getSessions = async (params: SessionsParams, signal?: AbortSignal): Promise<SessionsResponse> => {
  const response = await apiClient.get<SessionsResponse>("/sessions", {
    params: sessionsQuery(params),
    signal,
  });
  return response.data;
};

export const getSession = async (sessionId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<{ data: SessionDetails }>(`/sessions/${sessionId}`, { signal });
  return response.data.data;
};

export const getSessionSeats = async (sessionId: number, signal?: AbortSignal) => {
  const response = await apiClient.get<{ data: SeatMap }>(`/sessions/${sessionId}/seats`, { signal });
  return response.data.data;
};
