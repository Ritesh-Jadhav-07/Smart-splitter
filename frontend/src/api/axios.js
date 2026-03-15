import axios from "axios";

const API = axios.create({
  baseURL: "/api", // proxy will forward this to backend
  withCredentials: true, // send cookies if needed
});

export default API;