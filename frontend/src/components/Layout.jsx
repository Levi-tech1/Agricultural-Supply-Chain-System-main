import { useMemo, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EnhancementProvider, useEnhancement } from "../context/EnhancementContext";
import Animated3DBackground from "./Animated3DBackground";
import styles from "./Layout.module.css";

function LayoutShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, toasts, unreadCount, markAllRead, activeRole, setRole } = useEnhancement();

  const roleOptions = useMemo(() => ["admin", "farmer", "distributor"], []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.layout}>
      <Animated3DBackground />
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>AgriChain</Link>
        <nav className={styles.nav}>
          <Link to="/">Dashboard</Link>
          <Link to="/inventory">Inventory Management</Link>
          <Link to="/delivery-tracking">Order & Delivery Tracking</Link>
          <Link to="/data-analytics">Data Analytics Dashboard</Link>
          <Link to="/batches">Batches</Link>
          {user?.role === "farmer" && <Link to="/batches/create">Create crop</Link>}
          {(user?.role === "admin" || user?.role === "owner") && <Link to="/admin/users">Owner / Users</Link>}
        </nav>
        <div className={styles.user}>
          <div className={styles.roleSwitchWrap}>
            <label htmlFor="role-view" className={styles.roleSwitchLabel}>Role view</label>
            <select id="role-view" value={activeRole} onChange={(e) => setRole(e.target.value)} className={styles.roleSwitch}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className={styles.bellWrap}>
            <button
              type="button"
              className={styles.bell}
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications((prev) => !prev);
                markAllRead();
              }}
            >
              🔔
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>
            {showNotifications && (
              <div className={styles.notificationPanel}>
                <div className={styles.notificationHeader}>
                  <strong>Notifications</strong>
                  <button type="button" className={styles.clearBtn} onClick={markAllRead}>Mark all read</button>
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <p className={styles.notificationEmpty}>No alerts yet.</p>
                  ) : notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className={styles.notificationItem}>
                      <p className={styles.notificationTitle}>{n.title}</p>
                      <p className={styles.notificationMsg}>{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className={styles.role}>{user?.role === "admin" ? "Owner" : user?.role}</span>
          <span className={styles.wallet}>{user?.walletAddress?.slice(0, 6)}…{user?.walletAddress?.slice(-4)}</span>
          <button type="button" onClick={handleLogout} className={styles.logout}>Logout</button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.pageEnter}>
          <Outlet />
        </div>
      </main>
      <div className={styles.toastStack} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast}>
            <p className={styles.toastTitle}>{t.title}</p>
            <p className={styles.toastMessage}>{t.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  return (
    <EnhancementProvider userRole={user?.role}>
      <LayoutShell />
    </EnhancementProvider>
  );
}
