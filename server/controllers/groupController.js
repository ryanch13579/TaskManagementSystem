import pool from "../config/database.js";

// Core function: does this user belong to this group?
// This is the authorization source of truth — `accounts.roles` is a synced
// copy kept for the client/JWT (see syncUserGroups below), not the other way
// around.
export async function checkGroup(userId, groupName) {
  const [rows] = await pool.query(
    `SELECT 1 FROM user_groups ug
     JOIN \`groups\` g ON ug.group_id = g.id
     WHERE ug.user_id = ? AND g.name = ?`,
    [userId, groupName],
  );
  return rows.length > 0;
}

// Make user_groups match the account's `roles` array — call this any time
// `roles` is written so the two never drift apart again.
export async function syncUserGroups(userId, roles) {
  const roleList = Array.isArray(roles) ? roles : [];

  await pool.query("DELETE FROM user_groups WHERE user_id = ?", [userId]);
  if (roleList.length === 0) return;

  const [groupRows] = await pool.query(
    "SELECT id FROM `groups` WHERE name IN (?)",
    [roleList],
  );
  if (groupRows.length === 0) return;

  await pool.query("INSERT INTO user_groups (user_id, group_id) VALUES ?", [
    groupRows.map((g) => [userId, g.id]),
  ]);
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
