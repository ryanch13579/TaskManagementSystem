import { api } from "./client";

export const plansApi = {
  list: (appId, token) => api.get(`/plans?appId=${encodeURIComponent(appId)}`, token),
  create: (values, token) => api.post("/plans", values, token),
  update: (appId, name, values, token) =>
    api.put(`/plans/${encodeURIComponent(appId)}/${encodeURIComponent(name)}`, values, token),
};
