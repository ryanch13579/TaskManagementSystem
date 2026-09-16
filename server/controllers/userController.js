import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  formatUser,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../utils/users.js";
import { syncUserGroups } from "./groupController.js";
import {
  notifyUserUpdated,
  broadcastUserChanged,
} from "../utils/sseClients.js";

const toRolesJson = (roles) => JSON.stringify(roles || []);

// Throws if the username or email already belongs to a different user.
// Takes a pool or a checked-out connection so callers can run this as part
// of a larger transaction.
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

// The pre-check above can't fully close the race between two concurrent
// requests for the same username/email (both can pass it before either
// commits) — the UNIQUE keys on `users`.`name` and `users`.`email` are what
// actually make this atomic. Running the check + write in one transaction
// and treating a duplicate-key error as the same 409 makes that DB-level
// guarantee visible to the caller instead of surfacing a raw 500.
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

  await syncUserGroups(insertId, roles);
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
  // `null` is valid here — it's what a row that has never been updated
  // since creation carries — so only a missing key is rejected.
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

    // Only update the row if it has not changed since the caller last read it.
    // The updated_at value is used to check this.
    //
    // If updated_at is NULL (meaning the row has never been updated), <=>
    // still compares it correctly.
    //
    // If someone else changed the row first, updated_at will be different.
    // The UPDATE will then affect 0 rows, so we do not accidentally overwrite
    // their changes.
    //
    // We set updated_at to NOW(6) ourselves instead of relying on MySQL's
    // automatic update trigger. This makes sure updated_at changes even when
    // the user saves without changing any other data.
    //
    // Otherwise, MySQL could report 0 affected rows for a save that made no
    // changes, and the code might wrongly think there was a conflict.
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

    await syncUserGroups(id, roles, connection);
  });

  const [fresh] = await pool.query(
    "SELECT user_id AS id, name AS username, email, role AS roles, is_active AS active, created_at, updated_at FROM users WHERE user_id = ?",
    [id],
  );
  if (fresh.length > 0) {
    const user = formatUser(fresh[0]);
    notifyUserUpdated(Number(id), user);
    // Lets an admin who has this same row open see the conflict as it
    // happens instead of only finding out when their own save is rejected.
    broadcastUserChanged(user);
  }

  res.status(200).json({ message: "User updated" });
};
