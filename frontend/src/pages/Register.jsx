import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import Animated3DBackground from "../components/Animated3DBackground";
import styles from "./Auth.module.css";

const ROLES = [
  { value: "farmer", label: "Farmer – grow and register crops" },
  { value: "buyer", label: "Buyer – purchase crop batches" },
  { value: "distributor", label: "Distributor – storage & transport" },
  { value: "retailer", label: "Retailer – sell at market" },
];

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    walletAddress: "",
    role: "farmer",
    name: "",
    location: "",
    mobile: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Install MetaMask to connect wallet");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setForm((f) => ({ ...f, walletAddress: address }));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    const isFarmer = form.role === "farmer";
    if (!isFarmer && !form.walletAddress) {
      setError("Connect wallet for non-farmer roles");
      return;
    }
    setLoading(true);
    try {
      const data = await register({
        email: form.email,
        password: form.password,
        walletAddress: form.walletAddress || undefined,
        role: form.role,
        name: form.name,
        location: form.location,
        mobile: form.mobile,
      });
      if (isFarmer) {
        navigate("/", { state: { welcomeFarmer: true } });
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isFarmer = form.role === "farmer";

  return (
    <div className={styles.page}>
      <Animated3DBackground />
      <div className={styles.card}>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.subtitle}>
          Create an account. Farmers can create crops and see them on the Batches page.
        </p>
        <form onSubmit={handleSubmit} className={styles.form} autoComplete="on">
          {error && (
            <div className={styles.error}>
              {error}
              {error === "Email already registered" && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
                  <Link to="/login">Sign in</Link> instead or use a different email.
                </p>
              )}
            </div>
          )}
          <label htmlFor="register-name">Full Name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="e.g. Ramesh Kumar"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoComplete="name"
          />
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            autoComplete="email"
          />
          <label htmlFor="register-password">Password (min 6 characters)</label>
          <input
            id="register-password"
            name="new-password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            autoComplete="new-password"
          />
          <label htmlFor="register-confirm-password">Confirm password</label>
          <input
            id="register-confirm-password"
            name="confirm-password"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            required
            autoComplete="new-password"
          />
          <label htmlFor="register-location">Farm Location</label>
          <input
            id="register-location"
            name="address-level2"
            type="text"
            placeholder="e.g. Agra, Uttar Pradesh"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            autoComplete="address-level2"
          />
          <label htmlFor="register-mobile">Mobile Number</label>
          <input
            id="register-mobile"
            name="tel"
            type="tel"
            placeholder="e.g. 9876543210"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
            autoComplete="tel"
          />
          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {!isFarmer && (
            <>
              <label>Wallet (MetaMask)</label>
              <div className={styles.row}>
                <input
                  type="text"
                  placeholder="Connect wallet first"
                  value={form.walletAddress}
                  readOnly
                  className={styles.walletInput}
                />
                <button type="button" onClick={connectWallet} className={styles.connectBtn}>
                  Connect Wallet
                </button>
              </div>
            </>
          )}
          {isFarmer && (
            <p className={styles.hint}>Wallet is optional for farmers. You can connect later to use blockchain features.</p>
          )}
          <button type="submit" disabled={loading || (!isFarmer && !form.walletAddress)}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
