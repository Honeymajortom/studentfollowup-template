// src/api/leads.api.js
import api from "./axios";

const leadsApi = {
  // GET /api/leads?search=&status=&course_interest_id=&assigned_to=&page=&limit=
  list: (params = {}) =>
    api.get("/leads", { params }),

  // GET /api/leads/:id
  getOne: (id) =>
    api.get(`/leads/${id}`),

  // POST /api/leads
  create: (data) =>
    api.post("/leads", data),

  // PATCH /api/leads/:id
  update: (id, data) =>
    api.patch(`/leads/${id}`, data),

  // DELETE /api/leads/:id
  remove: (id) =>
    api.delete(`/leads/${id}`),

  // POST /api/leads/:id/convert  — Lead → Student
  convert: (id, data = {}) =>
    api.post(`/leads/${id}/convert`, data),

  // GET /api/leads/:id/timeline
  timeline: (id) =>
    api.get(`/leads/${id}/timeline`),
};

export default leadsApi;