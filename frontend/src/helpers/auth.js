// helpers/auth.js

// Get the token from localStorage or sessionStorage
export const getToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
};

// Get token expiry timestamp
export const getTokenExpiry = () => {
  const expiry =
    parseInt(localStorage.getItem("token_expiry")) ||
    parseInt(sessionStorage.getItem("token_expiry"));
  return expiry || null;
};

// Check if the token is still valid
export const isTokenValid = () => {
  const token = getToken();
  const expiry = getTokenExpiry();
  if (!token || !expiry) return false;

  const now = new Date().getTime();
  return now <= expiry;
};

// Remove token and expiry
export const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("token_expiry");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("token_expiry");
};
