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

  return (
    <div className="min-h-screen w-screen flex">
  <Sidebar />
  <div className="ml-64 flex flex-col min-h-screen flex-1">
    <div className="px-6 pt-6 pb-0">
      <h1 className="text-2xl font-semibold">{title}</h1>
    </div>
    <main className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
      <Outlet />
    </main>
  </div>
</div>

  );
}

export default DashboardLayout;
