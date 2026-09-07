import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { checkGroup } from "../controllers/groupController.js";
import { AppError } from "../utils/errors.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "No token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  const [rows] = await pool.query("SELECT active FROM accounts WHERE id = ?", [decoded.id]);
  if (rows.length === 0 || !rows[0].active) {
    throw new AppError(403, "Account has been disabled");
  }

  req.user = decoded;
  next();
};

export const requireGroup = (groupName) => async (req, res, next) => {
  const inGroup = await checkGroup(req.user.id, groupName);
  if (!inGroup) {
    throw new AppError(403, `${groupName} group access required`);
  }
  next();
};
