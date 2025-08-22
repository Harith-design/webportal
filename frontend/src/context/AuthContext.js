import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Set base URL for Laravel API
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api", // 🔹 change if your Laravel runs elsewhere
  });

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/user");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const signup = async (username, password) => {
    try {
      const res = await api.post("/register", {
        name: username,
        email: `${username}@mail.com`, // adjust depending on backend
        password,
        password_confirmation: password,
      });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await api.post("/login", {
        email: `${username}@mail.com`, // adjust based on backend
        password,
      });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      return true;
    } catch (err) {
      console.error(err.response?.data || err.message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
