// src/api/students.api.js
import api from "./axios";

const studentsApi = {
  // GET /api/students?search=&status=&course_id=&fees_status=&page=&limit=
  list: (params = {}) =>
    api.get("/students", { params }),

  // GET /api/students/:id
  getOne: (id) =>
    api.get(`/students/${id}`),

  // POST /api/students
  create: (data) =>
    api.post("/students", data),

  // PATCH /api/students/:id
  update: (id, data) =>
    api.patch(`/students/${id}`, data),

  // DELETE /api/students/:id
  remove: (id) =>
    api.delete(`/students/${id}`),

  // PATCH /api/students/bulk-assign
  bulkAssign: (data) =>
    api.patch("/students/bulk-assign", data),

  // GET /api/students/export?format=csv|pdf&...filters
  export: (params = {}) =>
    api.get("/students/export", { params, responseType: "blob" }),

  // Sub-resources
  getFollowups:  (id) => api.get(`/students/${id}/followups`),
  getPayments:   (id) => api.get(`/students/${id}/payments`),
  getAttendance: (id) => api.get(`/students/${id}/attendance`),
  getWaLogs:     (id) => api.get(`/students/${id}/wa-logs`),
};

export default studentsApi;
