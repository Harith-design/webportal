import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckbox = (e) => setRememberMe(e.target.checked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({
        ...formData,
        remember_me: rememberMe,
      });

      const now = new Date().getTime();

      if (rememberMe) {
        // ✅ Save token in localStorage + 2 weeks expiry
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("token_expiry", now + 14 * 24 * 60 * 60 * 1000);
      } else {
        // ✅ Save token in sessionStorage + 2 hours expiry
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("token_expiry", now + 2 * 60 * 60 * 1000);
      }

      navigate("/dashboardpage");
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage("❌ " + (error.response.data.message || "Login failed"));
      } else {
        setMessage("⚠️ " + error.message);
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        <div className="login-left">
          <h1>Welcome to GIIB Customer Portal</h1>
        </div>

        <div className="login-right">
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

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="glass-input"
              required
            />

            <button type="submit" className="btn-submit">
              Login
            </button>

            {message && <p className="error-text">{message}</p>}

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleCheckbox}
                />{" "}
                Remember me
              </label>
              <a href="/forgotpassword" className="forgot-password">
                Forgot password?
              </a>
            </div>

            <p className="signup-text">
              Don't have an account? <a href="/signup">Create Account</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
