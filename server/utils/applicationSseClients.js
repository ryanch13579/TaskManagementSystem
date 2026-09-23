import { createFlatRegistry } from "./sseRegistry.js";

// One flat registry, not keyed per application - the Applications page
// lists every application at once, so every tab gets the same signal.
const registry = createFlatRegistry();

export const addApplicationClient = (res) => registry.add(res);

export const removeApplicationClient = (res) => registry.remove(res);

export const notifyApplicationsChanged = () => registry.broadcast("changed");
