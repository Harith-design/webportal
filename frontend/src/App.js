import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // Import the Navbar
import SignUp from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import OrderForm from "./components/OrderForm";
import CustomerList from "./components/CustomerList"; // Import CustomerList page

function App() {
  return (
    <Router>
      {/* Navbar will be displayed on all pages */}
      <Navbar />

      {/* Page content */}
      <div className="p-4">
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orderform" element={<OrderForm />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="*" element={<Dashboard />} /> {/* Default to dashboard */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
