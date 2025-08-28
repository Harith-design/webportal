import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/Signup";
import Login from "./components/Login";
import DashboardPage from "./components/DashboardPage";
import CustomerList from "./components/CustomerList";
import DashboardLayout from "./components/DashboardLayout";
import OrdersPage from "./components/Orders";
import PlaceOrderPage from "./components/OrderForm";
import InvoicesPage from "./components/Invoices";
import OrderDetails from "./components/OrderDetails"; 
import InvoiceDetails from "./components/InvoiceDetails"; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard routes with layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboardpage" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orderform" element={<PlaceOrderPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/customers" element={<CustomerList />} />
        </Route>

        {/* Default route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
