import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoadingProvider } from "./context/LoadingContext";
import { Toaster } from "react-hot-toast"; 

// Public pages
import SignUp from "./components/Signup";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

// Protected pages
import DashboardPage from "./components/DashboardPage";
import OrdersPage from "./components/Orders";
import PlaceOrderPage from "./components/OrderForm";
import CustomerList from "./components/CustomerList";
import InvoicesPage from "./components/Invoices"; 
import OrderDetails from "./components/OrderDetails"; 
import InvoiceDetails from "./components/InvoiceDetails";
import EditProfile from "./components/EditProfile";
import UserList from "./components/UserList";
import EditUser from "./components/EditUser";

// Layout & helpers
import DashboardLayout from "./components/DashboardLayout";
import './App.css';
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
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* <Route path="/dashboardpage" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orderform" element={<PlaceOrderPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/editprofile" element={<EditProfile />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/edituser/:id" element={<EditUser />} /> */}

        {/* Protected Dashboard routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboardpage" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orderform" element={<PlaceOrderPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/editprofile" element={<EditProfile />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/edituser/:id" element={<EditUser />} />
        </Route>

        {/* Dashboard pages – now public */}
        {/* <Route element={<DashboardLayout />}>
          <Route path="/dashboardpage" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orderform" element={<PlaceOrderPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/editprofile" element={<EditProfile />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/edituser/:id" element={<EditUser />} />
        </Route> */}

        {/* Catch-all fallback */}
        <Route path="*" element={<Login />} />
        </Routes>

        {/* ✅ Add this at the bottom so toast works globally */}
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
    </Router>
  );
}

export default App;
