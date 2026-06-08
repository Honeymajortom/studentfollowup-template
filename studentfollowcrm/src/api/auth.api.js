// src/api/auth.api.js
import api from "./axios";

const authApi = {
  // POST /api/auth/login
  login: (email, password) =>
    api.post("/auth/login", { email, password }),

  // GET /api/auth/me
  getMe: () =>
    api.get("/auth/me"),

  // PATCH /api/auth/change-password
  changePassword: (currentPassword, newPassword) =>
    api.patch("/auth/change-password", { currentPassword, newPassword }),
};

export default authApi;
