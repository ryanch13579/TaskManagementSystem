import jwt from "jsonwebtoken";
import pool from "../../config/database.js";
import { AppError } from "../../utils/errors.js";
import { checkGroup } from "../../utils/users.js";

// Turns a JWT into its payload ({ id, email, roles }), or throws a 401.
export const decodeToken = (token) => {
  if (!token) {
    throw new AppError(401, "No token provided");
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
};

// Requires "Authorization: Bearer <token>" from an active account.
// Sets req.user for the handlers after it.
export const verifyToken = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  const user = decodeToken(scheme === "Bearer" ? token : null);

  const [rows] = await pool.query("SELECT is_active FROM users WHERE user_id = ?", [user.id]);
  if (!rows[0]?.is_active) {
    throw new AppError(403, "Account has been disabled");
  }

  req.user = user;
  next();
};

// Use after verifyToken: only lets members of `groupName` through.
export const requireGroup = (groupName) => async (req, res, next) => {
  if (!(await checkGroup(req.user.id, groupName))) {
    throw new AppError(403, `${groupName} group access required`);
  }
  next();
};
