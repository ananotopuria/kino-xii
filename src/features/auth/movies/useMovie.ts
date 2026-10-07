import { useQuery } from "@tanstack/react-query";

import { getMovie } from "../../../api/movies";

import { useAuth } from "../useAuth";
import { movieKey } from "./notificationKeys";

export const useMovie = (slug: string) => {
  const { user, isLoading, restorationError } = useAuth();
  return useQuery({
    queryKey: movieKey(slug, user?.id ?? null),
    queryFn: () => getMovie(slug),
    enabled: Boolean(slug) && !isLoading && !restorationError,
  });
};
