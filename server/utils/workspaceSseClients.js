import { createKeyedRegistry } from "./sseRegistry.js";

// Open Plans & Tasks / Task Board SSE connections, keyed by application id.
// Lets plan and task writes push a "something changed" signal to every open
// Plans & Tasks page or Task Board for that application, so a change one
// user makes - a new plan, a renamed task, a state/owner change - shows up
// for everyone else watching it without them needing to reload the page.
const registry = createKeyedRegistry();

export const addWorkspaceClient = (appId, res) => registry.add(appId, res);

export const removeWorkspaceClient = (appId, res) =>
  registry.remove(appId, res);

// Deliberately just a "something changed, go refetch" ping rather than the
// changed row itself - both pages already have fetchPlans()/fetchTasks() for
// their own create/edit/move flows, so reusing those here avoids a second
// place that has to know how to turn a plan/task row into UI state.
export const notifyWorkspaceChanged = (appId) =>
  registry.broadcast(appId, "changed");
