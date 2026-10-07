import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import type { FilterOptions } from "../../types/filterOptions";
import type { Seat, SeatMap as SeatMapData, SeatSelection as SelectedSeat, SessionDetails } from "../../types/sessions";
import { canSelectSeat, eligibleTicketTypes, reconcileSelection, seatsInMap, ticketPrice, toggleSeat } from "../../utils/seatSelection";
import SeatMap from "./SeatMap";

type SeatSelectionProps = {
  session: SessionDetails;
  map: SeatMapData;
  options: FilterOptions;
  disabled: boolean;
  selection: SelectedSeat[];
  onChange: (selection: SelectedSeat[]) => void;
  onContinue: () => void;
  creatingHold: boolean;
  seatErrors?: Record<number, string[]>;
};

const money = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });

const SeatSelection = ({ session, map, options, disabled, selection: currentSelection, onChange, onContinue, creatingHold, seatErrors = {} }: SeatSelectionProps) => {
  const { user } = useAuth();
  const [limitAttempted, setLimitAttempted] = useState(false);
  const ticketTypes = eligibleTicketTypes(options.ticketTypes, session.movie.ageRating.minAge);
  const defaultType = ticketTypes.find((type) => type.slug === "adult") ?? ticketTypes[0];
  const selection = reconcileSelection(currentSelection, map, ticketTypes, options.maxSeatsPerOrder);
  const selectedIds = new Set(selection.map((item) => item.seatId));
  const seatLookup = new Map(seatsInMap(map).map((seat) => [seat.id, seat]));
  const ageRestricted = user?.age != null && user.age < session.movie.ageRating.minAge;
  const atLimit = selection.length >= options.maxSeatsPerOrder;
  const selectionDisabled = disabled || ageRestricted || !defaultType;
  const subtotal = selection.reduce((total, item) => {
    const type = ticketTypes.find((ticket) => ticket.id === item.ticketTypeId);
    return total + ticketPrice(session.price, type?.priceRatio ?? 0);
  }, 0);

  const toggle = (seat: Seat) => {
    if (selectionDisabled || !defaultType || !canSelectSeat(seat)) return;
    if (atLimit && !selectedIds.has(seat.id)) {
      setLimitAttempted(true);
      return;
    }
    setLimitAttempted(false);
    onChange(toggleSeat(selection, seat, defaultType.id, options.maxSeatsPerOrder));
  };

  return (
    <div className="grid min-h-[455px] gap-5 lg:grid-cols-[minmax(0,720px)_minmax(280px,1fr)]">
      <div className="min-w-0">
        <div aria-label="Booking progress" className="flex gap-2 rounded-full bg-[#1e2031] text-center text-xs font-semibold">
          <span aria-current="step" className="flex-1 rounded-full bg-[#ec3013] px-4 py-2.5">SEATS</span>
          <span className="flex-1 px-4 py-2.5">CHECKOUT</span>
        </div>
        {map.sections.every((section) => section.rows.every((row) => row.seats.every((seat) => seat.state === "unavailable"))) ? (
          <p role="status" className="py-12 text-sm text-[#a9a9a9]">No seats are available for this session.</p>
        ) : <SeatMap map={map} selectedIds={selectedIds} disabled={selectionDisabled} onToggle={toggle} />}
      </div>
      <aside aria-label="Your selected seats" className="flex min-w-0 flex-col justify-between gap-6 border-t border-[#1e2031] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold">Your seats · Max {options.maxSeatsPerOrder}</h2>
          {selection.length === 0 && <p className="text-xs leading-[1.3] text-[#a9a9a9]">Pick up to {options.maxSeatsPerOrder} seats from the map. Each seat can carry its own ticket type.</p>}
          <p role="status" className="sr-only">{selection.length} seats selected{atLimit ? ". Seat limit reached." : ""}</p>
          {limitAttempted && atLimit && <p role="alert" className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-400">You can select up to {options.maxSeatsPerOrder} seats per order. Remove a selected seat to choose another.</p>}
          {selection.map((item) => {
            const seat = seatLookup.get(item.seatId)!;
            const type = ticketTypes.find((ticket) => ticket.id === item.ticketTypeId)!;
            return <div key={seat.id} className="space-y-3 rounded-2xl bg-[#1e2031] p-[15px] text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[#a9a9a9]">Seat</span><span className="font-semibold">{seat.code}</span>
                <span className="ml-auto font-semibold">₾{money(ticketPrice(session.price, type.priceRatio))}</span>
                <button type="button" aria-label={`Remove seat ${seat.code}`} onClick={() => toggle(seat)} disabled={selectionDisabled} className="cursor-pointer disabled:cursor-not-allowed"><img src="/booking/remove.svg" alt="" /></button>
              </div>
              {seatErrors[seat.id] && <p role="alert" className="break-words text-amber-400">Seat {seat.code}: {seatErrors[seat.id].join(" ")}</p>}
              <div role="group" aria-label={`Ticket type for seat ${seat.code}`} className="flex flex-wrap gap-2 border-t border-[#2a2c3d] pt-3">
                {ticketTypes.map((ticket) => <button key={ticket.id} type="button" aria-pressed={item.ticketTypeId === ticket.id}
                  title={ticket.note ?? undefined} disabled={selectionDisabled}
                  onClick={() => onChange(selection.map((selected) => selected.seatId === seat.id ? { ...selected, ticketTypeId: ticket.id } : selected))}
                  className={`flex-1 cursor-pointer whitespace-nowrap rounded-2xl px-2 py-2 disabled:cursor-not-allowed ${item.ticketTypeId === ticket.id ? "bg-[#ec3013]" : "bg-[#2a2c3d]"}`}>
                  {ticket.name} {Math.round(ticket.priceRatio * 100)}%
                </button>)}
              </div>
            </div>;
          })}
          {ageRestricted && <p role="alert" className="text-xs text-amber-400">{session.movie.ageRating.description} You must be at least {session.movie.ageRating.minAge} to book.</p>}
          {!user && <p className="text-xs text-[#a9a9a9]">Sign in to select your seats.</p>}
          {user && !user.profileComplete && <p className="text-xs text-amber-400"><Link to="/profile" state={{ returnTo: `/sessions/${session.id}` }} className="underline">Complete your profile</Link> before booking.</p>}
          {!defaultType && <p role="status" className="text-xs text-amber-400">No eligible ticket types are available for this film.</p>}
        </div>
        <div className="space-y-3 pt-2.5">
          <div aria-live="polite" className="flex items-center justify-between px-1.25"><span className="text-xs font-semibold">SUBTOTAL</span><span className="text-2xl font-extrabold">₾ {money(subtotal)}</span></div>
          <button type="button" onClick={onContinue} disabled={selectionDisabled || selection.length === 0 || selection.some((seat) => seatErrors[seat.seatId]?.length)} className="w-full cursor-pointer rounded-full bg-[#ec3013] px-5.5 py-3.25 text-sm font-extrabold disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#a9a9a9]">{creatingHold ? "Holding seats..." : "Next: Checkout"}</button>
          <p className="text-xs text-[#a9a9a9]">New selections are not reserved yet.</p>
        </div>
      </aside>
    </div>
  );
};

export default SeatSelection;
