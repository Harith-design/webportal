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
 */
export const createUser = (data) => API.post("/users", data);

/**
 * Update user.
 *
 * Backend allows only POST on /users/{id}, so we *always* use POST.
 * - If a File/Blob (profile_picture) is present -> multipart/form-data.
 * - Otherwise -> JSON POST.
 */
export const updateUser = async (id, data) => {
  if (!id) {
    console.error("updateUser called without id", { data });
    throw new Error("Missing user id in updateUser");
  }

  const hasFile =
    data &&
    Object.entries(data).some(
      ([key, value]) =>
        key === "profile_picture" &&
        (value instanceof File || value instanceof Blob)
    );

  if (hasFile) {
    const formData = new FormData();

    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;

      if (key === "profile_picture") {
        if (value instanceof File || value instanceof Blob) {
          formData.append("profile_picture", value);
        }
        return;
      }

      formData.append(key, value);
    });

    return await API.post(`/users/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // No file → simple JSON
  return await API.post(`/users/${id}`, data);
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
