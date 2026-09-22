import { createKeyedRegistry, createFlatRegistry } from "./sseRegistry.js";

// Per-user connections (keyed by user id) for direct "your account changed"
// pushes, e.g. an admin disabling a user.
const userRegistry = createKeyedRegistry();

// Separately tracks just the admin connections, so a user change can also
// be broadcast to every open UserManagement tab - not just the one
// belonging to the user that changed - letting an admin editing that same
// row see the conflict before they save instead of after.
const adminRegistry = createFlatRegistry();

export const addClient = (userId, res, isAdmin = false) => {
  userRegistry.add(userId, res);
  if (isAdmin) adminRegistry.add(res);
};

export const removeClient = (userId, res) => {
  userRegistry.remove(userId, res);
  adminRegistry.remove(res);
};

export const notifyUserUpdated = (userId, user) =>
  userRegistry.broadcast(userId, "updated", user);

export const broadcastUserChanged = (user) =>
  adminRegistry.broadcast("user-changed", user);
