import { apiClient } from "./client";
import type {
  MoviesResponse,
  MoviesWithSynopsisResponse,
  MovieDetailsResponse,
  MovieSessionsResponse,
  MovieNotificationResponse,
} from "../types/movie";

export const notifyMovie = async (
  movieSlug: string,
): Promise<MovieNotificationResponse["data"]> => {
  const response = await apiClient.post<MovieNotificationResponse>(
    `/movies/${encodeURIComponent(movieSlug)}/notify`,
  );

  return response.data.data;
};

export const searchMovies = async (
  query: string,
  signal?: AbortSignal,
): Promise<MoviesResponse["data"]> => {
  const response = await apiClient.get<MoviesResponse>("/search", {
    params: { q: query },
    signal,
  });

  return response.data.data;
};

export const getFeaturedMovies = async (
  signal?: AbortSignal,
): Promise<MoviesWithSynopsisResponse> => {
  const response = await apiClient.get<MoviesWithSynopsisResponse>("/movies/featured", { signal });

  return response.data;
};

export const getNowPlaying = async (): Promise<MoviesWithSynopsisResponse> => {
  const response = await apiClient.get<MoviesWithSynopsisResponse>("/movies/now-playing");

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
