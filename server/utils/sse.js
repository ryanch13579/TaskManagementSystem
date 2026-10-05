import { decodeToken } from "../api/middleware/auth.js";

// Server-Sent Events (SSE): a long-lived HTTP response the server can keep
// pushing messages down, so open pages update without polling.
//
// A "channel" remembers which open responses are listening, grouped by a key
// (a user id, an application acronym, ...). send(key, ...) only reaches the
// listeners registered under that key.
const createChannel = () => {
  const listeners = new Map(); // key -> Set of open responses

  return {
    add(key, res) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(res);
    },
    remove(key, res) {
      listeners.get(key)?.delete(res);
      if (listeners.get(key)?.size === 0) listeners.delete(key);
    },
    send(key, event, data = {}) {
      for (const res of listeners.get(key) ?? []) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    },
  };
};

// Key for channels where everyone hears everything.
export const EVERYONE = "everyone";

export const userChannel = createChannel(); // key: user id - "your account changed"
export const adminChannel = createChannel(); // key: EVERYONE - "some user changed"
export const applicationChannel = createChannel(); // key: EVERYONE - "applications changed"
export const workspaceChannel = createChannel(); // key: app acronym - "plans/tasks changed"

// Opens an SSE response and keeps it open until the browser disconnects.
// `getSubscriptions(user)` returns the [channel, key] pairs to listen on.
// The token comes from the query string because the browser's EventSource
// can't send an Authorization header.
export const openSseStream = (req, res, getSubscriptions) => {
  const user = decodeToken(req.query.token);
  const subscriptions = getSubscriptions(user);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  for (const [channel, key] of subscriptions) channel.add(key, res);

  // A comment line every 30s stops proxies from closing an idle connection.
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    for (const [channel, key] of subscriptions) channel.remove(key, res);
  });
};
