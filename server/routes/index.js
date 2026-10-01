import express from "express";
import {
  login,
  logout,
  changePassword,
} from "../controllers/authController.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import { checkGroupEndpoint } from "../controllers/groupController.js";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
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
  addTaskNote,
} from "../controllers/taskController.js";
import {
  streamUserEvents,
  streamApplicationEvents,
  streamWorkspaceEvents,
} from "../controllers/eventsController.js";
import { verifyToken, requireGroup } from "../middleware/auth.js";

// Every route is mounted under /api (see server.js).
//   verifyToken - must be logged in with an active account
//   requireGroup(name)  - must also belong to that group
const router = express.Router();

// Live-update streams. No verifyToken - they check ?token= themselves.
// Declared first so "/applications/events" isn't read as "/applications/:id".
router.get("/events", streamUserEvents);
router.get("/applications/events", streamApplicationEvents);
router.get("/workspace/events", streamWorkspaceEvents);

// Account
router.post("/auth/login", login);
router.post("/auth/logout", verifyToken, logout);
router.put("/auth/change-password/:id", verifyToken, changePassword);

// Users (admin only, except looking up a single user)
router.get("/users", verifyToken, requireGroup("admin"), getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users", verifyToken, requireGroup("admin"), createUser);
router.put("/users/:id", verifyToken, requireGroup("admin"), updateUser);

router.get("/groups/check", verifyToken, checkGroupEndpoint);

// Applications - Project Lead creates/edits
router.get("/applications", verifyToken, getApplications);
router.get("/applications/:id", verifyToken, getApplicationById);
router.post(
  "/applications",
  verifyToken,
  requireGroup("Project Lead"),
  createApplication,
);
router.put(
  "/applications/:id",
  verifyToken,
  requireGroup("Project Lead"),
  updateApplication,
);

// Plans - Project Manager creates/edits
router.get("/plans", verifyToken, getPlans);
router.post("/plans", verifyToken, requireGroup("Project Manager"), createPlan);
router.put(
  "/plans/:appId/:name",
  verifyToken,
  requireGroup("Project Manager"),
  updatePlan,
);

// Tasks - who may create or update depends on the application's permits
// (and, for updates, the change being made), so the handlers check that
// themselves.
router.get("/tasks", verifyToken, getTasks);
router.post("/tasks", verifyToken, createTask);
router.put("/tasks/:id", verifyToken, updateTask);
router.post("/tasks/:id/notes", verifyToken, addTaskNote);

export default router;
