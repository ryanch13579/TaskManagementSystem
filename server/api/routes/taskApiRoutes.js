import express from "express";
import {
  createTask,
  getTasksByState,
  promoteTask2Done,
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/auth.js";

// Mounted at /api. Single-purpose task endpoints for callers outside the
// web client. Like taskRoutes.js, permits are checked in the handlers.
const router = express.Router();

router.post("/CreateTask", verifyToken, createTask);
router.get("/GetTaskbyState", verifyToken, getTasksByState);
router.patch("/PromoteTask2Done", verifyToken, promoteTask2Done);

export default router;
