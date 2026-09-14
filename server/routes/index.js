import express from "express";
import {
  login,
  logout,
  changePassword,
  streamEvents,
} from "../controllers/authController.js";
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

// Account maintainence
router.post("/auth/login", login);
router.post("/auth/logout", verifyToken, logout);
router.put("/auth/change-password/:id", verifyToken, changePassword);
router.get("/events", streamEvents);

// User maintainence
router.get("/users", verifyToken, requireGroup("admin"), getUsers);
router.get("/users/:id", verifyToken, getUserById);
router.post("/users", verifyToken, requireGroup("admin"), createUser);
router.put("/users/:id", verifyToken, requireGroup("admin"), updateUser);

// Group maintainence
router.get("/groups/check", verifyToken, checkGroupEndpoint);
router.get("/groups", verifyToken, getAllGroups);
router.get("/groups/user/:id", verifyToken, getUserGroups);

export default router;
