import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingContext";

// Public pages
import SignUp from "./components/Signup";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import CreateNewPassword from "./components/CreateNewPassword";

// Protected pages
import DashboardPage from "./components/DashboardPage";
import OrdersPage from "./components/Orders";
import PlaceOrderPage from "./components/OrderForm";
import CustomerList from "./components/CustomerList";
import InvoicesPage from "./components/Invoices"; // ✅ added
import OrderDetails from "./components/OrderDetails"; // ✅ added
import InvoiceDetails from "./components/InvoiceDetails";

// Layout & helpers
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <LoadingProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/createpassword" element={<CreateNewPassword />} />

          {/* Protected Dashboard routes */}
          <Route
            element={
              
                <DashboardLayout />
              
            }
          >
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
      </LoadingProvider>
    </Router>
  );
}

export default App;
