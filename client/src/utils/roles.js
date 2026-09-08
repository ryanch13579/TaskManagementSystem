// Frontend counterpart to the server's checkGroup — same name and signature
// (user/userId, groupName) so future features (e.g. task management) can gate
// on group membership the same way on both sides.
export const checkGroup = (user, groupName) => !!user?.roles?.includes(groupName);

export const isAdmin = (user) => checkGroup(user, "admin");

export const hasNonAdminRole = (user) => !!user?.roles?.some((r) => r !== "admin");
