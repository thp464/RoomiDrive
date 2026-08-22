import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CurrentUser } from "../types";
import { getToken, saveToken, clearToken } from "../api/client";
import { getCurrentUser } from "../api/auth";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const me = await getCurrentUser();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  async function loginWithToken(token: string) {
    saveToken(token);
    setLoading(true);
    await refreshUser();
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
