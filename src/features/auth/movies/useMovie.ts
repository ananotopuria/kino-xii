import { useQuery } from "@tanstack/react-query";

import { getMovie } from "../../../api/movies";

export const useMovie = (slug: string) => {
  return useQuery({
    queryKey: ["movie", slug],
    queryFn: () => getMovie(slug),
    enabled: Boolean(slug),
  });
};
