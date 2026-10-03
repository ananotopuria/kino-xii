import type { SessionDetails } from "./sessions";

export type HoldRequest = { seats: { seatId: number; ticketType: string }[] };
type TicketLabel = { slug: string; name: string };

export type SeatHold = {
  holdId: string;
  sessionId: number;
  expiresAt: string;
  secondsRemaining: number;
  isLive: boolean;
  subtotal: number;
  seats: { seatId: number; code: string; ticketType: TicketLabel; price: number }[];
};

export type CheckoutFields = {
  fullName: string;
  email: string;
  mobileNumber: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};
export type OrderRequest = CheckoutFields & { holdId: string };

export type Order = {
  id: number;
  reference: string;
  status: "paid" | "refunded";
  totalPrice: number;
  paidAt: string;
  refundedAt: string | null;
  isUpcoming: boolean;
  isRefundable: boolean;
  cardLastFour: string;
  contact: Pick<CheckoutFields, "fullName" | "email" | "mobileNumber">;
  session: SessionDetails;
  tickets: { id: number; seatCode: string; ticketType: TicketLabel; price: number }[];
};

export type BookingError = {
  message?: string;
  errors?: Record<string, string[]>;
  contested?: string[];
};
