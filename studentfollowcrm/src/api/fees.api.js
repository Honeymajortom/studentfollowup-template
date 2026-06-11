// src/api/fees.api.js
import api from "./axios";

const feesApi = {
  // GET /api/fees?status=&course_id=&page=&limit=
  list: (params = {}) =>
    api.get("/fees", { params }),

  // GET /api/fees/dashboard
  dashboard: () =>
    api.get("/fees/dashboard"),

  // POST /api/fees/payment
  addPayment: (data) =>
    api.post("/fees/payment", data),

  // POST /api/fees/bulk-payment
  bulkPayment: (data) =>
    api.post("/fees/bulk-payment", data),

  // GET /api/fees/export?format=csv|pdf&...filters
  export: (params = {}) =>
    api.get("/fees/export", { params, responseType: "blob" }),

  // GET /api/fees/payment/:id/receipt  (returns PDF blob)
  downloadReceipt: (paymentId) =>
    api.get(`/fees/payment/${paymentId}/receipt`, { responseType: "blob" }),

  // GET /api/fees/student/:studentId/payments
  studentPayments: (studentId) =>
    api.get(`/fees/student/${studentId}/payments`),
};

export default feesApi;
