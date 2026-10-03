import { apiClient } from "./client";
import type {
  MoviesResponse,
  MovieDetailsResponse,
  MovieSessionsResponse,
} from "../types/movie";

export const getNowPlaying = async (): Promise<MoviesResponse> => {
  const response = await apiClient.get<MoviesResponse>("/movies/now-playing");

  return response.data;
};

export const getComingSoon = async (): Promise<MoviesResponse> => {
  const response = await apiClient.get<MoviesResponse>("/movies/coming-soon");

  return response.data;
};

export const getMovie = async (
  slug: string,
): Promise<MovieDetailsResponse["data"]> => {
  const response = await apiClient.get<MovieDetailsResponse>(`/movies/${slug}`);

  return response.data.data;
};

export const getMovieSessions = async (
  slug: string,
  date: string,
): Promise<MovieSessionsResponse["data"]> => {
  const response = await apiClient.get<MovieSessionsResponse>(
    `/movies/${slug}/sessions`,
    {
      params: {
        date,
      },
    },
  );

  return response.data.data;
};
