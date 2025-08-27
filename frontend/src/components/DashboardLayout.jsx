import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/api"; // ✅ use helper

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 🔹 Check token on mount + fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      getCurrentUser()
        .then((res) => {
          setUser(res.data); // ✅ res.data = { id, name, email, role? }
        })
        .catch((err) => {
          console.error("Error fetching user:", err);
          localStorage.removeItem("token");
          navigate("/login"); // force re-login if expired
        });
    }
  }, [navigate]);

  const pageTitles = {
    "/dashboardpage": "Dashboard",
    "/orders": "Orders",
    "/orderform": "Place an Order",
    "/dashboard2": "Invoices",
    "/settings": "Settings",
  };

  const title = pageTitles[location.pathname] || "Page";

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
    <div className="min-h-screen w-screen flex">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen flex-1">
        <header className="flex justify-between items-center px-6 py-3">
          <h1 className="text-2xl font-semibold">{title}</h1>

          {user && (
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold ${getColorFromName(
                  user.name
                )}`}
              >
                {getInitials(user.name)}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.role || "User"} {/* ✅ fallback if no role */}
                </p>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
