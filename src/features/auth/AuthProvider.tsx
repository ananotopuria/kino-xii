import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { login, logout, register } from "../../api/auth";
import type { LoginCredentials, RegisterData, User } from "../../types/auth";
import { AuthContext } from "./AuthContext";

import { restoreSession } from "./restoreSession";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [restorationError, setRestorationError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const restoring = useRef(false);
  const signingOut = useRef<Promise<void> | null>(null);
  const generation = useRef(0);

  const retryRestore = useCallback(async () => {
    if (restoring.current) return;
    restoring.current = true;
    const attempt = generation.current;
    setIsLoading(true);
    try {
      const result = await restoreSession();
      if (attempt !== generation.current) return;
      if (result.kind === "authenticated") {
        setUser(result.user);
        setRestorationError("");
      } else if (result.kind === "guest") {
        localStorage.removeItem("token");
        setUser(null);
        setRestorationError("");
      } else setRestorationError("Unable to restore your session. Please try again.");
    } finally {
      restoring.current = false;
      if (attempt === generation.current) setIsLoading(false);
    }
  }, []);

  const isAuthenticated = user !== null;

  const signIn = async (credentials: LoginCredentials) => {
    const response = await login(credentials);

    generation.current++;
    setIsLoading(false);
    setRestorationError("");
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };
  const signUp = async (data: RegisterData) => {
    const response = await register(data);

    generation.current++;
    setIsLoading(false);
    setRestorationError("");
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };
  const signOut = () => {
    if (signingOut.current) return signingOut.current;
    generation.current++;
    setIsSigningOut(true);
    signingOut.current = (async () => {
      try {
        await logout();
      } finally {
        localStorage.removeItem("token");
        setUser(null);
        setIsLoading(false);
        setRestorationError("");
        setIsSigningOut(false);
        signingOut.current = null;
      }
    })();
    return signingOut.current;
  };

  useEffect(() => { void retryRestore(); }, [retryRestore]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        restorationError,
        retryRestore,
        isSigningOut,
        updateUser: (updated) => setUser((current) => current?.id === updated.id ? updated : current),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
      {restorationError && <div role="alert" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-xl border border-amber-400/30 bg-[#070c1c] p-4 text-sm text-amber-300 shadow-xl">
        {restorationError} <button type="button" disabled={isLoading} onClick={() => void retryRestore()} className="cursor-pointer font-semibold underline disabled:opacity-50">{isLoading ? "Retrying..." : "Retry session"}</button>
      </div>}
    </AuthContext.Provider>
  );
};
