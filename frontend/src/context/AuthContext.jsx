import { createContext, useContext, useState, useEffect } from "react";
import { API } from "../config/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (token && u) {
      try {
        setUser(JSON.parse(u));
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    let res;
    try {
      res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: (email || "").trim(), password }),
      });
    } catch (err) {
      throw new Error("Cannot reach server. Start the backend (run-backend.bat or npm run dev:backend), then try again.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const serverMsg = data.error || (data.errors?.[0] && (data.errors[0].msg || (data.errors[0].message)));
      let msg = serverMsg || "Login failed";
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        msg = "Backend not running. Start it with run-backend.bat or npm run dev:backend.";
      } else if (res.status === 401) {
        msg = "Invalid email or password.";
      } else if (res.status === 500 && !serverMsg) {
        msg = "Server error. Ensure the backend is running (npm run dev:backend) and, if using MongoDB, that it is running.";
      } else if (res.status === 404) {
        msg = "Backend not found. Set VITE_API_URL to your backend URL (e.g. https://your-backend.vercel.app) in the frontend Environment Variables, then redeploy.";
      } else if (import.meta.env.PROD && !import.meta.env.VITE_API_URL && !serverMsg) {
        msg = "Backend URL not configured. Add VITE_API_URL = your backend URL (e.g. https://your-backend.vercel.app) in the frontend project Environment Variables, then redeploy.";
      }
      throw new Error(msg);
    }
    if (!data.token || !data.user) {
      throw new Error("Invalid response from server");
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (body) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.error || (data.errors?.[0] && (data.errors[0].msg || data.errors[0].message)) || "Registration failed";
      throw new Error(msg);
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const markRegisteredOnChain = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API}/auth/registered-on-chain`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.registeredOnChain = data.registeredOnChain;
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    }
  };

  const getToken = () => localStorage.getItem("token");

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken, markRegisteredOnChain }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
