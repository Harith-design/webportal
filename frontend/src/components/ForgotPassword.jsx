import React, { useState } from "react";
import { KeyRound } from "lucide-react"; // ✅ Import key icon

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send email to backend API
    console.log("Reset password link sent to:", email);
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center">
      <div className="w-full max-w-xl p-10 bg-white rounded-2xl shadow-md">
            {/* ✅ Key icon on top */}
            <div className="flex justify-center items-center mb-3">
              <KeyRound size={48} className="text-blue-600 mb-3" />
            </div>
        {/* Title */}
        <h2 className="text-2xl font-semibold text-center mb-6">Forgot Password?</h2>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Reset Password
          </button>
        </form>

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

export default ForgotPassword;
