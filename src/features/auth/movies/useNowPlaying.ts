import { useQuery } from "@tanstack/react-query";
import { getNowPlaying } from "../../../api/movies";

export const useNowPlaying = () => {
  return useQuery({
    queryKey: ["movies", "now-playing"],
    queryFn: getNowPlaying,
  });
};
