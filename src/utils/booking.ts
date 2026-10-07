import { isAxiosError } from "axios";
import type { BookingError, SeatHold } from "../types/booking";
import type { TicketType } from "../types/filterOptions";
import type { SeatMap, SeatSelection } from "../types/sessions";

export const HOLD_EXPIRED = "Your hold time expired. Please re-select your seats.";

export const remainingSeconds = (hold: SeatHold, now = Date.now()) =>
  hold.isLive ? Math.max(0, Math.ceil((Date.parse(hold.expiresAt) - now) / 1000)) || 0 : 0;

export const holdSelection = (hold: SeatHold, types: TicketType[]): SeatSelection[] =>
  hold.seats.flatMap((seat) => {
    const type = types.find((item) => item.slug === seat.ticketType.slug);
    return type ? [{ seatId: seat.seatId, ticketTypeId: type.id }] : [];
  });

export const dropContested = (selection: SeatSelection[], map: SeatMap, codes: string[]) => {
  const ids = new Set(map.sections.flatMap((section) => section.rows.flatMap((row) => row.seats))
    .filter((seat) => codes.includes(seat.code)).map((seat) => seat.id));
  return selection.filter((seat) => !ids.has(seat.seatId));
};

export const bookingError = (error: unknown): BookingError & { status?: number } => {
  if (isAxiosError<BookingError>(error)) return { ...error.response?.data, status: error.response?.status };
  return {};
};

export const ticketSummary = (tickets: { ticketType: { slug: string; name: string } }[]) => {
  const groups = new Map<string, { name: string; count: number }>();
  for (const { ticketType } of tickets) {
    const group = groups.get(ticketType.slug) ?? { name: ticketType.name, count: 0 };
    group.count += 1;
    groups.set(ticketType.slug, group);
  }
  return [...groups.values()].map(({ name, count }) => `${count} × ${name}`).join(", ");
};

export const bookingStorageKey = (sessionId: number, userId: number) => `kino:hold:${userId}:${sessionId}`;
export const money = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
export const shortSessionDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

// Field paths index the submitted seats array, never the map's row order.
export const holdValidationErrors = (
  errors: Record<string, string[]>, submitted: SeatSelection[], map: SeatMap,
) => {
  const seatErrors: Record<number, string[]> = {};
  const general: string[] = [];
  const knownIds = new Set(map.sections.flatMap((section) => section.rows.flatMap((row) => row.seats.map((seat) => seat.id))));
  for (const [field, messages] of Object.entries(errors)) {
    const match = /^seats\.(0|[1-9]\d*)(?:\.(seatId|ticketType))?$/.exec(field);
    const seat = match ? submitted[Number(match[1])] : undefined;
    if (seat && knownIds.has(seat.seatId)) {
      seatErrors[seat.seatId] = [...(seatErrors[seat.seatId] ?? []), ...messages];
    } else general.push(...messages);
  }
  return { seatErrors, general };
};
