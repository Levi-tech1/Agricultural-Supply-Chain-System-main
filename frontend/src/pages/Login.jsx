import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Animated3DBackground from "../components/Animated3DBackground";
import styles from "./Auth.module.css";

const DEMO_EMAIL = "admin@agrichain.com";
const DEMO_PASSWORD = "Admin@123";
const AUTO_LOGIN_KEY = "agrichain_auto_login";

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const autoLoginTried = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const unauthMessage = location.state?.message === "Unauthorized access" ? "Unauthorized access" : null;
  const isDev = import.meta.env.DEV;
  const autoLoginEnabled = isDev && (import.meta.env.VITE_AUTO_LOGIN !== "false" && import.meta.env.VITE_AUTO_LOGIN !== "0");

  const doLogin = async (emailVal, passwordVal) => {
    setError("");
    setLoading(true);
    try {
      await login((emailVal ?? email).trim(), passwordVal ?? password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleDemoLogin = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    doLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  useEffect(() => {
    if (!autoLoginEnabled || autoLoginTried.current) return;
    if (sessionStorage.getItem(AUTO_LOGIN_KEY) === "1") return;
    autoLoginTried.current = true;
    sessionStorage.setItem(AUTO_LOGIN_KEY, "1");
    const t = setTimeout(() => {
      doLogin(DEMO_EMAIL, DEMO_PASSWORD);
    }, 600);
    return () => clearTimeout(t);
  }, [autoLoginEnabled]);


  return (
    <div className={styles.page}>
      <Animated3DBackground />
      <div className={styles.card}>
        <h1 className={styles.title}>AgriChain</h1>
        <p className={styles.subtitle}>Agricultural Supply Chain</p>
        <p className={styles.demoHint}>
          Demo: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_PASSWORD}</strong>
        </p>
        <form onSubmit={handleSubmit} className={styles.form} autoComplete="on">
          {unauthMessage && <div className={styles.error}>{unauthMessage}</div>}
          {error && <div className={styles.error}>{error}</div>}
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            required
            autoComplete="email"
          />
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            required
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            className={styles.demoLoginBtn}
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Sign in with Demo account
          </button>
        </form>
        <p className={styles.footer}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
