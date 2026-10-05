import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import { verifyToken, requireGroup } from "../middleware/auth.js";

// Mounted at /api/users - admin only, except looking up a single user
const router = express.Router();

router.get("/", verifyToken, requireGroup("admin"), getUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, requireGroup("admin"), createUser);
router.put("/:id", verifyToken, requireGroup("admin"), updateUser);

export default router;
