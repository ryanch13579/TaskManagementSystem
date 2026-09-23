import pool from "../config/database.js";

// Does this user belong to this group? users.role is the sole source of
// truth for group membership.
export async function checkGroup(userId, groupName) {
  const [rows] = await pool.query(
    "SELECT 1 FROM users WHERE user_id = ? AND JSON_CONTAINS(role, JSON_QUOTE(?)) LIMIT 1",
    [userId, groupName],
  );
  return rows.length > 0;
}

// Emails of every active user belonging to a group.
export async function getGroupEmails(groupName) {
  const [users] = await pool.query(
    "SELECT user_id, email FROM users WHERE is_active = 1",
  );

  const emails = [];
  for (const user of users) {
    if (await checkGroup(user.user_id, groupName)) {
      emails.push(user.email);
    }
  }
  return emails;
}

// OPTIONAL HTTP endpoint so it's testable/usable from the frontend too
export const checkGroupEndpoint = async (req, res) => {
  const { userId, groupName } = req.query;
  const inGroup = await checkGroup(userId, groupName);
  res.status(200).json({ userId, groupName, inGroup });
};
