import express from "express";
import {
  streamUserEvents,
  streamWorkspaceEvents,
} from "../controllers/eventsController.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import groupRoutes from "./groupRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import planRoutes from "./planRoutes.js";
import taskRoutes from "./taskRoutes.js";
import taskApiRoutes from "./taskApiRoutes.js";

// Every route is mounted under /api (see server.js).
//   verifyToken - must be logged in with an active account
//   requireGroup(name)  - must also belong to that group
const router = express.Router();

// Live-update streams. No verifyToken - they check ?token= themselves.
// (/applications/events lives in applicationRoutes.js.)
router.get("/events", streamUserEvents);
router.get("/workspace/events", streamWorkspaceEvents);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/groups", groupRoutes);
router.use("/applications", applicationRoutes);
router.use("/plans", planRoutes);
router.use("/tasks", taskRoutes);
router.use("/", taskApiRoutes); // /CreateTask, /GetTaskbyState, /PromoteTask2Done

export default router;
