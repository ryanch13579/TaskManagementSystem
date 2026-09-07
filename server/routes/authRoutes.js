import express from "express";
import { login, changePassword } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/login", login);
router.put("/change-password/:id", verifyToken, changePassword);

export default router;
