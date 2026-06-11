// src/api/followups.api.js
import api from "./axios";

const followupsApi = {
  // GET /api/followups?date=&status=&assigned_to=&page=&limit=
  list: (params = {}) =>
    api.get("/followups", { params }),

  // GET /api/followups/today-summary
  todaySummary: () =>
    api.get("/followups/today-summary"),

  // GET /api/followups/notifications
  notifications: () =>
    api.get("/followups/notifications"),

  // POST /api/followups
  create: (data) =>
    api.post("/followups", data),

  // PATCH /api/followups/:id/complete
  complete: (id, data) =>
    api.patch(`/followups/${id}/complete`, data),

  // DELETE /api/followups/:id
  remove: (id) =>
    api.delete(`/followups/${id}`),
};

export default followupsApi;
