import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "./Login.css";
import { useLoading } from "../context/LoadingContext";
import { Eye, EyeOff } from "lucide-react"; // 👈 lucide icons

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle
  const navigate = useNavigate();
  const { setLoading } = useLoading();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckbox = (e) => setRememberMe(e.target.checked);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await login({
        ...formData,
        remember_me: rememberMe,
      });

      const now = new Date().getTime();

      if (rememberMe) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("token_expiry", now + 14 * 24 * 60 * 60 * 1000);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      } else {
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("token_expiry", now + 2 * 60 * 60 * 1000);
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
      }




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
    <div className="min-h-screen w-screen flex justify-center items-center p-11">
      <div className="w-full h-96 max-w-3xl bg-white rounded-2xl shadow-lg flex md:flex-row overflow-hidden">
        <div className="hidden flex-1 text-white sm:flex flex-row p-8 justify-center items-center" style={{background: "radial-gradient(circle at 10% 60%, #f90000, #0750e4)"}}>
          <h1>
            <span className="block text-5xl font-bold">Welcome to</span>
            <span className="block text-2xl font-light">
              GIIB Customer Portal
            </span>
          </h1>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center relative">
          <img src="/giib-logo.png" alt="GIIB Logo" className="h-11 w-10 absolute top-4 right-4" />
          <form className="space-y-4 p-8" onSubmit={handleSubmit}>
            <h2 className="mb-3">User Login</h2>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
              required
            />

            {/* 👇 Password input with lucide Eye toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn-submit">
              Login
            </button>

            {message && <p className="error-text">{message}</p>}

            <div className="text-right mt-2">
              {/* <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleCheckbox}
                />{" "}
                Remember me
              </label> */}
              <a href="/forgotpassword" className="forgot-password">
                Forgot password?
              </a>
            </div>

            {/* <p className="signup-text">
              Don't have an account? <a href="/signup">Create Account</a>
            </p> */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
