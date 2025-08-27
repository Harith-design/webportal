import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // Laravel backend
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token to every request if exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- AUTH ----------
export const register = (data) => API.post("/register", data);
export const login = (data) => API.post("/login", data);
export const logout = () => API.post("/logout");
export const getCurrentUser = () => API.get("/user"); // ✅ matches Laravel route

// ---------- USERS (⚠️ check if you really have these routes in Laravel) ----------
export const getUsers = () => API.get("/users");
export const createUser = (data) => API.post("/users", data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// ---------- SAP / Business Partners ----------
export const getBusinessPartners = () => API.get("/sap/business-partners");
export const createBusinessPartner = (data) =>
  API.post("/sap/business-partners", data);
export const updateBusinessPartner = (cardCode, data) =>
  API.put(`/sap/business-partners/${cardCode}`, data);
export const deleteBusinessPartner = (cardCode) =>
  API.delete(`/sap/business-partners/${cardCode}`);

export default API;
