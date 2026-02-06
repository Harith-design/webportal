import React from "react";

function Loader({
  imageSrc,
  size = 40,
  dots = true,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center h-full ${className}`}>
      {/* Bouncing image/icon */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="loading"
          style={{ width: size, height: size }}
          className="animate-bounce"
        />
      )}

      {/* Optional dots */}
      {dots && (
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      )}
    </div>
  );
}

export default Loader;
