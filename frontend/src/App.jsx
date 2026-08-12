import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PageLoader } from "./components/ui/Loader";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Designer from "./pages/Designer";
import Templates from "./pages/Templates";
import BatchImport from "./pages/BatchImport";
import PrintPreview from "./pages/PrintPreview";
import PrintHistory from "./pages/PrintHistory";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Labels from "./pages/Labels";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (token) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="designer" element={<Designer />} />
        <Route path="designer/:id" element={<Designer />} />
        <Route path="templates" element={<Templates />} />
        <Route path="import" element={<BatchImport />} />
        <Route path="preview" element={<PrintPreview />} />
        <Route path="preview/:id" element={<PrintPreview />} />
        <Route path="print/:id" element={<PrintPreview />} />
        <Route path="history" element={<PrintHistory />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
        <Route path="labels" element={<Labels />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
