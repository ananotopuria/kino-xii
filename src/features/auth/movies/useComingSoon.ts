import { useQuery } from "@tanstack/react-query";
import { getComingSoon } from "../../../api/movies";

export const useComingSoon = () => {
  return useQuery({
    queryKey: ["movies", "coming-soon"],
    queryFn: getComingSoon,
  });
};
