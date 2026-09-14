// In-memory registry of open SSE connections, keyed by user id. Lets other
// controllers push live user changes (e.g. an admin disabling a user) to
// that user's browser without waiting for their next request.
const clients = new Map();

// Separately tracks which open connections belong to admins, so a user
// change can also be broadcast to every open UserManagement tab — not just
// the one belonging to the user that changed — letting an admin editing
// that same row see the conflict before they save instead of after.
const adminClients = new Set();

export const addClient = (userId, res, isAdmin = false) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  if (isAdmin) adminClients.add(res);
};

export const removeClient = (userId, res) => {
  const set = clients.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  }
  adminClients.delete(res);
};

const write = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const notifyUserUpdated = (userId, user) => {
  const set = clients.get(userId);
  if (!set) return;
  for (const res of set) write(res, "updated", user);
};

export const broadcastUserChanged = (user) => {
  for (const res of adminClients) write(res, "user-changed", user);
};
