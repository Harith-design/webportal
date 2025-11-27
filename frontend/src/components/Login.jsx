import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "./Login.css";
import { useLoading } from "../context/LoadingContext";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // 🔹 Call your login API
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      const user = response.data.user || {};
      const token = response.data.token;
      const role = user.role ? String(user.role).toLowerCase() : "user";

      // 🔹 simple expiry: 2 hours from now (matches your older pattern)
      const expiry = Date.now() + 2 * 60 * 60 * 1000;

      // ✅ Store in localStorage (for components that read from here)
      localStorage.setItem("token", token);
      localStorage.setItem("token_expiry", String(expiry));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("user_role", role);

      // ✅ Also store in sessionStorage (in case some old code used this)
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("token_expiry", String(expiry));
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("user_role", role);

      // 🔹 Go to dashboard
      navigate("/dashboardpage");
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage("❌ " + (error.response.data.message || "Login failed"));
      } else {
        setMessage("⚠️ " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        <div className="login-left">
          <h1>
            <span className="block text-5xl font-bold">Welcome to</span>
            <span className="block text-2xl font-light">
              GIIB Customer Portal
            </span>
          </h1>
        </div>

        <div className="login-right">
          <img src="/giib-logo.png" alt="GIIB Logo" className="h-11 w-10" />

          <form className="max-w-[300px]" onSubmit={handleSubmit}>
            <h2>User Login</h2>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="glass-input"
              required
            />

            {/* Password input + icon */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input pr-10"
                required
              />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 bottom-4 flex items-center text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            </div>

            <button type="submit" className="btn-submit">
              Login
            </button>

            {message && <p className="error-text">{message}</p>}

            <div className="login-options">
              <a href="/forgotpassword" className="forgot-password">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
