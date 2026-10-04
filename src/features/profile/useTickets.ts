import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTickets, refundOrder, type TicketFilter } from "../../api/tickets";
import { useAuth } from "../auth/useAuth";
import { syncRefundedOrder } from "../../utils/tickets";

export const useTickets = (filter: TicketFilter) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tickets", user?.id, filter],
    queryFn: ({ signal }) => getTickets(filter, signal),
    enabled: Boolean(user), retry: false,
  });
};

export const useRefund = () => {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: refundOrder, retry: false,
    onSuccess: async (order) => {
      if (!user) return;
      await syncRefundedOrder(client, user.id, order);
      await client.invalidateQueries({ queryKey: ["session-seats", order.session.id] });
    },
  });
};
