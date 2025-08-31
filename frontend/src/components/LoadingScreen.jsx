// src/components/LoadingScreen.jsx
import React from "react";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      {/* Jumping GIIB logo */}
      <img
        src="/giib-logo.png"
        alt="GIIB Logo"
        className="w-16 h-16 animate-bounce mb-4"
      />

      {/* Loading dots */}
      <div className="flex space-x-2">
        <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
      </div>
    </div>
  );
}

export default LoadingScreen;
