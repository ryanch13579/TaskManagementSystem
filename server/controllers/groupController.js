import pool from "../config/database.js";

// Core function: does this user belong to this group?
export async function checkGroup(userId, groupName) {
  const [rows] = await pool.query(
    `SELECT 1 FROM user_groups ug
     JOIN \`groups\` g ON ug.group_id = g.id
     WHERE ug.user_id = ? AND g.name = ?`,
    [userId, groupName],
  );
  return rows.length > 0;
}

// Optional HTTP endpoint so it's testable/usable from the frontend too
export const checkGroupEndpoint = async (req, res) => {
  const { userId, groupName } = req.query;
  try {
    const result = await checkGroup(userId, groupName);
    res.status(200).json({ userId, groupName, inGroup: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllGroups = async (req, res) => {
  const [rows] = await pool.query("SELECT id, name FROM `groups`");
  res.status(200).json(rows);
};

export const getUserGroups = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT g.id, g.name FROM user_groups ug
     JOIN \`groups\` g ON ug.group_id = g.id
     WHERE ug.user_id = ?`,
    [id],
  );
  res.status(200).json(rows);
};
