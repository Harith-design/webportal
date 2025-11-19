import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Blocks,
  Package,
  FileText,
  ShoppingCart,
  LogOut,
  UserRoundCog,
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import { performLogout } from "../helpers/logout";

function Sidebar() {
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const handleLogout = () => performLogout(setLoading, navigate);

  return (
    <aside
      className="
        fixed top-0 left-0 h-screen w-16 sm:w-20 bg-white border-r
        flex flex-col justify-between p-4 z-50
      "
    >

      
      

      <nav className="space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
        {/* Replace src with your logo path */}
        <img
          src="/logo-giib-cat-2.png"
          alt="Logo"
          className="h-14 w-14 object-contain"
        />
      </div>
        <SidebarLink to="/dashboardpage" icon={<Blocks size={32} />} label="Dashboard"/>
        <SidebarLink to="/orders" icon={<Package size={32} />} label="Orders"/>
        <SidebarLink to="/invoices" icon={<FileText size={32} />} label="Invoices"/>
        <SidebarLink to="/orderform" icon={<ShoppingCart size={32} />} label="Place an Order"/>
        <SidebarLink to="/users" icon={<UserRoundCog size={32} />} label="Manage Users"/>
      </nav>

      <div className="relative group flex justify-center">
  <button
    onClick={handleLogout}
    className="flex items-center justify-center p-3 h-12 w-12 rounded-lg hover:bg-gray-100 text-gray-700"
  >
    <LogOut size={26} />
  </button>

  {/* Tooltip */}
  <div
    className="
      absolute left-14 top-1/2 -translate-y-1/2
      px-2 py-2 rounded-md text-xs text-white bg-gray-900 shadow-lg
      opacity-0 group-hover:opacity-100 pointer-events-none
      whitespace-nowrap transition-opacity duration-200 z-50
    "
  >
    Sign Out
  </div>
</div>
    </aside>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <div className="relative group flex justify-center">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center justify-center p-3 h-12 w-12 rounded-lg transition-all duration-300 ${
            isActive
              ? "bg-black text-gray-100"
              : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        {icon}
      </NavLink>

      {/* Tooltip */}
      <div
        className="
          absolute left-14 top-1/2 -translate-y-1/2
          px-2 py-2 rounded-md text-xs text-white bg-gray-900 shadow-lg
          opacity-0 group-hover:opacity-100 pointer-events-none
          whitespace-nowrap transition-opacity duration-200 z-50
        "
      >
        {label}
      </div>
    </div>
  );
}



export default Sidebar;
