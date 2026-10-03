import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { getSession, getSessionSeats } from "../../../api/sessions";
import { useAuth } from "../useAuth";
import type { SeatMap } from "../../../types/sessions";

const publicMap = (previous: SeatMap | undefined) => previous && ({
  ...previous,
  sections: previous.sections.map((section) => ({ ...section, rows: section.rows.map((row) => ({
    ...row, seats: row.seats.map((seat) => ({ ...seat, isMine: false })),
  })) })),
});

const validId = (id: number) => Number.isSafeInteger(id) && id > 0;

export const useSession = (sessionId: number) => useQuery({
  queryKey: ["session", sessionId],
  queryFn: ({ signal }) => getSession(sessionId, signal),
  enabled: validId(sessionId),
});

export const useSessionSeats = (sessionId: number) => {
  const { user, isLoading } = useAuth();
  const placeholderData = useCallback((previous: SeatMap | undefined) =>
    previous?.sessionId === sessionId ? publicMap(previous) : undefined, [sessionId]);
  return useQuery<SeatMap>({
    // isMine is personalized; never share an authenticated map with a guest.
    queryKey: ["session-seats", sessionId, user?.id ?? null],
    queryFn: ({ signal }) => getSessionSeats(sessionId, signal),
    enabled: validId(sessionId) && !isLoading,
    staleTime: 0,
    refetchOnMount: "always",
    // Keep the booking UI mounted during sign-in, without retaining another
    // account's ownership flags. Interaction stays disabled until refetch ends.
    placeholderData,
  });
};
