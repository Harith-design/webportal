import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
      clearToken();
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
      isActive ? "bg-[#ffeff2] text-[#ff2268]" : "text-gray-700"
    }`;

  return (
    <aside className="w-64 bg-white h-screen shadow-lg p-4 fixed left-0 top-0">
      <h1 className="text-xl font-bold mb-6">My Portal</h1>
      <nav className="space-y-3">
        <NavLink to="/dashboardpage" className={linkClass}>
          <LayoutDashboard size={16} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/orders" className={linkClass}>
          <Package size={16} /> <span>Orders</span>
        </NavLink>
        <NavLink to="/invoices" className={linkClass}>
          <FileText size={16} /> <span>Invoices</span>
        </NavLink>
        <NavLink to="/orderform" className={linkClass}>
          <ShoppingCart size={16} /> <span>Place an Order</span>
        </NavLink>
        <NavLink to="/users" className={linkClass}>
          <UserRoundCog size={16} /> <span>Manage Users</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 rounded-lg text-sm w-full text-left text-gray-700"
        >
          <LogOut size={16} /> <span>Sign Out</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
