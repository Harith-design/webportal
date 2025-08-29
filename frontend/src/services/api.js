import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.100.164:8000/api", // 👈 use Harith's backend server IP
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token from localStorage OR sessionStorage
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // ✅ correct template string
  }
  return config;
});

// ---------- AUTH ----------
export const register = (data) => API.post("/register", data);
export const login = (data) => API.post("/login", data);
export const logout = () => API.post("/logout");
export const getCurrentUser = () => API.get("/user"); // ✅ matches Laravel route

// ---------- USERS ----------
export const getUsers = () => API.get("/users");
export const createUser = (data) => API.post("/users", data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data); // ✅ fixed
export const deleteUser = (id) => API.delete(`/users/${id}`); // ✅ fixed

// ---------- SAP / Business Partners ----------
export const getBusinessPartners = () => API.get("/sap/business-partners");
export const createBusinessPartner = (data) =>
  API.post("/sap/business-partners", data);
export const updateBusinessPartner = (cardCode, data) =>
  API.put(`/sap/business-partners/${cardCode}`, data); // ✅ fixed
export const deleteBusinessPartner = (cardCode) =>
  API.delete(`/sap/business-partners/${cardCode}`); // ✅ fixed

export default API;
