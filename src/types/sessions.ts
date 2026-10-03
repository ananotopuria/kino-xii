import type { Movie, MovieSession } from "./movie";

export type SessionDetails = MovieSession & { movie: Movie };

export type Seat = {
  id: number;
  code: string;
  label: string;
  state: "available" | "sold" | "held" | "unavailable";
  aisleAfter: boolean;
  isMine: boolean;
};

export type SeatMap = {
  sessionId: number;
  hall: MovieSession["hall"];
  sections: {
    name: string;
    rows: { label: string; seats: Seat[] }[];
  }[];
};

export type SeatSelection = { seatId: number; ticketTypeId: number };

export type SessionFilterKey = "venues" | "formats" | "languages" | "bands";

export type SessionsParams = Record<SessionFilterKey, string[]> & {
  date: string;
  search: string;
  sort: string;
  page: number;
};

export type SessionsResponse = {
  data: { movie: Movie; sessions: MovieSession[] }[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    totalSessions: number;
    totalMovies: number;
    date: string;
  };
};
