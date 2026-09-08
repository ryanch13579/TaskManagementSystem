import pool from "../config/database.js";

// Core function: does this user belong to this group?
// "Group" here means an entry in the account's `roles` JSON array — the same
// field the frontend, JWT payload, and user create/update forms all read and
// write. (The `groups`/`user_groups` tables below are a separate, unrelated
// dataset that nothing keeps in sync with `roles`, so they can't be used to
// answer this — a user created or promoted to admin via the UI only ever
// gets an entry in `roles`.)
export async function checkGroup(userId, groupName) {
  const [rows] = await pool.query("SELECT roles FROM accounts WHERE id = ?", [
    userId,
  ]);
  if (rows.length === 0) return false;

  const roles =
    typeof rows[0].roles === "string" ? JSON.parse(rows[0].roles) : rows[0].roles;
  return Array.isArray(roles) && roles.includes(groupName);
}

// OPTIONAL HTTP endpoint so it's testable/usable from the frontend too
export const checkGroupEndpoint = async (req, res) => {
  const { userId, groupName } = req.query;
  const inGroup = await checkGroup(userId, groupName);
  res.status(200).json({ userId, groupName, inGroup });
};

// List every group(id, name)
export const getAllGroups = async (req, res) => {
  const [rows] = await pool.query("SELECT id, name FROM `groups`");
  res.status(200).json(rows);
};

// List the groups a specific user belong to
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
