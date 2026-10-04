import { useEffect, useState, type ReactNode } from "react";

import { getMe, login, logout, register } from "../../api/auth";
import type { LoginCredentials, RegisterData, User } from "../../types/auth";
import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  const signIn = async (credentials: LoginCredentials) => {
    const response = await login(credentials);

    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };
  const signUp = async (data: RegisterData) => {
    const response = await register(data);

    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };
  const signOut = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getMe();

        setUser(currentUser);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        updateUser: (updated) => setUser((current) => current?.id === updated.id ? updated : current),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
