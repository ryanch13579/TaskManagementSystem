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
import { checkGroupEndpoint } from "../controllers/groupController.js";
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

// Application/Plan/Task maintainence. Create/edit is gated per role -
// Project Lead owns applications and tasks, Project Manager owns plans.
// Task state-change permissions are finer-grained (see TRANSITION_ROLES in
// taskController.js), so they're checked inside updateTask itself.
router.get("/applications", verifyToken, getApplications);
// Not behind verifyToken - EventSource can't set an Authorization header.
// Registered before /applications/:id so "events" isn't read as an id.
router.get("/applications/events", streamApplicationEvents);
router.get("/applications/:id", verifyToken, getApplicationById);
router.post("/applications", verifyToken, requireGroup("Project Lead"), createApplication);
router.put("/applications/:id", verifyToken, requireGroup("Project Lead"), updateApplication);

router.get("/plans", verifyToken, getPlans);
router.post("/plans", verifyToken, requireGroup("Project Manager"), createPlan);
router.put("/plans/:appId/:name", verifyToken, requireGroup("Project Manager"), updatePlan);

router.get("/workspace/events", streamWorkspaceEvents);

router.get("/tasks", verifyToken, getTasks);
router.post("/tasks", verifyToken, requireGroup("Project Lead"), createTask);
router.put("/tasks/:id", verifyToken, updateTask);

export default router;
