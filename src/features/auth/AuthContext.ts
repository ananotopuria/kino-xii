import { createContext } from "react";
import type { LoginCredentials, RegisterData, User } from "../../types/auth";

export type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  restorationError: string;
  retryRestore: () => Promise<void>;
  isSigningOut: boolean;
  updateUser: (user: User) => void;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
