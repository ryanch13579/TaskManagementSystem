import { api } from "./client";

export const usersApi = {
  list: (token) => api.get("/users", token),
  create: (values, token) => api.post("/users", values, token),
  update: (id, values, token) => api.put(`/users/${id}`, values, token),
};
