import { useSyncExternalStore } from "react";
import { getRecentlyViewed, subscribeToRecentlyViewed, type RecentlyViewedMovie } from "./recentlyViewed";

const emptyHistory: RecentlyViewedMovie[] = [];

export const useRecentlyViewed = () => useSyncExternalStore(
  subscribeToRecentlyViewed,
  getRecentlyViewed,
  () => emptyHistory,
);
