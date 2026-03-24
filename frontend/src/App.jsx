import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import Verify from "./pages/Verify";
import VerifyUser from "./pages/VerifyUser";
import CreateBatch from "./pages/CreateBatch";
import AdminUsers from "./pages/AdminUsers";
import InventoryManagement from "./pages/InventoryManagement";
import OrderDeliveryTracking from "./pages/OrderDeliveryTracking";
import DataAnalyticsDashboard from "./pages/DataAnalyticsDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/batch/:batchId" element={<Verify />} />
      <Route path="/verify/user/:walletAddress" element={<VerifyUser />} />
      <Route path="/verify/:batchId" element={<Verify />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="batches" element={<Batches />} />
        <Route path="batches/create" element={<CreateBatch />} />
        <Route path="batches/:batchId" element={<BatchDetail />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="delivery-tracking" element={<OrderDeliveryTracking />} />
        <Route path="data-analytics" element={<DataAnalyticsDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
