import { api } from "./client";

const taskPath = (id) => `/tasks/${encodeURIComponent(id)}`;

export const tasksApi = {
  list: (appId, token) => api.get(`/tasks?appId=${encodeURIComponent(appId)}`, token),
  create: (values, token) => api.post("/tasks", values, token),
  update: (id, values, token) => api.put(taskPath(id), values, token),
  addNote: (id, text, token) => api.post(`${taskPath(id)}/notes`, { text }, token),
};
