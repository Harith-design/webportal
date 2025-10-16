import axios from "axios";

// 👇 Directly point to your Laravel backend
const API = axios.create({
  baseURL: "http://192.168.100.189:8000/api", // 👈 backend IP
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token from localStorage OR sessionStorage
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- AUTH ----------
export const register = (data) => API.post("/register", data);
export const login = (data) => API.post("/login", data);
export const logout = () => API.post("/logout");
export const getCurrentUser = () => API.get("/user/me"); // ✅ FIXED

// ---------- USERS ----------
export const getUsers = () => API.get("/users");
export const createUser = (data) => API.post("/users", data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// ---------- SAP / Business Partners ----------
export const getBusinessPartners = async (search = "") => {
  try {
    const res = await API.get("/sap/business-partners", {
      params: { search },
    });
    return res.data; // ✅ Return full backend response
  } catch (err) {
    console.error("Error fetching business partners:", err);
    throw err;
  }
};

export const createBusinessPartner = (data) =>
  API.post("/sap/business-partners", data).then((res) => res.data.data);

export const updateBusinessPartner = (cardCode, data) =>
  API.put(`/sap/business-partners/${cardCode}`, data).then(
    (res) => res.data.data
  );

export const deleteBusinessPartner = (cardCode) =>
  API.delete(`/sap/business-partners/${cardCode}`).then((res) => res.data);

// ---------- SAP / Invoices ----------
export const getInvoice = (docEntry) =>
  API.get(`/sap/invoices/${docEntry}`).then((res) => res.data.data);

export const createInvoice = (data) =>
  API.post("/sap/invoices", data).then((res) => res.data.data);

// ---------- SAP / Items ----------
export const getItems = async (search = "") => {
  try {
    const res = await API.get("/sap/items", { params: { search } });
    return res.data; // ✅ Return full backend response
  } catch (err) {
    console.error("Error fetching items:", err);
    throw err;
  }
};

export default API;
