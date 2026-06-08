// src/api/reports.api.js
import api from "./axios";

const reportsApi = {
  // GET /api/reports/dashboard?from=&to=
  dashboard:         (params = {}) => api.get("/reports/dashboard",          { params }),
  admissions:        (params = {}) => api.get("/reports/admissions",         { params }),
  fees:              (params = {}) => api.get("/reports/fees",               { params }),
  leadSources:       (params = {}) => api.get("/reports/lead-sources",       { params }),
  staffPerformance:  (params = {}) => api.get("/reports/staff-performance",  { params }),
  coursePerformance: (params = {}) => api.get("/reports/course-performance", { params }),
  attendanceSummary: (params = {}) => api.get("/reports/attendance-summary", { params }),
};

export default reportsApi;
