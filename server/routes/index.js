import express from "express";
import {
  login,
  logout,
  changePassword,
  streamEvents,
} from "../controllers/authController.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import {
  checkGroupEndpoint,
  getAllGroups,
  getUserGroups,
} from "../controllers/groupController.js";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  streamApplicationEvents,
} from "../controllers/applicationController.js";
import {
  getPlans,
  createPlan,
  updatePlan,
} from "../controllers/planController.js";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  streamWorkspaceEvents,
} from "../controllers/taskController.js";
import { verifyToken, requireGroup } from "../middleware/verifyToken.js";

const router = express.Router();

// Account maintainence
router.post("/auth/login", login);
router.post("/auth/logout", verifyToken, logout);
router.put("/auth/change-password/:id", verifyToken, changePassword);
router.get("/events", streamEvents);

// User maintainence
router.get("/users", verifyToken, requireGroup("admin"), getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users", verifyToken, requireGroup("admin"), createUser);
router.put("/users/:id", verifyToken, requireGroup("admin"), updateUser);

// Group maintainence
router.get("/groups/check", verifyToken, checkGroupEndpoint);
router.get("/groups", verifyToken, getAllGroups);
router.get("/groups/user/:id", verifyToken, getUserGroups);

// Application/Plan/Task maintainence. No requireGroup(...) yet - permissions
// are being deliberately deferred while the Plan/Task flow itself is built
// out; any authenticated user can read/write for now.
router.get("/applications", verifyToken, getApplications);
// Live "something changed" signal for the Applications page - see
// streamApplicationEvents. Not behind verifyToken, same reasoning as /events
// above (EventSource can't set an Authorization header). Registered before
// /applications/:id so "events" is never mistaken for an application id.
router.get("/applications/events", streamApplicationEvents);
router.get("/applications/:id", verifyToken, getApplicationById);
router.post("/applications", verifyToken, createApplication);
router.put("/applications/:id", verifyToken, updateApplication);

router.get("/plans", verifyToken, getPlans);
router.post("/plans", verifyToken, createPlan);
router.put("/plans/:id", verifyToken, updatePlan);

// Live "something changed" signal shared by the Plans & Tasks page and the
// Task Board - see streamWorkspaceEvents. Not behind verifyToken, same
// reasoning as /events above (EventSource can't set an Authorization header).
router.get("/workspace/events", streamWorkspaceEvents);

router.get("/tasks", verifyToken, getTasks);
router.post("/tasks", verifyToken, createTask);
router.put("/tasks/:id", verifyToken, updateTask);
router.delete("/tasks/:id", verifyToken, deleteTask);
router.get("/tasks/:id/history", verifyToken, getTaskHistory);

export default router;
