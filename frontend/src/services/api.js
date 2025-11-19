import axios from "axios";

// Point to your Laravel backend
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Attach token from localStorage OR sessionStorage
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

/**
 * Create user.
 * If you add avatars to create flow later, you can switch this to FormData as we do in updateUser.
 */
export const createUser = (data) => API.post("/users", data);

/**
 * Update user using multipart/form-data explicitly.
 * - Automatically maps a plain object into FormData
 * - Only attaches `profile_picture` when it's a real File/Blob
 */
export const updateUser = async (id, data) => {
  const formData = new FormData();

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;

    if (key === "profile_picture") {
      // Append only if it's a File/Blob
      if (value instanceof File || value instanceof Blob) {
        formData.append("profile_picture", value);
      }
      return;
    }

    formData.append(key, value);
  });

  // Force multipart so the browser doesn't default to JSON
  return await API.post(`/users/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteUser = (id) => API.delete(`/users/${id}`);

// ---------- SAP / Business Partners ----------
export const getBusinessPartners = async (search = "") => {
  const res = await API.get("/sap/business-partners", { params: { search } });
  return res.data;
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
  const res = await API.get("/sap/items", { params: { search } });
  return res.data;
};

export default API;
