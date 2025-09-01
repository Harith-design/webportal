import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  FileText,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
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
        <Link to="/customers" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <Truck size={16} /> <span>Deliveries</span>
        </Link>
        <Link to="/invoices" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <FileText size={16} /> <span>Invoices</span>
        </Link>
        <Link to="/orderform" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <ShoppingCart size={16} /> <span>Place an Order</span>
        </Link>
        <Link to="/settings" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <Settings size={16} /> <span>Settings</span>
        </Link>
        <Link to="/login" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 text-sm">
          <LogOut size={16} /> <span>Sign Out</span>
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
