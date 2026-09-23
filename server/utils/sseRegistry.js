// Shared "who's listening" bookkeeping for the app's SSE channels.

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

// Every connection gets every broadcast.
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

// A connection only hears broadcasts for the key it registered under.
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
