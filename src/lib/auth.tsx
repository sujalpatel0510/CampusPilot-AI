"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser, Session } from "@/types";
import { clearApiCache } from "@/hooks/use-api";

const STORAGE_KEY = "campus-pilot-session";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (session: Session) => void;
  logout: () => void;
  updateProfile: (patch: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function getStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {
    // ignore corrupt session
  }
  return null;
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session) setUser(session.user);
    setLoading(false);

    function onUnauthorized() {
      clearSession();
      clearApiCache();
      setUser(null);
    }
    window.addEventListener("campuspilot:unauthorized", onUnauthorized);
    return () => window.removeEventListener("campuspilot:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback((session: Session) => {
    clearApiCache();
    setUser(session.user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const logout = useCallback(() => {
    clearApiCache();
    clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<AuthUser>) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    setUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) {
        const session = getStoredSession();
        if (session) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, user: next }));
        }
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateProfile }),
    [user, loading, login, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
