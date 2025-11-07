// src/helpers/logout.js
import { clearToken } from "./auth";

export const performLogout = async (setLoading, navigate) => {
  if (setLoading) setLoading(true);
  try {
    clearToken();
    await new Promise((resolve) => setTimeout(resolve, 800)); // same delay as sidebar
    navigate("/login");
  } finally {
    if (setLoading) setLoading(false);
  }
};
