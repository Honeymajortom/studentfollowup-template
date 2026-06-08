// src/api/staff.api.js
import api from "./axios";

const staffApi = {
  list:         ()              => api.get("/staff"),
  getOne:       (id)            => api.get(`/staff/${id}`),
  create:       (data)          => api.post("/staff", data),
  update:       (id, data)      => api.patch(`/staff/${id}`, data),
  assignLeads:  (id, studentIds)=> api.post(`/staff/${id}/assign-leads`, { student_ids: studentIds }),
  performance:  (id, params={}) => api.get(`/staff/${id}/performance`, { params }),
};

export default staffApi;
