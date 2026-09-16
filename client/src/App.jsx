import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Layout from "./components/Layout/Layout";
import Applications from "./pages/Applications/Applications";
import PlansAndTasks from "./pages/PlansAndTasks/PlansAndTasks";
import TaskBoard from "./pages/TaskBoard/TaskBoard";
import UserManagement from "./pages/UserManagement/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { isAdmin, hasNonAdminRole } from "./utils/roles";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Layout />}>
        <Route
          path="/applications"
          element={
            <ProtectedRoute check={hasNonAdminRole}>
              <Applications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:appId/plans-tasks"
          element={
            <ProtectedRoute check={hasNonAdminRole}>
              <PlansAndTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:appId/task-board"
          element={
            <ProtectedRoute check={hasNonAdminRole}>
              <TaskBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute check={isAdmin}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
