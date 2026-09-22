import { createFlatRegistry } from "./sseRegistry.js";

// Open Applications-page SSE connections. Unlike workspaceSseClients.js
// (scoped per application id, for the Plans & Tasks page and Task Board),
// this is one flat registry - the Applications page lists every application
// at once, so every connected tab needs the same "something changed" signal
// no matter which application changed.
const registry = createFlatRegistry();

export const addApplicationClient = (res) => registry.add(res);

export const removeApplicationClient = (res) => registry.remove(res);

// Deliberately just a "something changed, go refetch" ping rather than the
// changed application itself - the client already has fetchApplications()
// for its own create/edit flow, so reusing that here avoids a second place
// that has to know how to turn an application row into UI state.
export const notifyApplicationsChanged = () => registry.broadcast("changed");
