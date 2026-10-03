import type { AgeRating, MovieFormat } from "./movie";

export type Venue = {
  id: number;
  slug: string;
  name: string;
  city: string;
  formats: MovieFormat[];
};

export type Language = {
  id: number;
  slug: string;
  name: string;
};

export type TimeBand = {
  id: string;
  label: string;
};

export type SortOption = {
  id: string;
  label: string;
};

export type TicketType = {
  id: number;
  slug: string;
  name: string;
  priceRatio: number;
  note: string | null;
  blockedFromRatingAge: number | null;
};

export type FilterOptions = {
  venues: Venue[];
  formats: MovieFormat[];
  languages: Language[];
  timeBands: TimeBand[];
  sorts: SortOption[];
  ticketTypes: TicketType[];
  ageRatings: AgeRating[];
  maxSeatsPerOrder: number;
  holdMinutes: number;
};

export type FilterOptionsResponse = {
  data: FilterOptions;
};
