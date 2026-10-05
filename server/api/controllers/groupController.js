import { checkGroup } from "../../utils/users.js";

// GET /api/groups/check?userId=...&groupName=...
export const checkGroupEndpoint = async (req, res) => {
  const { userId, groupName } = req.query;
  const inGroup = await checkGroup(userId, groupName);
  res.status(200).json({ userId, groupName, inGroup });
};
