import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // ✅ import navigate hook
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({ userId: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();  // ✅ initialize

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboardpage");   // ✅ use navigate instead of window.location.href
      } else setMessage("❌ " + (data.message || "Login failed"));
    } catch (error) {
      setMessage("⚠️ " + error.message);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        {/* Left side */}
        <div className="login-left">
          <h1>Welcome to GIIB Customer Portal</h1>
          {/* <p>Your company tagline or logo goes here.</p> */}
        </div>

        {/* Right side */}
        <div className="login-right">
          <form onSubmit={handleSubmit}>
            <h2>User Login</h2>

            <input
              type="text"
              name="userId"
              placeholder="User ID"
              value={formData.userId}
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

            <button type="submit" className="btn-submit">Login</button>

            {message && <p className="error-text">{message}</p>}

            <div class="login-options">
              <label class="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" class="forgot-password">Forgot password?</a>
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
