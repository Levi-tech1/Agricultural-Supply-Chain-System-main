import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API } from "../config/api.js";

const AuthContext = createContext(null);

function vercelApiHint() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname || "";
  const usesSameOriginApi = !import.meta.env.VITE_API_URL;
  if (!usesSameOriginApi || (!host.includes("vercel.app") && !host.includes("vercel.com"))) return "";
  return " On Vercel: Project Settings → Environment Variables → set BACKEND_URL to your API origin (e.g. https://your-api.onrender.com) with no /api suffix, then redeploy.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  const refreshUser = useCallback(async () => {
    setSessionError(null);
    try {
      const res = await fetch(`${API}/users/me`);
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j.error) detail = j.error;
        } catch {
          /* ignore */
        }
        setSessionError(`${detail}.${vercelApiHint()}`);
        setUser(null);
        return null;
      }
      const u = await res.json();
      setUser(u);
      return u;
    } catch {
      setSessionError(`Cannot reach the API.${vercelApiHint()}`);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const markRegisteredOnChain = useCallback(async () => {
    const res = await fetch(`${API}/users/me/registered-on-chain`, { method: "PATCH" });
    if (res.ok) {
      const data = await res.json();
      setUser((prev) => (prev ? { ...prev, registeredOnChain: data.registeredOnChain } : prev));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, sessionError, refreshUser, markRegisteredOnChain }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
