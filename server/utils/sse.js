import { authenticate } from "../api/middleware/auth.js";

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

// Every open stream, by user id, so closeUserStreams can find them.
const streamsByUser = new Map(); // user id -> Set of open responses

// Opens an SSE response and keeps it open until the browser disconnects.
// `getSubscriptions(user)` returns (or resolves to) the [channel, key] pairs
// to listen on. The token comes from the query string because the browser's
// EventSource can't send an Authorization header.
export const openSseStream = async (req, res, getSubscriptions) => {
  const user = await authenticate(req.query.token);
  const subscriptions = await getSubscriptions(user);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  for (const [channel, key] of subscriptions) channel.add(key, res);
  const userKey = String(user.id);
  if (!streamsByUser.has(userKey)) streamsByUser.set(userKey, new Set());
  streamsByUser.get(userKey).add(res);

  // A comment line every 30s stops proxies from closing an idle connection.
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);

  // res (not req) "close" fires both when the browser disconnects and when
  // closeUserStreams ends the response.
  res.on("close", () => {
    clearInterval(heartbeat);
    for (const [channel, key] of subscriptions) channel.remove(key, res);
    streamsByUser.get(userKey)?.delete(res);
    if (streamsByUser.get(userKey)?.size === 0) streamsByUser.delete(userKey);
  });
};

// What a stream subscribes to is decided when it opens, from the user's
// groups at that moment. Call this after changing a user's groups or
// disabling them: their streams end, the browser's EventSource reconnects
// on its own, and the reconnect is checked against the new groups (or
// refused, if the account is now disabled).
export const closeUserStreams = (userId) => {
  for (const res of streamsByUser.get(String(userId)) ?? []) res.end();
};
