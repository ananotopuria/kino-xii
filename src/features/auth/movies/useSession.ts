import { useQuery } from "@tanstack/react-query";
import { getSession, getSessionSeats } from "../../../api/sessions";
import { useAuth } from "../useAuth";

const validId = (id: number) => Number.isSafeInteger(id) && id > 0;

export const useSession = (sessionId: number) => useQuery({
  queryKey: ["session", sessionId],
  queryFn: ({ signal }) => getSession(sessionId, signal),
  enabled: validId(sessionId),
});

export const useSessionSeats = (sessionId: number) => {
  const { user, isLoading } = useAuth();
  return useQuery({
    // isMine is personalized; never share an authenticated map with a guest.
    queryKey: ["session-seats", sessionId, user?.id ?? null],
    queryFn: ({ signal }) => getSessionSeats(sessionId, signal),
    enabled: validId(sessionId) && !isLoading,
    staleTime: 0,
    refetchOnMount: "always",
  });
};
