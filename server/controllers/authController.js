import pool from "../config/database.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, roles FROM accounts WHERE username = ? AND password = ?",
      [username, password],
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];
    if (typeof user.roles === "string") user.roles = JSON.parse(user.roles);

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
