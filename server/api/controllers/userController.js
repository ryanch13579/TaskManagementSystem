import pool, { withTransaction } from "../../config/database.js";
import { AppError, throwMissingOrStale } from "../../utils/errors.js";
import {
  USER_FIELDS,
  formatUser,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../../utils/users.js";
import { userChannel, adminChannel, EVERYONE } from "../../utils/sse.js";

// users.name and users.email are UNIQUE (case-insensitive), so MySQL
// itself rejects duplicates - withTransaction turns that into this 409.
const DUPLICATE_MESSAGE = "Username or email is already in use by another user";

// GET /api/users
export const getUsers = async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users ORDER BY user_id`);
  res.status(200).json(rows.map(formatUser));
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE user_id = ?`, [
    req.params.id,
  ]);
  if (rows.length === 0) {
    throw new AppError(404, "User not found");
  }
  res.status(200).json(formatUser(rows[0]));
};

// POST /api/users
export const createUser = async (req, res) => {
  const { username, email, password, roles, active } = req.body;
  if (!username || !email || !password) {
    throw new AppError(400, "Username, email and password are required");
  }
  if (!PASSWORD_RULE.test(password)) {
    throw new AppError(400, PASSWORD_RULE_MESSAGE);
  }

  const hashed = await hashPassword(password);
  const id = await withTransaction(async (db) => {
    const [result] = await db.query(
      "INSERT INTO users (name, password_hash, email, role, is_active) VALUES (?, ?, ?, ?, ?)",
      [username, hashed, email, JSON.stringify(roles || []), active ? 1 : 0],
    );
    return result.insertId;
  }, DUPLICATE_MESSAGE);

  res.status(201).json({ message: "User created", id });
};

// PUT /api/users/:id - password is optional; leave it out to keep the old one.
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles, active, updated_at: updatedAt } = req.body;

  if (!username || !email) {
    throw new AppError(400, "Username and email are required");
  }
  // null is fine (a never-edited row) - only a missing value is rejected.
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the user being updated");
  }

  let newHash = null;
  if (password) {
    if (!PASSWORD_RULE.test(password)) {
      throw new AppError(400, PASSWORD_RULE_MESSAGE);
    }
    const [rows] = await pool.query("SELECT password_hash FROM users WHERE user_id = ?", [id]);
    if (rows.length === 0) {
      throw new AppError(404, "User not found");
    }
    if (await verifyPassword(password, rows[0].password_hash)) {
      throw new AppError(400, "New password must be different from the current password");
    }
    newHash = await hashPassword(password);
  }

  await withTransaction(async (db) => {
    // COALESCE keeps the old hash when no new password was given.
    const [result] = await db.query(
      `UPDATE users
         SET name = ?, email = ?, password_hash = COALESCE(?, password_hash),
             role = ?, is_active = ?, updated_at = NOW(6)
       WHERE user_id = ? AND updated_at <=> ?`,
      [username, email, newHash, JSON.stringify(roles || []), active ? 1 : 0, id, updatedAt],
    );
    if (result.affectedRows === 0) {
      await throwMissingOrStale(db, "SELECT 1 FROM users WHERE user_id = ?", [id], "User");
    }
  }, DUPLICATE_MESSAGE);

  // Push the saved user to that user's open tabs (Layout logs them out if
  // disabled) and to every open User Management page.
  const [rows] = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE user_id = ?`, [id]);
  const user = formatUser(rows[0]);
  userChannel.send(user.id, "updated", user);
  adminChannel.send(EVERYONE, "user-changed", user);

  res.status(200).json({ message: "User updated" });
};
