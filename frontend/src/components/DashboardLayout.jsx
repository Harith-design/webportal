import React from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";

function DashboardLayout() {
  const location = useLocation();

  const pageTitles = {
    "/dashboardpage": "Dashboard",
    "/orders": "Orders",
    "/orderform": "Place an Order",
    "/dashboard2": "Invoices",
    "/settings": "Settings",
  };

  const title = pageTitles[location.pathname] || "Page";

  const user = {
    name: "John Doe",   // Later can be pulled from auth
    role: "CUSTOMER #008177",
  };

  // ✅ Get initials from username
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // ✅ Generate a consistent color from username
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
        
        {/* 🔹 Top Navbar */}
        <header className="flex justify-between items-center px-6 py-3">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="flex items-center space-x-3">
            
            {/* Circle with initials + dynamic color */}
            <div
              className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold ${getColorFromName(
                user.name
              )}`}
            >
              {getInitials(user.name)}
            </div>

            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
