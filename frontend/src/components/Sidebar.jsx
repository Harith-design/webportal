import React from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  LogOut,
  UserRoundCog
} from "lucide-react";
import "./Sidebar.css";
import { useLoading } from "../context/LoadingContext";
import { clearToken } from "../helpers/auth";

function Sidebar() {
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const handleLogout = async () => {
    setLoading(true);

    try {
      // Clear tokens
      clearToken();

      // Optional: simulate API call delay (e.g., revoke session)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Redirect to login
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-white h-screen shadow-lg p-4 fixed left-0 top-0">
      <h1 className="text-xl font-bold mb-6">My Portal</h1>
      <nav className="space-y-3">
        <Link to="/dashboardpage" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <LayoutDashboard size={16} /> <span>Dashboard</span>
        </Link>
        <Link to="/orders" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <Package size={16} /> <span>Orders</span>
        </Link>
        {/* <Link to="/customers" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <Truck size={16} /> <span>Deliveries</span>
        </Link> */}
        <Link to="/invoices" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <FileText size={16} /> <span>Invoices</span>
        </Link>
        <Link to="/orderform" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <ShoppingCart size={16} /> <span>Place an Order</span>
        </Link>
        <Link to="/users" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <UserRoundCog size={16} /> <span>Manage Users</span>
        </Link>
        {/* <Link to="/settings" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <Settings size={16} /> <span>Settings</span>
        </Link> */}
        {/* 🔽 Logout is now a button instead of Link */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm w-full text-left"
        >
          <LogOut size={16} /> <span>Sign Out</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
