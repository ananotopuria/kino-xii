import { apiClient } from "./client";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../types/auth";

export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/login", credentials);

  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const formData = new FormData();

  formData.append("username", data.username);
  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("password_confirmation", data.passwordConfirmation);

  if (data.avatar) {
    formData.append("avatar", data.avatar);
  }

  const response = await apiClient.post<AuthResponse>("/register", formData);

  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<{ data: User }>("/me");

  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/logout");
};
