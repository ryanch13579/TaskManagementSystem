import bcrypt from "bcrypt";
import pool from "../config/database.js";

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/;
export const PASSWORD_RULE_MESSAGE =
  "Password must be 8-10 characters with at least one letter, number, and special character";

export const hashPassword = (plain) => bcrypt.hash(plain, 10);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Columns every "user" response uses, renamed to what the client expects.
export const USER_FIELDS =
  "user_id AS id, name AS username, email, role AS roles, is_active AS active, created_at, updated_at";

// mysql2 may return JSON columns as a string - always hand back a real value.
export const parseJson = (value) => (typeof value === "string" ? JSON.parse(value) : value);

export const formatUser = (row) => ({
  ...row,
  roles: parseJson(row.roles),
  active: !!row.active,
});

export const getUserName = async (userId) => {
  const [rows] = await pool.query("SELECT name FROM users WHERE user_id = ?", [userId]);
  return rows[0]?.name ?? "Unknown";
};

// Groups ("roles") are stored as a JSON array in users.role - there's no
// separate groups table.
export const checkGroup = async (userId, groupName) => {
  const [rows] = await pool.query(
    "SELECT 1 FROM users WHERE user_id = ? AND JSON_CONTAINS(role, JSON_QUOTE(?))",
    [userId, groupName],
  );
  return rows.length > 0;
};

// Emails of every active user in a group (used for email notifications).
export const getGroupEmails = async (groupName) => {
  const [rows] = await pool.query(
    "SELECT email FROM users WHERE is_active = 1 AND JSON_CONTAINS(role, JSON_QUOTE(?))",
    [groupName],
  );
  return rows.map((row) => row.email);
};
