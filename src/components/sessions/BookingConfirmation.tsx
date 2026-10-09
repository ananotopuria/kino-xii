import { Link } from "react-router-dom";
import type { Order } from "../../types/booking";
import { money, shortSessionDate, ticketSummary } from "../../utils/booking";

const BookingConfirmation = ({ order }: { order: Order }) => {
  return (
    <div
      data-booking-confirmation
      className="
    mx-auto
    flex
    w-full
    max-w-148.5
    flex-col
    items-center
    justify-center
    gap-5
    py-4
    text-center
    wrap-anywhere
  "
    >
      {/* Success icon */}
      <div className="flex size-14 items-center justify-center rounded-full bg-[#4ade80]">
        <img src="/booking/confirmed.svg" alt="" />
      </div>

      {/* Heading */}
      <div className="space-y-2 text-center">
        <h1 id="session-title" className="text-2xl font-extrabold">
          Booking confirmed!
        </h1>

        <p className="text-sm text-[#a9a9a9]">Your tickets are ready.</p>
      </div>

      {/* Order reference */}
      <p className="rounded-full bg-[#2a2c3d] px-6 py-1.5 text-xs font-semibold">
        ORDER #{order.reference}
      </p>

      {/* Booking summary */}
      <div className="w-full space-y-3 rounded-xl bg-[#1e2031] p-5 text-xs">
        <div className="flex gap-3">
          <img
            src={order.session.movie.posterUrl}
            alt={order.session.movie.title}
            className="h-16 w-12 shrink-0 rounded-lg object-cover"
          />

          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-sm font-extrabold uppercase">
              {order.session.movie.title}
            </h2>

            <p className="text-[#a9a9a9]">
              {order.session.venue.name} · Hall {order.session.hall.name} ·{" "}
              {shortSessionDate(order.session.date)} · {order.session.time}
            </p>
          </div>
        </div>

        <div className="border-t border-[#2a2c3d]" />

        <div className="flex justify-between gap-3">
          <span className="text-[#a9a9a9]">Seats</span>
          <span className="text-right font-semibold">
            {order.tickets.map((ticket) => ticket.seatCode).join(", ")}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-[#a9a9a9]">Tickets</span>
          <span className="text-right">{ticketSummary(order.tickets)}</span>
        </div>

        <div className="border-t border-[#2a2c3d]" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#a9a9a9]">TOTAL PAID</span>

          <span className="text-lg font-extrabold">
            ₾ {money(order.totalPrice)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid w-full grid-cols-1 gap-3 text-center text-sm font-extrabold sm:grid-cols-2">
        <Link
          to="/profile?tab=tickets"
          className="rounded-full bg-[#ec3013] px-5 py-3 transition hover:bg-[#d92b12]"
        >
          View my tickets
        </Link>

        <Link
          to="/"
          className="rounded-full bg-white/10 px-5 py-3 transition hover:bg-white/20"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
