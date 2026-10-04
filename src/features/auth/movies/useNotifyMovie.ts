import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyMovie } from "../../../api/movies";
import type { MovieDetails, MoviesResponse } from "../../../types/movie";

export const useNotifyMovie = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: notifyMovie,
    retry: false,
    onSuccess: ({ movieId, subscribed }, slug) => {
      client.setQueryData<MoviesResponse>(["movies", "coming-soon"], (cached) => cached && ({
        ...cached,
        data: cached.data.map((movie) => movie.id === movieId
          ? { ...movie, isNotified: subscribed }
          : movie),
      }));
      client.setQueryData<MovieDetails>(["movie", slug], (cached) =>
        cached?.id === movieId ? { ...cached, isNotified: subscribed } : cached);
    },
  });
};
