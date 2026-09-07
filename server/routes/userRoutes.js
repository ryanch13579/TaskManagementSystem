import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import { verifyToken, requireGroup } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, requireGroup("admin"), getUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, requireGroup("admin"), createUser);
router.put("/:id", verifyToken, requireGroup("admin"), updateUser);

export default router;
