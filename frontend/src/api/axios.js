import axios from "axios";

const API = axios.create({
  baseURL: "/api",   // uses proxy
  withCredentials: true,
  timeout: 5000,     // prevents long loading
});

// 🔐 Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ❗ Handle auth errors globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Token expired / invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default API;