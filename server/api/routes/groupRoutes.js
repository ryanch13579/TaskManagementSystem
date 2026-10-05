import express from "express";
import { checkGroupEndpoint } from "../controllers/groupController.js";
import { verifyToken } from "../middleware/auth.js";

// Mounted at /api/groups
const router = express.Router();

router.get("/check", verifyToken, checkGroupEndpoint);

export default router;
