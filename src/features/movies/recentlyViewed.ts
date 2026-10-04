import type { Movie } from "../../types/movie";

export type RecentlyViewedMovie = Pick<Movie,
  "id" | "slug" | "title" | "posterUrl" | "runtimeMinutes"
> & {
  genres: Pick<Movie["genres"][number], "name">[];
  ageRating: Pick<Movie["ageRating"], "code">;
};

export const RECENTLY_VIEWED_KEY = "kino:recently-viewed:v1";
export const RECENTLY_VIEWED_LIMIT = 6;

const toRecentMovie = (movie: RecentlyViewedMovie): RecentlyViewedMovie => ({
  id: movie.id,
  slug: movie.slug,
  title: movie.title,
  posterUrl: movie.posterUrl,
  runtimeMinutes: movie.runtimeMinutes,
  genres: movie.genres.slice(0, 1).map(({ name }) => ({ name })),
  ageRating: { code: movie.ageRating.code },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRecentMovie = (value: unknown): value is RecentlyViewedMovie => {
  if (!isRecord(value)) return false;
  return typeof value.id === "number" && Number.isInteger(value.id) && value.id > 0
    && typeof value.slug === "string" && Boolean(value.slug.trim())
    && typeof value.title === "string" && Boolean(value.title.trim())
    && typeof value.posterUrl === "string"
    && typeof value.runtimeMinutes === "number" && Number.isFinite(value.runtimeMinutes) && value.runtimeMinutes >= 0
    && isRecord(value.ageRating) && typeof value.ageRating.code === "string"
    && Array.isArray(value.genres) && value.genres.every((genre) => isRecord(genre) && typeof genre.name === "string");
};

export const parseRecentlyViewed = (raw: string | null): RecentlyViewedMovie[] => {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const movies: RecentlyViewedMovie[] = [];
    for (const entry of value) {
      if (!isRecentMovie(entry) || movies.some((movie) => movie.id === entry.id || movie.slug === entry.slug)) continue;
      movies.push(toRecentMovie(entry));
      if (movies.length === RECENTLY_VIEWED_LIMIT) break;
    }
    return movies;
  } catch {
    return [];
  }
};

// Keep a stable snapshot for useSyncExternalStore, and an in-memory fallback
// when storage is blocked or full. No authentication state is stored here.
let snapshot: RecentlyViewedMovie[] = [];
let lastStoredValue: string | null | undefined;
const listeners = new Set<() => void>();

export const getRecentlyViewed = (): RecentlyViewedMovie[] => {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (raw !== lastStoredValue) {
      snapshot = parseRecentlyViewed(raw);
      lastStoredValue = raw;
    }
  } catch {
    // The current tab can still retain its history without persistent storage.
  }
  return snapshot;
};

export const recordRecentlyViewed = (movie: Movie): void => {
  if (!isRecentMovie(movie)) return;
  snapshot = [
    toRecentMovie(movie),
    ...getRecentlyViewed().filter((entry) => entry.id !== movie.id && entry.slug !== movie.slug),
  ].slice(0, RECENTLY_VIEWED_LIMIT);

  try {
    const raw = JSON.stringify(snapshot);
    localStorage.setItem(RECENTLY_VIEWED_KEY, raw);
    lastStoredValue = raw;
  } catch {
    // A failed write must not interrupt Movie Details or discard this view.
  }
  listeners.forEach((listener) => listener());
};

export const subscribeToRecentlyViewed = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENTLY_VIEWED_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};
