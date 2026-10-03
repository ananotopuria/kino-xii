import type {
  FilterOptions,
  FilterOptionsResponse,
} from "../types/filterOptions";
import { apiClient } from "./client";

export const getFilterOptions = async (): Promise<FilterOptions> => {
  const response =
    await apiClient.get<FilterOptionsResponse>("/filter-options");

  return response.data.data;
};
