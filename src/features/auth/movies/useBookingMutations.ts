import { useMutation } from "@tanstack/react-query";
import { createHold, createOrder, releaseHold } from "../../../api/booking";
import type { HoldRequest } from "../../../types/booking";

export const useBookingMutations = (sessionId: number) => ({
  createHold: useMutation({ mutationFn: (request: HoldRequest) => createHold(sessionId, request), retry: false }),
  releaseHold: useMutation({ mutationFn: releaseHold, retry: false }),
  // Payment inputs must not remain in an inactive mutation cache.
  createOrder: useMutation({ mutationFn: createOrder, retry: false, gcTime: 0 }),
});
