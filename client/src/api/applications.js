import { api } from "./client";

const appPath = (acronym) => `/applications/${encodeURIComponent(acronym)}`;

export const applicationsApi = {
  list: (token) => api.get("/applications", token),
  get: (acronym, token) => api.get(appPath(acronym), token),
  create: (values, token) => api.post("/applications", values, token),
  update: (acronym, values, token) => api.put(appPath(acronym), values, token),
};
