import { AppError } from "../utils/errors.js";
import {
  openSseStream,
  userChannel,
  adminChannel,
  applicationChannel,
  workspaceChannel,
  EVERYONE,
} from "../utils/sse.js";

// Live-update streams (Server-Sent Events). Each keeps a connection open
// and pushes an event whenever the matching data changes - see utils/sse.js.
// These routes skip verifyToken: the token arrives as ?token=... instead.

// GET /api/events?token=...
// "updated": your own account changed. Admins also get "user-changed" for any user.
export const streamUserEvents = (req, res) => {
  openSseStream(req, res, (user) => {
    const subscriptions = [[userChannel, user.id]];
    if (user.roles?.includes("admin")) subscriptions.push([adminChannel, EVERYONE]);
    return subscriptions;
  });
};

// GET /api/applications/events?token=...
// "changed": an application was created or edited.
export const streamApplicationEvents = (req, res) => {
  openSseStream(req, res, () => [[applicationChannel, EVERYONE]]);
};

// GET /api/workspace/events?appId=...&token=...
// "changed": a plan or task in this application was created or edited.
export const streamWorkspaceEvents = (req, res) => {
  const { appId } = req.query;
  if (!appId) {
    throw new AppError(400, "appId is required");
  }
  openSseStream(req, res, () => [[workspaceChannel, appId]]);
};
