import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  formatUser,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../utils/users.js";
import { addClient, removeClient } from "../utils/sseClients.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const [rows] = await pool.query(
    "SELECT user_id AS id, name AS username, email, password_hash AS password, role AS roles, is_active AS active FROM users WHERE email = ?",
    [email],
  );
  if (rows.length === 0) {
    throw new AppError(401, "Invalid email or password");
  }

  const account = rows[0];
  const match = await verifyPassword(password, account.password);
  if (!match) {
    throw new AppError(401, "Invalid email or password");
  }
  if (!account.active) {
    throw new AppError(403, "Account has been disabled");
  }

  const user = formatUser(account);
  delete user.password;

  // Encrypt the JWT token(ID + Email + Roles) x JWT_SECRET
  const token = jwt.sign(
    { id: user.id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  res.status(200).json({ message: "Login successful", token, user });
};

export const logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// GET /api/events?token=... — EventSource can't set an Authorization header,
// so the token travels as a query param here instead of through verifyToken.
export const streamEvents = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    throw new AppError(401, "No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  addClient(decoded.id, res, !!decoded.roles?.includes("admin"));
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(decoded.id, res);
  });
};

export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError(400, "Both current and new password are required");
  }
  if (!PASSWORD_RULE.test(newPassword)) {
    throw new AppError(400, PASSWORD_RULE_MESSAGE);
  }

  const [rows] = await pool.query("SELECT password_hash FROM users WHERE user_id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  const match = await verifyPassword(currentPassword, rows[0].password_hash);
  if (!match) {
    throw new AppError(401, "Current password is incorrect");
  }

  const hashed = await hashPassword(newPassword);
  await pool.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [hashed, id]);

  res.status(200).json({ message: "Password changed successfully" });
};
