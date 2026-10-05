import express from "express";
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
} from "../controllers/applicationController.js";
import { streamApplicationEvents } from "../controllers/eventsController.js";
import { verifyToken, requireGroup } from "../middleware/auth.js";

// Mounted at /api/applications - Project Lead creates/edits
const router = express.Router();

// Live-update stream (checks ?token= itself). Declared first so "/events"
// isn't read as "/:id".
router.get("/events", streamApplicationEvents);

router.get("/", verifyToken, getApplications);
router.get("/:id", verifyToken, getApplicationById);
router.post("/", verifyToken, requireGroup("Project Lead"), createApplication);
router.put("/:id", verifyToken, requireGroup("Project Lead"), updateApplication);

export default router;
