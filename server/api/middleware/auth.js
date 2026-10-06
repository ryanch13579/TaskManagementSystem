import jwt from "jsonwebtoken";
import pool from "../../config/database.js";
import { AppError } from "../../utils/errors.js";
import { checkGroup } from "../../utils/users.js";

// Turns a JWT into its payload ({ id }), or throws a 401.
// One message for every failure, so callers can't tell a missing token
// from a forged or expired one.
export const decodeToken = (token) => {
  if (!token) {
    throw new AppError(401, "Unauthorized");
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Unauthorized");
  }
};

// Decodes the token, then checks the account is still active *now* - an
// admin may have disabled it since the token was issued. Returns only
// { id }: groups can also change after login, so every permission check
// re-reads them from the database (checkGroup) instead of trusting the token.
export const authenticate = async (token) => {
  const { id } = decodeToken(token);
  const [rows] = await pool.query("SELECT is_active FROM users WHERE user_id = ?", [id]);
  if (!rows[0]?.is_active) {
    throw new AppError(403, "Account has been disabled");
  }
  return { id };
};

// Requires "Authorization: Bearer <token>" from an active account.
// Sets req.user for the handlers after it.
export const verifyToken = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  req.user = await authenticate(scheme === "Bearer" ? token : null);
  next();
};

// Use after verifyToken: only lets members of `groupName` through.
export const requireGroup = (groupName) => async (req, res, next) => {
  if (!(await checkGroup(req.user.id, groupName))) {
    throw new AppError(403, "Access denied");
  }
  next();
};
