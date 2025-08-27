import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // ✅ check if token exists

  if (!token) {
    return <Navigate to="/login" replace />; // 🚪 redirect if not logged in
  }

  return children;
};

export default ProtectedRoute;
