import type { Order } from "../../types/booking";
import { money, shortSessionDate } from "../../utils/booking";

type TicketCardProps = {
  order: Order;
  onRefund: (order: Order) => void;
};

const TicketCard = ({ order, onRefund }: TicketCardProps) => {
  const { session } = order;

  const unavailable =
    "Refunds are unavailable within 2 hours of the session starting.";

  return (
    <article className="overflow-hidden rounded-3xl bg-[#1E2031] text-white">
      <div className="flex flex-col lg:flex-row">
        {/* LEFT SIDE */}
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:flex-row sm:gap-6 sm:p-7">
          {/* Movie poster */}
          <img
            src={session.movie.posterUrl}
            alt={session.movie.title}
            className="h-37.5 w-26.25 shrink-0 rounded-xl object-cover"
          />

          {/* Movie details */}
          <div className="min-w-0 flex-1">
            {/* Title and rating */}
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-extrabold text-white">
                {session.movie.title}
              </h3>

              <span className="rounded-full bg-[#FF3217]/10 px-2.5 py-1 text-xs font-bold text-[#FF3217]">
                {session.movie.ageRating.code}
              </span>

              <span className="text-sm text-[#A9A9A9]">
                {session.movie.runtimeMinutes} min
              </span>
            </div>

            {/* Session details */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A9A9A9]">
                  Date
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {shortSessionDate(session.date)} · {session.time}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A9A9A9]">
                  Venue
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {session.venue.name} · Hall {session.hall.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#A9A9A9]">
                  Format
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {session.format.name} · {session.language.name}
                </p>
              </div>
            </div>

            {/* Seats */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[#A9A9A9]">
                Seats
              </span>

              {order.tickets.map((ticket) => (
                <span
                  key={ticket.id}
                  className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                >
                  {ticket.seatCode} · {ticket.ticketType.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex w-full flex-col justify-between gap-6 border-t border-white/10 p-5 sm:p-7 lg:w-67.5 lg:shrink-0 lg:border-t-0 lg:border-l lg:border-dashed">
          {/* Order reference */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A9A9A9]">
              Order
            </p>

            <p className="mt-1 break-all text-sm font-bold">
              #{order.reference}
            </p>
          </div>

          {/* Price and refund */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[#A9A9A9]">
                {order.status === "refunded" ? "Total refunded" : "Total paid"}
              </span>

              <span className="text-2xl font-extrabold">
                ₾{money(order.totalPrice)}
              </span>
            </div>

            {order.isUpcoming && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (order.isRefundable) {
                      onRefund(order);
                    }
                  }}
                  disabled={!order.isRefundable}
                  aria-describedby={
                    !order.isRefundable
                      ? `refund-reason-${order.id}`
                      : undefined
                  }
                  className="w-full cursor-pointer rounded-full bg-[#353747] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#444658] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Refund
                </button>

                {!order.isRefundable && (
                  <p
                    id={`refund-reason-${order.id}`}
                    className="mt-2 text-center text-xs text-[#A9A9A9]"
                  >
                    {unavailable}
                  </p>
                )}
              </div>
            )}

            {order.status === "refunded" && (
              <p className="mt-3 text-xs font-medium text-[#A9A9A9]">
                Refunded
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default TicketCard;
