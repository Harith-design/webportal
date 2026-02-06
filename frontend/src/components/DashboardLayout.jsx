import React, {useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import { Outlet, useLocation, useParams, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { isTokenValid} from "../helpers/auth";
import { performLogout } from "../helpers/logout";
import { useLoading } from "../context/LoadingContext";
import { Menu } from "lucide-react";


function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  // Optional: fake user for demo; remove if you don't need a user dropdown
  // const user = { name: "Guest User", role: "Visitor" };

  // Logout
    
    const handleLogout = async () => {
      await performLogout(setLoading, navigate);
    };

  useEffect(() => {
      if (!isTokenValid()) {
        handleLogout();
        return;
      }
  
      // Auto logout timer
      const expiry =
        parseInt(localStorage.getItem("token_expiry")) ||
        parseInt(sessionStorage.getItem("token_expiry"));
      const now = new Date().getTime();

      const timeout = setTimeout(() => {
        handleLogout();
      }, expiry - now);
  
      // Fetch current user
      getCurrentUser()
        .then((res) => setUser(res.data))
        .catch((err) => {
          console.error("Error fetching user:", err);
          handleLogout();
        });
  
      return () => clearTimeout(timeout);
    }, [navigate]);

  // Close dropdown when clicking outside
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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

  // Page titles
  const pageTitles = {
    "/dashboardpage": "Dashboard",
    "/orders": "Order History",
    "/orders_admin": "Orders",
    "/orders/:id": "Order #{id}",
    "/orderform": "Place an Order",
    "/invoices": "Invoices",
    "/invoices/:id": "Invoice #{id}",
    "/settings": "Settings",
    "/customers": "Customers",
    "/editprofile": "Edit Profile",
    "/users": "Users",
    "/edituser/:id": "Edit User",
    "/products": "Products",
    "/products/:id": "Product Details"
  };

  const getPageTitle = (pathname, idParam) => {
    if (pageTitles[pathname]) return pageTitles[pathname];
    for (const pattern in pageTitles) {
      if (pattern.includes(":id")) {
        const base = pattern.replace("/:id", "");
        if (pathname.startsWith(base + "/") && idParam) {
          return pageTitles[pattern].replace("{id}", idParam);
        }
      }
    }
    return "Page";
  };

    // Helpers for initials avatar
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getColorFromName = (name = "") => {
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

  // Build avatar URL from backend-stored path
  const backendOrigin = "http://127.0.0.1:8000";
  const buildAvatarUrl = (p) => {
    if (!p) return null;
    const full = /^https?:\/\//.test(p)
      ? p
      : `${backendOrigin.replace(/\/$/, "")}/${String(p).replace(/^\//, "")}`;
    return `${full}?t=${user?.updated_at || Date.now()}`; // cache-buster
  };

  const avatarUrl = buildAvatarUrl(user?.profile_picture);
  const showImage = !!avatarUrl && !imgError;

  const title = getPageTitle(location.pathname, id);
  const { setLoading } = useLoading(); // 👈 get loading context
  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (
    <div className="min-h-screen flex w-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} className="fixed top-0 left-0 h-full w-20 z-10"/>

      {/* Main content */}
      <div className="flex flex-col flex-1 transition-all duration-300 overflow-y-auto">
        <header className="sticky top-0 flex items-center py-2 bg-white border-b flex-shrink-0 z-50 ">
        <button
          className="sm:hidden ml-4 rounded-md border border-black bg-black p-1"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="text-white" size={20} strokeWidth={2}/>
        </button>
          
        {/* Replace src with your logo path */}
        <img
          src="/logo-giib-cat-2.png"
          alt="Logo"
          className="h-10 w-16 sm:w-20 object-contain"
        />
        <div className="flex flex-row flex-1 justify-between items-center">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-semibold truncate sm:ml-8 ml-0"
          >
            {title}
          </h1>

          {/* User dropdown (optional) */}
          {user && (
            <div className="relative sm:mr-8 mr-4" ref={dropdownRef}>
              <div className="flex items-center space-x-3">
                {/* Avatar (image if available, otherwise initials) */}
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="relative rounded-full overflow-hidden border"
                  style={{ width: 45, height: 45 }}
                  aria-label="User menu"
                >
                  {showImage && (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  )}

                  {/* Fallback when there's no picture OR image fails */}
                  {(!avatarUrl || imgError) && (
                    <div
                      className={`w-full h-full ${getColorFromName(
                        user.name || ""
                      )} text-white flex items-center justify-center font-semibold`}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                </button>

                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role || "User"}</p>
                </div>
              </div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border py-2 z-50">
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
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </header>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main
          className="flex-1 px-0 pt-0 bg-gray-100 ml-0 sm:ml-20"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
