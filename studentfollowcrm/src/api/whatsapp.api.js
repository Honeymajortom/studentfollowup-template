// src/api/whatsapp.api.js
import api from "./axios";

const whatsappApi = {
  // POST /api/whatsapp/send
  send: (data) =>
    api.post("/whatsapp/send", data),

  // GET /api/whatsapp/templates
  listTemplates: () =>
    api.get("/whatsapp/templates"),

  // GET /api/whatsapp/logs?student_id=&status=&page=&limit=
  getLogs: (params = {}) =>
    api.get("/whatsapp/logs", { params }),

  // GET /api/whatsapp/stats
  stats: () =>
    api.get("/whatsapp/stats"),

  // POST /api/whatsapp/templates
  createTemplate: (data) =>
    api.post("/whatsapp/templates", data),

  // PATCH /api/whatsapp/templates/:id
  updateTemplate: (id, data) =>
    api.patch(`/whatsapp/templates/${id}`, data),

  // DELETE /api/whatsapp/templates/:id
  deleteTemplate: (id) =>
    api.delete(`/whatsapp/templates/${id}`),
};

export default whatsappApi;
