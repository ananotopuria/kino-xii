import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../../../api/sessions";
import type { SessionsParams } from "../../../types/sessions";

export const useSessions = (params: SessionsParams, enabled = true) =>
  useQuery({
    queryKey: ["sessions", params],
    queryFn: ({ signal }) => getSessions(params, signal),
    enabled,
  });
