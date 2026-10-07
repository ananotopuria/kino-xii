import { useQuery } from "@tanstack/react-query";
import { getComingSoon } from "../../../api/movies";

import { useAuth } from "../useAuth";
import { comingSoonKey } from "./notificationKeys";

export const useComingSoon = () => {
  const { user, isLoading, restorationError } = useAuth();
  return useQuery({
    queryKey: comingSoonKey(user?.id ?? null),
    queryFn: getComingSoon,
    enabled: !isLoading && !restorationError,
    placeholderData: (previous) => previous && ({ ...previous, data: previous.data.map((movie) => ({ ...movie, isNotified: false })) }),
  });
};
