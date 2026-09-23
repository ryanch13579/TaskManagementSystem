import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  formatUser,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../utils/users.js";
import {
  notifyUserUpdated,
  broadcastUserChanged,
} from "../utils/sseClients.js";

const toRolesJson = (roles) => JSON.stringify(roles || []);

// Throws if the username or email already belongs to a different user.
const assertNotDuplicate = async (runner, username, email, excludeId) => {
  const params = excludeId ? [username, email, excludeId] : [username, email];
  const [rows] = await runner.query(
    `SELECT user_id FROM users WHERE (LOWER(name) = LOWER(?) OR LOWER(email) = LOWER(?))${
      excludeId ? " AND user_id != ?" : ""
    }`,
    params,
  );
  if (rows.length > 0) {
    throw new AppError(
      409,
      "Username or email is already in use by another user",
    );
  }
};

const DUPLICATE_ERROR = new AppError(
  409,
  "Username or email is already in use by another user",
);
const STALE_UPDATE_ERROR = new AppError(
  409,
  "This user was changed by someone else. Refresh and try again.",
);

// assertNotDuplicate can't fully close the race between two concurrent
// requests for the same username/email - the UNIQUE keys on users.name/
// users.email are what actually make it atomic. This turns that DB-level
// duplicate-key error into the same 409 instead of a raw 500.
const withDuplicateGuard = async (fn) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err.code === "ER_DUP_ENTRY" ? DUPLICATE_ERROR : err;
  } finally {
    connection.release();
  }
};

// GET /api/users
export const getUsers = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT user_id AS id, name AS username, email, role AS roles, is_active AS active, created_at, updated_at FROM users ORDER BY user_id",
  );
  res.status(200).json(rows.map(formatUser));
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    "SELECT user_id AS id, name AS username, email, role AS roles, is_active AS active, updated_at FROM users WHERE user_id = ?",
    [id],
  );
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
  const insertId = await withDuplicateGuard(async (connection) => {
    await assertNotDuplicate(connection, username, email);
    const [result] = await connection.query(
      "INSERT INTO users (name, password_hash, email, role, is_active) VALUES (?, ?, ?, ?, ?)",
      [username, hashed, email, toRolesJson(roles), active ? 1 : 0],
    );
    return result.insertId;
  });

  res.status(201).json({ message: "User created", id: insertId });
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    username,
    email,
    password,
    roles,
    active,
    updated_at: updatedAt,
  } = req.body;

  if (!username || !email) {
    throw new AppError(400, "Username and email are required");
  }
  // null is valid (an unedited row's updated_at) - only a missing key is rejected.
  if (updatedAt === undefined) {
    throw new AppError(400, "Missing updated_at for the user being updated");
  }

  let hashed;
  if (password) {
    if (!PASSWORD_RULE.test(password)) {
      throw new AppError(400, PASSWORD_RULE_MESSAGE);
    }

    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = ?",
      [id],
    );
    if (rows.length === 0) {
      throw new AppError(404, "User not found");
    }
    const reused = await verifyPassword(password, rows[0].password_hash);
    if (reused) {
      throw new AppError(
        400,
        "New password must be different from the current password",
      );
    }
    hashed = await hashPassword(password);
  }

  await withDuplicateGuard(async (connection) => {
    await assertNotDuplicate(connection, username, email, id);

    // WHERE updated_at <=> ? only applies the write if the row still
    // matches what the caller last read (<=> handles a NULL updated_at
    // correctly); NOW(6) is set explicitly so a no-op save still bumps it.
    const [result] = hashed
      ? await connection.query(
          "UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, is_active = ?, updated_at = NOW(6) WHERE user_id = ? AND updated_at <=> ?",
          [
            username,
            email,
            hashed,
            toRolesJson(roles),
            active ? 1 : 0,
            id,
            updatedAt,
          ],
        )
      : await connection.query(
          "UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = NOW(6) WHERE user_id = ? AND updated_at <=> ?",
          [
            username,
            email,
            toRolesJson(roles),
            active ? 1 : 0,
            id,
            updatedAt,
          ],
        );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query(
        "SELECT user_id FROM users WHERE user_id = ?",
        [id],
      );
      throw rows.length === 0
        ? new AppError(404, "User not found")
        : STALE_UPDATE_ERROR;
    }
  });

  const [fresh] = await pool.query(
    "SELECT user_id AS id, name AS username, email, role AS roles, is_active AS active, created_at, updated_at FROM users WHERE user_id = ?",
    [id],
  );
  if (fresh.length > 0) {
    const user = formatUser(fresh[0]);
    notifyUserUpdated(Number(id), user);
    broadcastUserChanged(user);
  }

  res.status(200).json({ message: "User updated" });
};
