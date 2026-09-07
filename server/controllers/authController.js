import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, email, password, roles, active FROM accounts WHERE email = ?",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const account = rows[0];
    const match = await bcrypt.compare(password, account.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const roles =
      typeof account.roles === "string"
        ? JSON.parse(account.roles)
        : account.roles;
    const user = {
      id: account.id,
      email: account.email,
      roles,
      active: !!account.active,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both current and new password are required" });
  }

  const passwordRule = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/;
  if (!passwordRule.test(newPassword)) {
    return res.status(400).json({
      message:
        "New password must be 8-10 characters with at least one letter, number, and special character",
    });
  }

  try {
    const [rows] = await pool.query(
      "SELECT password FROM accounts WHERE id = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE accounts SET password = ? WHERE id = ?", [
      hashed,
      id,
    ]);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
