import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMovies } from "../../../api/movies";

export const useMovieSearch = (query: string, enabled = true) => {
  const term = query.trim();
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTerm(term), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const isDebouncing = term !== debouncedTerm;
  const search = useQuery({
    queryKey: ["movies", "search", debouncedTerm],
    queryFn: ({ signal }) => searchMovies(debouncedTerm, signal),
    enabled: enabled && Boolean(term) && !isDebouncing,
    staleTime: 30_000,
    retry: false,
  });

  // Hide the previous term's results and errors while a new term is pending.
  const active = enabled && Boolean(term);
  return {
    data: active && !isDebouncing ? search.data : undefined,
    error: active && !isDebouncing ? search.error : null,
    isLoading: active && (isDebouncing || search.isPending),
    isFetching: active && search.isFetching,
    refetch: search.refetch,
  };
};
