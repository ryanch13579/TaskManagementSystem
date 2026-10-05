import { api } from "./client";

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  changePassword: (userId, body, token) =>
    api.put(`/auth/change-password/${userId}`, body, token),
};
