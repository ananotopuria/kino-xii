import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "../../../api/filterOptions";

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: Infinity,
  });
};
