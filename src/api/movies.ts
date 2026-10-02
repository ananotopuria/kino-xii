import { apiClient } from "./client";
import type { MoviesResponse } from "../types/movie";

export const getNowPlaying = async (): Promise<MoviesResponse> => {
  const response = await apiClient.get<MoviesResponse>("/movies/now-playing");

  return response.data;
};

export const getComingSoon = async (): Promise<MoviesResponse> => {
  const response = await apiClient.get<MoviesResponse>("/movies/coming-soon");

  return response.data;
};
