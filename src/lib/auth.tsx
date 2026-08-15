"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { StudentProfile } from "@/types";
import { STUDENT_PROFILE } from "@/data/mock-data";

const STORAGE_KEY = "campus-pilot-session";

interface AuthContextValue {
  user: StudentProfile | null;
  loading: boolean;
  login: (user: StudentProfile, remember?: boolean) => void;
  register: (user: StudentProfile) => void;
  logout: () => void;
  updateProfile: (patch: Partial<StudentProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readSession(): StudentProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StudentProfile;
  } catch {
    // ignore corrupt session
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readSession());
    setLoading(false);
  }, []);

  const login = useCallback((profile: StudentProfile, remember = true) => {
    setUser(profile);
    if (remember) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, []);

  const register = useCallback((profile: StudentProfile) => {
    setUser(profile);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<StudentProfile>) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setUser((prev) => {
        const next = prev ? { ...prev, ...patch } : prev;
        if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
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

export function demoProfile(): StudentProfile {
  return STUDENT_PROFILE;
}
