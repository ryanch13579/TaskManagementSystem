import jwt from "jsonwebtoken";
import pool from "../../config/database.js";
import { AppError } from "../../utils/errors.js";
import {
  USER_FIELDS,
  formatUser,
  hashPassword,
  verifyPassword,
  PASSWORD_RULE,
  PASSWORD_RULE_MESSAGE,
} from "../../utils/users.js";

// Compared against when the email isn't found, so a wrong email takes as
// long as a wrong password and response times don't reveal which accounts
// exist.
const DUMMY_HASH = await hashPassword("not-a-real-password");

// POST /api/auth/login
// Every failure - unknown email, wrong password, disabled account - gets
// the same 401, so the response never confirms that an account exists.
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const [rows] = await pool.query(
    `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = ?`,
    [email],
  );
  const account = rows[0];
  const passwordOk = await verifyPassword(
    password,
    account?.password_hash ?? DUMMY_HASH,
  );
  if (!account || !passwordOk || !account.active) {
    throw new AppError(401, "Invalid email or password");
  }

  const { id, username, roles } = formatUser(account);
  // Only the id goes in the token - groups can change after login, so
  // they're always looked up fresh (see middleware/auth.js).
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });

  // Only what the client needs for the session.
  res.status(200).json({ token, user: { id, username, roles } });
};

// POST /api/auth/logout - the token lives in the browser, so there's
// nothing to undo here; the client just forgets it.
export const logout = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// PUT /api/auth/change-password/:id - your own account only. Admins reset
// other users' passwords through PUT /api/users/:id instead.
export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (String(id) !== String(req.user.id)) {
    throw new AppError(403, "You can only change your own password");
  }

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
  if (!(await verifyPassword(currentPassword, rows[0].password_hash))) {
    throw new AppError(401, "Current password is incorrect");
  }

  await pool.query("UPDATE users SET password_hash = ? WHERE user_id = ?", [
    await hashPassword(newPassword),
    id,
  ]);
  res.status(200).json({ message: "Password changed successfully" });
};
