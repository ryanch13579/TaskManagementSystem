import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (requireAdmin && user.role !== "admin")
    return <Navigate to="/applications" replace />;

  return children;
}

export default ProtectedRoute;
