import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AuthOrder.css"; // Single CSS file for all pages

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalItems: 0,
    totalRevenue: 0,
  });

  // Check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const fetchStats = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok || response.status === 200) {
          setStats(data);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-gradient overflow-hidden">
      {/* Top navigation */}
      <nav className="flex justify-center space-x-6 p-4 z-10 relative">
        <Link to="/dashboard" className="text-neon-purple font-bold hover:underline">
          Dashboard
        </Link>
        <Link to="/orderform" className="text-neon-purple font-bold hover:underline">
          Order Form
        </Link>
        <Link to="/signup" className="text-neon-purple font-bold hover:underline">
          Sign Up
        </Link>
        <Link to="/login" className="text-neon-purple font-bold hover:underline">
          Login
        </Link>
      </nav>

      {/* Glass card */}
      <div className="flex justify-center items-start p-8">
        <div className="order-glass-card w-full max-w-6xl">
          <h2 className="text-4xl font-bold mb-6 text-center text-neon-purple">Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card p-4 bg-white/10 rounded-lg text-center">
              <h3 className="font-semibold text-lg mb-2">Total Orders</h3>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="stat-card p-4 bg-white/10 rounded-lg text-center">
              <h3 className="font-semibold text-lg mb-2">Total Customers</h3>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
            <div className="stat-card p-4 bg-white/10 rounded-lg text-center">
              <h3 className="font-semibold text-lg mb-2">Total Items</h3>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
            <div className="stat-card p-4 bg-white/10 rounded-lg text-center">
              <h3 className="font-semibold text-lg mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold">RM {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
