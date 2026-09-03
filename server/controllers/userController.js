import pool from "../config/database.js";

// GET /api/users
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, roles, active, created_at, updated_at FROM accounts ORDER BY id",
    );
    const users = rows.map((u) => ({
      ...u,
      roles: typeof u.roles === "string" ? JSON.parse(u.roles) : u.roles,
      active: !!u.active,
    }));
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  const { username, email, password, roles, active } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO accounts (username, password, email, roles, active) VALUES (?, ?, ?, ?, ?)",
      [username, password, email, JSON.stringify(roles || []), active ? 1 : 0],
    );
    res.status(201).json({ message: "User created", id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, roles, active } = req.body;

  try {
    if (password) {
      await pool.query(
        "UPDATE accounts SET username = ?, email = ?, password = ?, roles = ?, active = ? WHERE id = ?",
        [
          username,
          email,
          password,
          JSON.stringify(roles || []),
          active ? 1 : 0,
          id,
        ],
      );
    } else {
      await pool.query(
        "UPDATE accounts SET username = ?, email = ?, roles = ?, active = ? WHERE id = ?",
        [username, email, JSON.stringify(roles || []), active ? 1 : 0, id],
      );
    }
    res.status(200).json({ message: "User updated" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
