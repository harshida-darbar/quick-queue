// quick-queue/frontend/app/utils/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const storage = JSON.parse(localStorage.getItem("quick-queue"));
  const token = storage?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
