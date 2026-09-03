import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, requiredRole = false }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && !user.roles?.includes(requiredRole)) {
    return <Navigate to="/applications" replace />;
  }

  return children;
}

export default ProtectedRoute;
