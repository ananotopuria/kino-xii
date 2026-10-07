import type { Order } from "../../types/booking";
import { money, shortSessionDate, ticketSummary } from "../../utils/booking";

const TicketCard = ({ order, onRefund }: { order: Order; onRefund: (order: Order) => void }) => {
  const { session } = order;
  const unavailable = "Refunds are unavailable within 2 hours of the session starting.";
  return <article className="rounded-xl border border-[#2a2c3d] bg-[#1e2031] p-5">
    <div className="flex items-start gap-4">
      <img src={session.movie.posterUrl} alt={session.movie.title} className="h-28 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-extrabold uppercase">{session.movie.title}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "refunded" ? "bg-white/10 text-[#a9a9a9]" : "bg-[#4ade80]/10 text-[#4ade80]"}`}>{order.status === "refunded" ? "Refunded" : order.isUpcoming ? "Upcoming" : "Past"}</span>
        </div>
        <p className="mt-2 text-sm text-[#a9a9a9]">{session.venue.name} · Hall {session.hall.name}</p>
        <p className="mt-2 text-sm">{shortSessionDate(session.date)} · {session.time}</p>
        <p className="mt-2 text-xs text-[#a9a9a9]">{session.format.name} · {session.language.name} · {session.movie.ageRating.code}</p>
      </div>
    </div>
    <dl className="mt-5 space-y-3 border-t border-[#2a2c3d] pt-4 text-xs">
      <div className="flex justify-between gap-4"><dt className="text-[#a9a9a9]">Order</dt><dd className="break-all text-right">#{order.reference}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-[#a9a9a9]">Seats</dt><dd className="text-right font-semibold">{order.tickets.map((ticket) => ticket.seatCode).join(", ")}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-[#a9a9a9]">Tickets</dt><dd className="text-right">{ticketSummary(order.tickets)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-[#a9a9a9]">Seat ticket types</dt><dd className="min-w-0 text-right"><ul className="space-y-2 break-words">{order.tickets.map((ticket) => <li key={ticket.id}>Seat {ticket.seatCode} — {ticket.ticketType.name}</li>)}</ul></dd></div>
      <div className="flex justify-between gap-4"><dt className="text-[#a9a9a9]">Payment card</dt><dd>•••• {order.cardLastFour}</dd></div>
      <div className="flex items-center justify-between gap-4 border-t border-[#2a2c3d] pt-4"><dt className="text-[#a9a9a9]">{order.status === "refunded" ? "TOTAL REFUNDED" : "TOTAL PAID"}</dt><dd className="text-lg font-extrabold">₾ {money(order.totalPrice)}</dd></div>
    </dl>
    {order.isUpcoming && <div className="mt-4">
      <span title={!order.isRefundable ? unavailable : undefined} className="inline-block">
        <button type="button" onClick={() => { if (order.isRefundable) onRefund(order); }} disabled={!order.isRefundable} aria-describedby={!order.isRefundable ? `refund-reason-${order.id}` : undefined} className="cursor-pointer rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:text-[#a9a9a9] disabled:opacity-50">Refund</button>
      </span>
      {!order.isRefundable && <p id={`refund-reason-${order.id}`} className="mt-2 text-xs text-[#a9a9a9]">{unavailable}</p>}
    </div>}
  </article>;
};

export default TicketCard;
