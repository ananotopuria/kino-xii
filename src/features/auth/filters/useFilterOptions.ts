import { queryOptions, useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "../../../api/filterOptions";

export const filterOptionsQuery = queryOptions({
  queryKey: ["filter-options"],
  queryFn: getFilterOptions,
  staleTime: Infinity,
  gcTime: Infinity,
});

export const useFilterOptions = () => useQuery(filterOptionsQuery);
