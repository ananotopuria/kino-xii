import { Link } from "react-router-dom";
import type { Order } from "../../types/booking";
import { money, shortSessionDate, ticketSummary } from "../../utils/booking";

const BookingConfirmation = ({ order }: { order: Order }) => (
  <div className="mx-auto flex min-h-[535px] max-w-[673px] flex-col items-center justify-center gap-6 py-6">
    <div className="flex w-full max-w-[365px] flex-col items-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#4ade80]"><img src="/booking/confirmed.svg" alt="" /></div>
      <div className="space-y-2.5">
        <h1 id="session-title" className="text-2xl font-extrabold">Booking confirmed!</h1>
        <p className="text-sm leading-[1.3] text-[#a9a9a9]">Your tickets are ready.</p>
      </div>
      <p className="rounded-full bg-[#2a2c3d] px-6 py-1.5 text-xs font-semibold">ORDER #{order.reference}</p>
    </div>
    <div className="w-full space-y-3 rounded-xl bg-[#1e2031] p-5 text-xs">
      <div className="flex gap-2.5">
        <img src={order.session.movie.posterUrl} alt={order.session.movie.title} className="h-16 w-12 shrink-0 rounded-lg object-cover" />
        <div className="space-y-2">
          <h2 className="text-sm font-extrabold uppercase">{order.session.movie.title}</h2>
          <p className="text-[#a9a9a9]">{order.session.venue.name} · Hall {order.session.hall.name} · {shortSessionDate(order.session.date)} · {order.session.time}</p>
        </div>
      </div>
      <div className="border-t border-[#2a2c3d]" />
      <div className="flex justify-between gap-3"><span className="text-[#a9a9a9]">Seats</span><span className="text-right font-semibold">{order.tickets.map((ticket) => ticket.seatCode).join(", ")}</span></div>
      <div className="flex justify-between gap-3"><span className="text-[#a9a9a9]">Tickets</span><span className="text-right">{ticketSummary(order.tickets)}</span></div>
      <div className="border-t border-[#2a2c3d]" />
      <div className="flex items-center justify-between"><span className="text-[#a9a9a9]">TOTAL PAID</span><span className="text-lg font-extrabold">₾ {money(order.totalPrice)}</span></div>
    </div>
    <div className="flex flex-wrap justify-center gap-3 text-sm font-extrabold">
      <Link to="/profile?tab=tickets" className="rounded-full bg-[#ec3013] px-5.5 py-3.25">View my tickets</Link>
      <Link to="/" className="rounded-full bg-white/10 px-5.5 py-3.25">Back to home</Link>
    </div>
  </div>
);

export default BookingConfirmation;
