// src/components/DashboardLayout.jsx
import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { isTokenValid, clearToken } from "../helpers/auth";
import UserAvatar from "./UserAvatar";

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams(); // ✅ grab dynamic params (like :id)
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // ✅ reference for dropdown wrapper

  // 🔹 Logout helper
  const handleLogout = () => {
    clearToken();
    // navigate("/login");
  };

  useEffect(() => {
    if (!isTokenValid()) {
      handleLogout();
      return;
    }

    // 🔹 Set auto-logout timer
    const expiry =
      parseInt(localStorage.getItem("token_expiry")) ||
      parseInt(sessionStorage.getItem("token_expiry"));
    const now = new Date().getTime();
    const timeout = setTimeout(() => {
      handleLogout();
    }, expiry - now);

    // 🔹 Fetch user profile
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Error fetching user:", err);
        handleLogout();
      });

    // 🔹 Cleanup timeout on unmount
    return () => clearTimeout(timeout);
  }, [navigate]);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // 🔹 Page title patterns
  const pageTitles = {
    "/dashboardpage": "Dashboard",
    "/orders": "Orders",
    "/orders/:id": "Order #{id}",     // ✅ dynamic pattern
    "/orderform": "Place an Order",
    "/invoices": "Invoices",
    "/invoices/:id": "Invoice #{id}", // ✅ dynamic pattern
    "/settings": "Settings",
    "/customers": "Customers",
    "/editprofile": "Edit Profile",
    "/users": "Users",
    "/edituser/:id": "Edit User"
  };

  const getPageTitle = (pathname, id) => {
    // Exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    // Match patterns like /orders/:id
    for (const pattern in pageTitles) {
      if (pattern.includes(":id")) {
        const base = pattern.replace("/:id", "");
        if (pathname.startsWith(base + "/") && id) {
          return pageTitles[pattern].replace("{id}", id);
        }
      }
    }

    return "Page";
  };

  const title = getPageTitle(location.pathname, id);

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
    <div className="min-h-screen flex w-screen">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen flex-1">
        <header className="flex justify-between items-center px-6 py-3">
          <h1 className="text-2xl font-semibold">{title}</h1>

          {user && (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-3">
              <UserAvatar name={user.name} size={40}
                onClick={() => setDropdownOpen((prev) => !prev)}/>
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role || "User"}</p>
              </div>
            </div>

          {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                  <p className="px-4 py-2 text-sm text-gray-700 font-medium">
                    {user.name}
                  </p>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      navigate("/editprofile");
                      setDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Profile
                  </button>
                  {/* <button
                    onClick={() => navigate("/settings")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </button> */}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
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
