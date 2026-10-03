import { apiClient } from "./client";
import type { SessionsParams, SessionsResponse } from "../types/sessions";
import { sessionsQuery } from "../utils/sessionFilters";

export const getSessions = async (params: SessionsParams, signal?: AbortSignal): Promise<SessionsResponse> => {
  const response = await apiClient.get<SessionsResponse>("/sessions", {
    params: sessionsQuery(params),
    signal,
  });
  return response.data;
};
