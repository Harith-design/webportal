import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingContext";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";

// Public pages
import SignUp from "./components/Signup";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

// Protected pages
import DashboardPage from "./components/DashboardPage";
import OrdersPage from "./components/Orders";
import OrdersAdminPage from "./components/OrdersAdmin";
import CartPage from "./components/OrderForm";
import CustomerList from "./components/CustomerList";
import InvoicesPage from "./components/Invoices";
import OrderDetails from "./components/OrderDetails";
import InvoiceDetails from "./components/InvoiceDetails";
import EditProfile from "./components/EditProfile";
import UserList from "./components/UserList";
import EditUser from "./components/EditUser";
import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetails";
import UnitPriceEntry from "./components/UnitPriceEntry";

// Layout
import DashboardLayout from "./components/DashboardLayout";
import "./App.css";

// ✅ userlist-style guard for /orders (auto route to admin page if admin)
const OrdersGuard = () => {
  const storedRole =
    localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

  if (!storedRole) return <Navigate to="/login" replace />;

  if (storedRole.toLowerCase() === "admin") {
    return <Navigate to="/orders_admin" replace />;
  }

  return <OrdersPage />;
};

// ✅ admin-only guard (same style as UserList.jsx)
const AdminGuard = ({ children }) => {
  const storedRole =
    localStorage.getItem("user_role") || sessionStorage.getItem("user_role");

  if (!storedRole) return <Navigate to="/login" replace />;

  if (storedRole.toLowerCase() !== "admin") {
    alert("You are not allowed to access this page.");
    return <Navigate to="/dashboardpage" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <CartProvider>
        <LoadingProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboardpage" element={<DashboardPage />} />

              {/* ✅ /orders auto choose based on role */}
              <Route path="/orders" element={<OrdersGuard />} />

              {/* ✅ /orders_admin admin-only */}
              <Route
                path="/orders_admin"
                element={
                  <AdminGuard>
                    <OrdersAdminPage />
                  </AdminGuard>
                }
              />

              <Route path="/products" element={<ProductList />} />
              <Route path="/orderform" element={<CartPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/editprofile" element={<EditProfile />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/edituser/:id" element={<EditUser />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/pricing/:id" element={<UnitPriceEntry />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Login />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontSize: "0.9rem" },
              success: {
                style: { background: "#16a34a", color: "white" },
                iconTheme: { primary: "white", secondary: "#16a34a" },
              },
              error: {
                style: { background: "#dc2626", color: "white" },
              },
            }}
          />
        </LoadingProvider>
      </CartProvider>
    </Router>
  );
}

export default App;
