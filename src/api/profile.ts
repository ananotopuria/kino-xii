import { apiClient } from "./client";
import type { ProfileFields, User } from "../types/auth";

export const updateProfile = async (fields: ProfileFields) => {
  const body = new FormData();
  body.append("fullName", fields.fullName);
  body.append("mobileNumber", fields.mobileNumber);
  body.append("dateOfBirth", fields.dateOfBirth);
  // An empty value clears this nullable preference (Laravel normalizes it to null).
  body.append("preferredVenueId", fields.preferredVenueId);
  if (fields.avatar) body.append("avatar", fields.avatar);
  const response = await apiClient.put<{ data: User }>("/profile", body);
  return response.data.data;
};
