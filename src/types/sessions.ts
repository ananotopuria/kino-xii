import type { Movie, MovieSession } from "./movie";

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
