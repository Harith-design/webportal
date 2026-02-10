import React, { useEffect,useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Blocks,
  Package,
  FileText,
  ShoppingCart,
  LogOut,
  UserRoundCog,
  Store,
  PackageSearch
} from "lucide-react";
import { useLoading } from "../context/LoadingContext";
import { performLogout } from "../helpers/logout";
import { useCart } from "../context/CartContext";

function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const { setLoading } = useLoading();
  const { cart } = useCart();
  const totalItems = cart.length;

  // Read role directly from storage (instant, no waiting)
  const [role] = useState(() => {
    const stored =
      localStorage.getItem("user_role") ||
      sessionStorage.getItem("user_role");
    return stored ? stored.toLowerCase() : null;
  });

  // clear saved role on logout
  const handleLogout = () => {
    localStorage.removeItem("user_role");
    sessionStorage.removeItem("user_role");
    performLogout(setLoading, navigate);
  };

  // State to trigger add to cart animation
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300); // animation duration
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r
        flex flex-col justify-between py-4 px-10 sm:p-4 z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:w-20`}   
    >

      <nav className="space-y-6">
        {/* Logo */}
        <div className="flex sm:justify-center mt-12 sm:mt-12">
      </div>
        <SidebarLink to="/dashboardpage" icon={<Blocks size={32} />} label="Dashboard"/>
        <SidebarLink to="/orders" icon={<Package size={32} />} label="Orders"/>
        <SidebarLink to="/invoices" icon={<FileText size={32} />} label="Invoices"/>
        <SidebarLink to="/products" icon={<Store size={32} />} label="Products"/>
        <SidebarLink 
          to="/orderform" 
          label="Place an Order"
          icon={
          <div className="relative w-full flex justify-center">
            <ShoppingCart size={32} />
            {totalItems > 0 && (
              <span
                className={`
                  absolute -top-0 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center
                  transform transition-transform duration-300
                  ${animate ? "scale-125" : "scale-100"}
                `}
              >
                {totalItems}
              </span>
            )}
          </div>} 
        />
        
        
        {/* 🔒 Admin-only link */}

        {role === "admin" && (
          <SidebarLink
            to="/uploadproducts"
            icon={<PackageSearch size={32} />}
            label="Upload Products"
          />
        )}
        
        {role === "admin" && (
          <SidebarLink
            to="/users"
            icon={<UserRoundCog size={32} />}
            label="Manage Users"
          />
        )}
        
      </nav>

      <div className="relative group flex sm:justify-center ">
  <button
    onClick={handleLogout}
    className="flex items-center justify-center p-3 sm:h-12 sm:w-12 rounded-lg hover:bg-gray-100 text-gray-700"
  >
    <LogOut size={26} />
  </button>

  {/* Tooltip */}
  <div
    className="
      hidden sm:block
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
    <div className="relative group flex sm:justify-center">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 sm:gap-0 p-3 rounded-lg sm:h-12 sm:w-12 w-full rounded-lg transition-all duration-300 ${
            isActive
              ? "bg-black text-gray-100"
              : "text-gray-700 hover:bg-gray-100"
          }`
        }
      >
        {icon}
        {/* Mobile label */}
        <span className="sm:hidden text-lg ml-4">{label}</span>
      </NavLink>

      {/* Tooltip */}
      <div
        className="
          hidden sm:block
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
