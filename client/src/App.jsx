import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Layout from "./components/Layout/Layout";
import Applications from "./pages/Applications/Applications";
import UserManagement from "./pages/UserManagement/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
