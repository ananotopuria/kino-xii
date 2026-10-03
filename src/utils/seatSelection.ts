import type { TicketType } from "../types/filterOptions";
import type { Seat, SeatMap, SeatSelection } from "../types/sessions";

export const canSelectSeat = (seat: Seat) =>
  seat.state === "available" || (seat.state === "held" && seat.isMine);

export const eligibleTicketTypes = (types: TicketType[], minAge: number) =>
  types.filter((type) => type.blockedFromRatingAge === null || minAge < type.blockedFromRatingAge);

export const ticketPrice = (price: number, ratio: number) => Math.round(price * ratio * 100) / 100;

export const seatsInMap = (map: SeatMap) => map.sections.flatMap((section) => section.rows.flatMap((row) => row.seats));

export const reconcileSelection = (
  selection: SeatSelection[], map: SeatMap, ticketTypes: TicketType[], maxSeats: number,
) => {
  const seats = new Map(seatsInMap(map).map((seat) => [seat.id, seat]));
  const fallback = ticketTypes.find((type) => type.slug === "adult") ?? ticketTypes[0];
  if (!fallback) return [];
  return selection.filter((item, index) => {
    const seat = seats.get(item.seatId);
    return seat && canSelectSeat(seat) && selection.findIndex((other) => other.seatId === item.seatId) === index;
  }).slice(0, maxSeats).map((item) => ({
    ...item,
    ticketTypeId: ticketTypes.some((type) => type.id === item.ticketTypeId) ? item.ticketTypeId : fallback.id,
  }));
};

export const toggleSeat = (
  selection: SeatSelection[], seat: Seat, defaultTicketTypeId: number, maxSeats: number,
): SeatSelection[] => {
  if (!canSelectSeat(seat)) return selection;
  if (selection.some((item) => item.seatId === seat.id)) return selection.filter((item) => item.seatId !== seat.id);
  if (selection.length >= maxSeats) return selection;
  return [...selection, { seatId: seat.id, ticketTypeId: defaultTicketTypeId }];
};
