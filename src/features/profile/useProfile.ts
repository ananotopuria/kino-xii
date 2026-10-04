import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "../../api/profile";
import { useAuth } from "../auth/useAuth";

export const useProfile = () => {
  const { updateUser } = useAuth();
  return useMutation({ mutationFn: updateProfile, onSuccess: updateUser, retry: false, gcTime: 0 });
};
