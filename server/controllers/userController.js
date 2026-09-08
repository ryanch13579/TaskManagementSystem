import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { formatAccount, hashPassword } from "../utils/accounts.js";
import { syncUserGroups } from "./groupController.js";

const toRolesJson = (roles) => JSON.stringify(roles || []);

// GET /api/users
export const getUsers = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, username, email, roles, active, created_at, updated_at FROM accounts ORDER BY id",
  );
  res.status(200).json(rows.map(formatAccount));
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    "SELECT id, username, email, roles, active FROM accounts WHERE id = ?",
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

  const hashed = await hashPassword(password);
  const [result] = await pool.query(
    "INSERT INTO accounts (username, password, email, roles, active) VALUES (?, ?, ?, ?, ?)",
    [username, hashed, email, toRolesJson(roles), active ? 1 : 0],
  );
  await syncUserGroups(result.insertId, roles);
  res.status(201).json({ message: "User created", id: result.insertId });
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles, active } = req.body;

  if (password) {
    const hashed = await hashPassword(password);
    await pool.query(
      "UPDATE accounts SET username = ?, email = ?, password = ?, roles = ?, active = ? WHERE id = ?",
      [username, email, hashed, toRolesJson(roles), active ? 1 : 0, id],
    );
  } else {
    await pool.query(
      "UPDATE accounts SET username = ?, email = ?, roles = ?, active = ? WHERE id = ?",
      [username, email, toRolesJson(roles), active ? 1 : 0, id],
    );
  }
  await syncUserGroups(id, roles);
  res.status(200).json({ message: "User updated" });
};
