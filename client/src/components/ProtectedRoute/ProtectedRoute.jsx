import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, check }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (check && !check(user)) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
