import React from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const linkClasses = (path) =>
    `px-4 py-2 rounded font-semibold transition ${
      location.pathname === path
        ? "bg-gold text-black"
        : "text-white hover:bg-yellow-500 hover:text-black"
    }`;

  return (
    <nav className="bg-black bg-opacity-80 backdrop-blur-md p-4 flex space-x-4">
      <Link to="/dashboard" className={linkClasses("/dashboard")}>
        Dashboard
      </Link>
      <Link to="/orderform" className={linkClasses("/orderform")}>
        Order Form
      </Link>
      <Link to="/customers" className={linkClasses("/customers")}>
        Customers
      </Link>
      <Link to="/signup" className={linkClasses("/signup")}>
        Sign Up
      </Link>
      <Link to="/login" className={linkClasses("/login")}>
        Login
      </Link>
    </nav>
  );
}

export default Navbar;
