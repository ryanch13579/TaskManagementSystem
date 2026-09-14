import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import {
  formatAccount,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../utils/accounts.js";
import { syncUserGroups } from "./groupController.js";
import { notifyAccountUpdated, broadcastAccountChanged } from "../utils/sseClients.js";

const toRolesJson = (roles) => JSON.stringify(roles || []);

// Throws if username/email already belongs to a different account.
// Takes a pool or a checked-out connection so callers can run this as part
// of a larger transaction.
const assertNotDuplicate = async (runner, username, email, excludeId) => {
  const params = excludeId
    ? [username, email, excludeId]
    : [username, email];
  const [rows] = await runner.query(
    `SELECT id FROM accounts WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?))${
      excludeId ? " AND id != ?" : ""
    }`,
    params,
  );
  if (rows.length > 0) {
    throw new AppError(409, "Username or email is already in use by another account");
  }
};

const DUPLICATE_ERROR = new AppError(409, "Username or email is already in use by another account");
const STALE_UPDATE_ERROR = new AppError(
  409,
  "This user was changed by someone else. Refresh and try again.",
);

// The pre-check above can't fully close the race between two concurrent
// requests for the same username/email (both can pass it before either
// commits) — the UNIQUE keys on `accounts` are what actually make this
// atomic. Running the check + write in one transaction and treating a
// duplicate-key error as the same 409 makes that DB-level guarantee visible
// to the caller instead of surfacing a raw 500.
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
    "SELECT id, username, email, roles, active, created_at, updated_at, version FROM accounts ORDER BY id",
  );
  res.status(200).json(rows.map(formatAccount));
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    "SELECT id, username, email, roles, active, version FROM accounts WHERE id = ?",
    [id],
  );
  if (rows.length === 0) {
    throw new AppError(404, "User not found");
  }
  res.status(200).json(formatAccount(rows[0]));
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
      "INSERT INTO accounts (username, password, email, roles, active) VALUES (?, ?, ?, ?, ?)",
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
  const { username, email, password, roles, active, version } = req.body;

  if (!username || !email) {
    throw new AppError(400, "Username and email are required");
  }
  if (version === undefined || version === null) {
    throw new AppError(400, "Missing version for the account being updated");
  }

  let hashed;
  if (password) {
    if (!PASSWORD_RULE.test(password)) {
      throw new AppError(400, PASSWORD_RULE_MESSAGE);
    }

    const [rows] = await pool.query("SELECT password FROM accounts WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new AppError(404, "User not found");
    }
    const reused = await verifyPassword(password, rows[0].password);
    if (reused) {
      throw new AppError(400, "New password must be different from the current password");
    }
    hashed = await hashPassword(password);
  }

  await withDuplicateGuard(async (connection) => {
    await assertNotDuplicate(connection, username, email, id);

    // The WHERE ... AND version = ? ties this write to the row state the
    // caller actually read. If someone else updated the row first, version
    // has already moved on and this UPDATE matches zero rows instead of
    // silently clobbering their change (see add_version_column.sql).
    const [result] = hashed
      ? await connection.query(
          "UPDATE accounts SET username = ?, email = ?, password = ?, roles = ?, active = ?, version = version + 1 WHERE id = ? AND version = ?",
          [username, email, hashed, toRolesJson(roles), active ? 1 : 0, id, version],
        )
      : await connection.query(
          "UPDATE accounts SET username = ?, email = ?, roles = ?, active = ?, version = version + 1 WHERE id = ? AND version = ?",
          [username, email, toRolesJson(roles), active ? 1 : 0, id, version],
        );

    if (result.affectedRows === 0) {
      const [rows] = await connection.query("SELECT id FROM accounts WHERE id = ?", [id]);
      throw rows.length === 0 ? new AppError(404, "User not found") : STALE_UPDATE_ERROR;
    }

    await syncUserGroups(id, roles, connection);
  });

  const [fresh] = await pool.query(
    "SELECT id, username, email, roles, active, created_at, updated_at, version FROM accounts WHERE id = ?",
    [id],
  );
  if (fresh.length > 0) {
    const account = formatAccount(fresh[0]);
    notifyAccountUpdated(Number(id), account);
    // Lets an admin who has this same row open see the conflict as it
    // happens instead of only finding out when their own save is rejected.
    broadcastAccountChanged(account);
  }

  res.status(200).json({ message: "User updated" });
};
