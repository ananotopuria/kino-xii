import { useQuery } from "@tanstack/react-query";
import { getMovieSessions } from "../../../api/movies";

export const useMovieSessions = (slug: string, date: string) => {
  return useQuery({
    queryKey: ["movie-sessions", slug, date],
    queryFn: () => getMovieSessions(slug, date),
    enabled: Boolean(slug && date),
  });
};
