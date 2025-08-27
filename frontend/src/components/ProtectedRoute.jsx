// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid, clearToken } from "../helpers/auth";

const ProtectedRoute = ({ children }) => {
  if (!isTokenValid()) {
    clearToken(); // remove invalid/expired token
    return <Navigate to="/login" replace />; // redirect to login
  }

  return children;
};

export default ProtectedRoute;
