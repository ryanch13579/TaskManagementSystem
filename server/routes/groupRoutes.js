import express from "express";
import {
  checkGroupEndpoint,
  getAllGroups,
  getUserGroups,
} from "../controllers/groupController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check", verifyToken, checkGroupEndpoint);
router.get("/", verifyToken, getAllGroups);
router.get("/user/:id", verifyToken, getUserGroups);

export default router;
