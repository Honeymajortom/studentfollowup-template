// src/api/attendance.api.js
import api from "./axios";

const attendanceApi = {
  // GET /api/attendance?course_id=&date=
  getByDate: (course_id, date) =>
    api.get("/attendance", { params: { course_id, date } }),

  // POST /api/attendance  (bulk mark)
  markBulk: (data) =>
    api.post("/attendance", data),

  // GET /api/attendance/student/:id/summary?course_id=&month=
  studentSummary: (studentId, params = {}) =>
    api.get(`/attendance/student/${studentId}/summary`, { params }),
};

export default attendanceApi;
