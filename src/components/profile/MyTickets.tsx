import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useRefund, useTickets } from "../../features/profile/useTickets";
import type { TicketFilter } from "../../api/tickets";
import type { Order } from "../../types/booking";

import { bookingError } from "../../utils/booking";
import TicketCard from "./TicketCard";
import RefundDialog from "./RefundDialog";

type MyTicketsProps = {
  requestLogin: (retry: () => Promise<void>) => void;
};

const MyTickets = ({ requestLogin }: MyTicketsProps) => {
  const [filter, setFilter] = useState<TicketFilter>("upcoming");

  const tickets = useTickets(filter);
  const refund = useRefund();

  const [selected, setSelected] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lock = useRef(false);

  const recoverSession = useEffectEvent(() => {
    if (bookingError(tickets.error).status === 401) {
      requestLogin(async () => {
        await tickets.refetch();
      });
    }
  });

  useEffect(() => {
    recoverSession();
  }, [tickets.error]);

  const confirm = async (order: Order) => {
    if (lock.current || !order.isRefundable) return;

    lock.current = true;
    setError("");
    setNotice("");

    try {
      const updated = await refund.mutateAsync(order.reference);

      setSelected(null);

      setNotice(
        `Order #${updated.reference} ${
          updated.status === "refunded"
            ? "refunded. You can find it in Past tickets."
            : "updated."
        }`,
      );
    } catch (failure) {
      const detail = bookingError(failure);

      setError(
        detail.message ?? "Unable to refund your tickets. Please try again.",
      );

      if (detail.status === 401) {
        requestLogin(() => confirm(order));
      }

      if (detail.status === 422 || detail.status === 403) {
        const refreshed = await tickets.refetch();

        const current = refreshed.data?.find((item) => item.id === order.id);

        setSelected(current ?? { ...order, isRefundable: false });
      }
    } finally {
      lock.current = false;
    }
  };

  const loadError = bookingError(tickets.error);

  return (
    <section aria-label="My Tickets" className="w-full">
      {/* Upcoming / Past filter */}
      <div
        role="tablist"
        aria-label="Ticket filters"
        className="inline-flex items-center rounded-xl bg-[#1E2031] p-1"
      >
        {(["upcoming", "past"] as const).map((tab, index) => (
          <button
            key={tab}
            id={`ticket-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={filter === tab}
            aria-controls={`tickets-${tab}`}
            tabIndex={filter === tab ? 0 : -1}
            onClick={() => setFilter(tab)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                return;
              }

              event.preventDefault();

              const next =
                event.key === "Home"
                  ? "upcoming"
                  : event.key === "End"
                    ? "past"
                    : index === 0
                      ? "past"
                      : "upcoming";

              setFilter(next);

              document.getElementById(`ticket-tab-${next}`)?.focus();
            }}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === tab
                ? "bg-[#303242] text-white"
                : "text-[#A9A9A9] hover:text-white"
            }`}
          >
            {tab === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      {/* Success notification */}
      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-[#4ADE80]/10 p-4 text-sm text-[#4ADE80]"
        >
          {notice}
        </p>
      )}

      {/* Tickets */}
      <div
        role="tabpanel"
        id={`tickets-${filter}`}
        aria-labelledby={`ticket-tab-${filter}`}
        aria-busy={tickets.isFetching}
        className="mt-5 space-y-5"
      >
        {tickets.isPending && (
          <p role="status" className="py-10 text-center text-sm text-[#A9A9A9]">
            Loading tickets...
          </p>
        )}

        {tickets.isError && (
          <div
            role="alert"
            className="rounded-xl bg-[#EC3013]/10 p-4 text-sm text-[#FF725A]"
          >
            <p>{loadError.message ?? "Unable to load your tickets."}</p>

            <button
              type="button"
              className="mt-2 cursor-pointer font-semibold underline"
              onClick={() => {
                if (loadError.status === 401) {
                  requestLogin(async () => {
                    await tickets.refetch();
                  });
                } else {
                  void tickets.refetch();
                }
              }}
            >
              {loadError.status === 401 ? "Log in to continue" : "Retry"}
            </button>
          </div>
        )}

        {!tickets.isError && tickets.data?.length === 0 && (
          <div className="py-12 text-center">
            <h2 className="text-lg font-semibold">
              {filter === "upcoming"
                ? "No upcoming tickets"
                : "No past tickets"}
            </h2>

            <p className="mt-2 text-sm text-[#A9A9A9]">
              {filter === "upcoming"
                ? "Your next cinema visit starts here."
                : "Your completed visits and refunded orders will appear here."}
            </p>

            {filter === "upcoming" && (
              <Link
                to="/sessions"
                className="mt-5 inline-block rounded-full bg-[#EC3013] px-6 py-3 text-sm font-extrabold"
              >
                Browse sessions
              </Link>
            )}
          </div>
        )}

        {loadError.status !== 401 &&
          tickets.data?.map((order) => (
            <TicketCard
              key={order.id}
              order={order}
              onRefund={(next) => {
                setSelected(next);
                setError("");
              }}
            />
          ))}
      </div>

      {/* Refund confirmation modal */}
      {selected && (
        <RefundDialog
          order={selected}
          busy={refund.isPending}
          error={error}
          onClose={() => setSelected(null)}
          onConfirm={() => void confirm(selected)}
        />
      )}
    </section>
  );
};

export default MyTickets;
