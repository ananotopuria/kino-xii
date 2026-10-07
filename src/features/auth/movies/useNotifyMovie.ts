import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyMovie } from "../../../api/movies";
import type { MovieDetails, MoviesResponse } from "../../../types/movie";

import { useAuth } from "../useAuth";
import { comingSoonKey, movieKey } from "./notificationKeys";

export const useNotifyMovie = () => {
  const client = useQueryClient();

  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const mutation = useMutation({
    mutationFn: ({ slug }: { slug: string; ownerId: number | null }) => notifyMovie(slug),
    retry: false,
    onSuccess: ({ movieId, subscribed }, { slug, ownerId }) => {
      client.setQueryData<MoviesResponse>(comingSoonKey(ownerId), (cached) => cached && ({
        ...cached,
        data: cached.data.map((movie) => movie.id === movieId
          ? { ...movie, isNotified: subscribed }
          : movie),
      }));
      client.setQueryData<MovieDetails>(movieKey(slug, ownerId), (cached) =>
        cached?.id === movieId ? { ...cached, isNotified: subscribed } : cached);
    },
  });
  return {
    ...mutation,
    isSuccess: mutation.isSuccess && mutation.variables?.ownerId === ownerId,
    isPending: mutation.isPending && mutation.variables?.ownerId === ownerId,
    mutateAsync: (slug: string) => mutation.mutateAsync({ slug, ownerId }),
  };
};
