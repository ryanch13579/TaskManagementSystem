import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import { verifyToken, requireAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, requireAdmin, getUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, requireAdmin, createUser);
router.put("/:id", verifyToken, requireAdmin, updateUser);

export default router;
