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
};

export default whatsappApi;
