// src/api/courses.api.js
import api from "./axios";

const coursesApi = {
  list:   ()         => api.get("/courses"),
  getOne: (id)       => api.get(`/courses/${id}`),
  create: (data)     => api.post("/courses", data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  remove: (id)       => api.delete(`/courses/${id}`),
};

export default coursesApi;
