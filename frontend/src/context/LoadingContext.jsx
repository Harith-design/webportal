// src/context/LoadingContext.jsx
import React, { createContext, useState, useContext } from "react";
import LoadingScreen from "../components/LoadingScreen";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {loading && <LoadingScreen />}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
