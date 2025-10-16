import React from "react";

export default function UserAvatar({ name, size = 64, onClick }) {  // ✅ include onClick
  if (!name) return null;

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getColorFromName = (name) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      onClick={onClick}  // ✅ now properly defined
      className={`rounded-full text-white flex items-center justify-center font-semibold shadow cursor-pointer ${getColorFromName(
        name
      )}`}
      style={{ width: size, height: size, fontSize: size / 2 }}
    >
      {getInitials(name)}
    </div>
  );
}
