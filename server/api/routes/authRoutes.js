import express from "express";
import {
  login,
  logout,
  changePassword,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

// Mounted at /api/auth
const router = express.Router();

router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.put("/change-password/:id", verifyToken, changePassword);

export default router;
