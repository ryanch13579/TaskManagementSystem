import express from "express";
import { login, changePassword } from "../controllers/authController.js";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/userController.js";
import {
  checkGroupEndpoint,
  getAllGroups,
  getUserGroups,
} from "../controllers/groupController.js";
import { verifyToken, requireGroup } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/auth/login", login);
router.put("/auth/change-password/:id", verifyToken, changePassword);

router.get("/users", verifyToken, requireGroup("admin"), getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users", verifyToken, requireGroup("admin"), createUser);
router.put("/users/:id", verifyToken, requireGroup("admin"), updateUser);

router.get("/groups/check", verifyToken, checkGroupEndpoint);
router.get("/groups", verifyToken, getAllGroups);
router.get("/groups/user/:id", verifyToken, getUserGroups);

export default router;
