/**
 * API base URL for backend requests.
 * - Development: use relative "/api" (Vite proxy forwards to backend).
 * - Production: set VITE_API_URL in .env to your backend URL (e.g. https://your-api.onrender.com).
 */
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") || "";
export const API = API_BASE ? `${API_BASE}/api` : "/api";
