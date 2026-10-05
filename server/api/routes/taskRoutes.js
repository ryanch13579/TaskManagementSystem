import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  addTaskNote,
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/auth.js";

// Mounted at /api/tasks. Who may create or update depends on the
// application's permits (and, for updates, the change being made), so the
// handlers check that themselves.
const router = express.Router();

router.get("/", verifyToken, getTasks);
router.post("/", verifyToken, createTask);
router.put("/:id", verifyToken, updateTask);
router.post("/:id/notes", verifyToken, addTaskNote);

export default router;
