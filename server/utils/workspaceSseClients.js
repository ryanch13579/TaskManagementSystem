import { createKeyedRegistry } from "./sseRegistry.js";

// Open Plans & Tasks / Task Board SSE connections, keyed by application id.
const registry = createKeyedRegistry();

export const addWorkspaceClient = (appId, res) => registry.add(appId, res);

export const removeWorkspaceClient = (appId, res) =>
  registry.remove(appId, res);

// Just a "something changed, go refetch" ping, not the changed row itself -
// the client re-fetches with the same code path its own writes already use.
export const notifyWorkspaceChanged = (appId) =>
  registry.broadcast(appId, "changed");
