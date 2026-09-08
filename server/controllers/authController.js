import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { formatAccount, hashPassword, verifyPassword } from "../utils/accounts.js";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/;
const PASSWORD_RULE_MESSAGE =
  "New password must be 8-10 characters with at least one letter, number, and special character";

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const [rows] = await pool.query(
    "SELECT id, email, password, roles, active FROM accounts WHERE email = ?",
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

  const user = formatAccount(account);
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

export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError(400, "Both current and new password are required");
  }
  if (!PASSWORD_RULE.test(newPassword)) {
    throw new AppError(400, PASSWORD_RULE_MESSAGE);
  }

  const [rows] = await pool.query("SELECT password FROM accounts WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError(404, "User not found");
  }

  const match = await verifyPassword(currentPassword, rows[0].password);
  if (!match) {
    throw new AppError(401, "Current password is incorrect");
  }

  const hashed = await hashPassword(newPassword);
  await pool.query("UPDATE accounts SET password = ? WHERE id = ?", [hashed, id]);

  res.status(200).json({ message: "Password changed successfully" });
};
