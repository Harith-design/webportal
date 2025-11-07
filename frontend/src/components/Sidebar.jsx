import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  LogOut,
  UserRoundCog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./Sidebar.css";
import { useLoading } from "../context/LoadingContext";
import { clearToken } from "../helpers/auth";
import { performLogout } from "../helpers/logout";

function Sidebar({ onToggle }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showText, setShowText] = useState(true); // 👈 controls text timing
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const toggleSidebar = () => {
    if (isCollapsed) {
      // Opening sidebar → wait a bit before showing text
      setIsCollapsed(false);
      onToggle(false);
      setTimeout(() => setShowText(true), 250); // delay text
    } else {
      // Closing sidebar → hide text first
      setShowText(false);
      setTimeout(() => {
        setIsCollapsed(true);
        onToggle(true);
      }, 150); // slightly faster close
    }
  };

  const handleLogout = () => performLogout(setLoading, navigate);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 p-2 h-10 rounded-lg text-sm transition-all duration-300 ${
      isActive
        ? "bg-[#ffeff2] text-[#ff2268]"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white h-screen shadow-lg p-4 fixed left-0 top-0 flex flex-col justify-between transition-all duration-300`}
    >
      <div>
        {/* Header */}
      <div className="flex items-center mb-6 h-10">
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-[#ff2268] transition`}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {!isCollapsed && showText && (
          <h1 className="ml-2 text-xl font-bold whitespace-nowrap transition-all duration-300">
            My Portal
          </h1>
        )}
      </div>


        {/* Nav Links */}
        <nav
          className={`space-y-3 transition-opacity duration-300 ${
            showText || isCollapsed ? "opacity-100" : "opacity-0"
          }`}
        >
          <SidebarLink
            to="/dashboardpage"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            showText={showText && !isCollapsed}
            linkClass={linkClass}
          />
          <SidebarLink
            to="/orders"
            icon={<Package size={18} />}
            label="Orders"
            showText={showText && !isCollapsed}
            linkClass={linkClass}
          />
          <SidebarLink
            to="/invoices"
            icon={<FileText size={18} />}
            label="Invoices"
            showText={showText && !isCollapsed}
            linkClass={linkClass}
          />
          <SidebarLink
            to="/orderform"
            icon={<ShoppingCart size={18} />}
            label="Place an Order"
            showText={showText && !isCollapsed}
            linkClass={linkClass}
          />
          <SidebarLink
            to="/users"
            icon={<UserRoundCog size={18} />}
            label="Manage Users"
            showText={showText && !isCollapsed}
            linkClass={linkClass}
          />
        </nav>
      </div>

      {/* Footer (Logout) */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 p-2 rounded-lg text-sm w-full text-left text-gray-700 hover:bg-gray-100"
      >
        <LogOut size={18} />
        {showText && !isCollapsed && <span>Sign Out</span>}
      </button>
    </aside>
  );
}

function SidebarLink({ to, icon, label, showText, linkClass }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${linkClass({ isActive })} px-2`}
    >
      <div className="flex items-center justify-center w-6 h-6">{icon}</div>
      {showText && (
        <span className="whitespace-nowrap text-sm leading-none transition-opacity duration-300">
          {label}
        </span>
      )}
    </NavLink>
  );
}

export default Sidebar;
