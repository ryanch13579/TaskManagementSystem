// Client-side copy of the server's group checks. These only decide what the
// UI shows - the server enforces the real rules.
export const checkGroup = (user, groupName) => !!user?.roles?.includes(groupName);

export const isAdmin = (user) => checkGroup(user, "admin");

export const hasNonAdminRole = (user) => !!user?.roles?.some((r) => r !== "admin");

// Spread onto a button only `groupName` members may use. Everyone else sees
// it greyed out (see LOCKABLE in styles/shared.js) with a tooltip saying why.
export const onlyFor = (user, groupName) =>
  checkGroup(user, groupName) ? {} : { disabled: true, title: `Requires ${groupName}` };
