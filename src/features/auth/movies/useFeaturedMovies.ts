import { useQuery } from "@tanstack/react-query";
import { getFeaturedMovies } from "../../../api/movies";

export const useFeaturedMovies = () => useQuery({
  queryKey: ["movies", "featured"],
  queryFn: ({ signal }) => getFeaturedMovies(signal),
});
