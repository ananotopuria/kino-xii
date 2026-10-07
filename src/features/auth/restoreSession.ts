import { isAxiosError } from "axios";
import { getMe } from "../../api/auth";

export const restoreSession = async () => {
  if (!localStorage.getItem("token")) return { kind: "guest" as const };
  try {
    return { kind: "authenticated" as const, user: await getMe() };
  } catch (error) {
    return isAxiosError(error) && error.response?.status === 401
      ? { kind: "guest" as const }
      : { kind: "unavailable" as const };
  }
};
