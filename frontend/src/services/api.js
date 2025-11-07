import axios from "axios";

// 👇 Directly point to your Laravel backend
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // backend API URL
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
export const getCurrentUser = () => API.get("/user/me");

// ---------- USERS ----------
export const getUsers = () => API.get("/users");
export const createUser = (data) => API.post("/users", data);

// ✅ UPDATED: no manual Content-Type, Axios handles multipart automatically
export const updateUser = async (id, data) => {
  const formData = new FormData();

  for (const key in data) {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  }

  return await API.post(`/users/${id}`, formData);
};

export const deleteUser = (id) => API.delete(`/users/${id}`);

// ---------- SAP / Business Partners ----------
export const getBusinessPartners = async (search = "") => {
  try {
    const res = await API.get("/sap/business-partners", {
      params: { search },
    });
    return res.data;
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
    return res.data;
  } catch (err) {
    console.error("Error fetching items:", err);
    throw err;
  }
};

export default API;
