import express from "express";
import {
  getPlans,
  createPlan,
  updatePlan,
} from "../controllers/planController.js";
import { verifyToken, requireGroup } from "../middleware/auth.js";

// Mounted at /api/plans - Project Manager creates/edits
const router = express.Router();

router.get("/", verifyToken, getPlans);
router.post("/", verifyToken, requireGroup("Project Manager"), createPlan);
router.put(
  "/:appId/:name",
  verifyToken,
  requireGroup("Project Manager"),
  updatePlan,
);

export default router;
