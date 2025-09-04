import React, { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../services/api"; // ✅ use your api.js wrapper

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Extract token & email from query params
  const query = new URLSearchParams(location.search);
  const token = query.get("token");
  const email = query.get("email");

  useEffect(() => {
    if (!token || !email) {
      setMessage("Invalid or expired reset link.");
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }

    if (!token || !email) {
      setMessage("Invalid reset link.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      setMessage(res.data.message || "Password reset successfully! Redirecting...");
      
      // ✅ redirect to login after 2s
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center">
      <div className="w-full max-w-xl p-10 bg-white rounded-2xl shadow-md">
        {/* ✅ Key icon on top */}
        <div className="flex justify-center items-center mb-3">
          <KeyRound size={48} className="text-blue-600 mb-3" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create New Password
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* ✅ Success / Error Message */}
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}

        {/* Back to Login */}
        <p className="text-left text-sm text-gray-600 mt-4">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
