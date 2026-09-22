// Shared "who's listening" bookkeeping for the app's SSE channels (account
// updates, per-application workspace changes, the Applications page). Every
// channel needs the same two things - track open connections, fan a
// "something changed" event out to them - so that part lives here once;
// each channel file (sseClients.js, workspaceSseClients.js,
// applicationSseClients.js) just wires one of these up and names its own
// event(s).

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

// A flat registry: every connection gets every broadcast. For a channel
// where every viewer cares about every change - e.g. the Applications page,
// which lists every application at once.
export const createFlatRegistry = () => {
  const clients = new Set();
  return {
    add: (res) => clients.add(res),
    remove: (res) => clients.delete(res),
    broadcast: (event, data = {}) => {
      for (const res of clients) writeSseEvent(res, event, data);
    },
  };
};

// A registry keyed by some id (application id, user id, ...): a connection
// only hears about broadcasts for the key it registered under - e.g. a Task
// Board only cares about its own application's changes.
export const createKeyedRegistry = () => {
  const clients = new Map();
  return {
    add: (key, res) => {
      if (!clients.has(key)) clients.set(key, new Set());
      clients.get(key).add(res);
    },
    remove: (key, res) => {
      const set = clients.get(key);
      if (!set) return;
      set.delete(res);
      if (set.size === 0) clients.delete(key);
    },
    broadcast: (key, event, data = {}) => {
      const set = clients.get(key);
      if (!set) return;
      for (const res of set) writeSseEvent(res, event, data);
    },
  };
};
